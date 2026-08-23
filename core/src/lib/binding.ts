import {
    assertInInjectionContext,
    effect,
    inject,
    Injector,
    untracked,
    type WritableSignal,
} from '@angular/core';
import { dxStructuralEquals, type DxEqualityFn } from './equality';
import { onDxWidgetReady } from './ready';
import type {
    DxEventName,
    DxHostComponent,
    DxHostOptionName,
    DxHostOptionValue,
    DxHostRef,
    DxInstanceOf,
    DxOptionChangedArgs,
    DxPropertiesOf,
    DxWidget,
} from './types';

/** The event names of a widget *instance*, derived from its `Properties` bag. */
export type DxAdapterEventName<TInstance> = DxEventName<DxPropertiesOf<TInstance>>;

/**
 * Describes how a bound value is read from / written to a widget and which
 * widget events indicate that it may have changed outside Angular.
 *
 * `bindDxOption` provides the standard option-based adapter; custom adapters
 * cover method-based state such as chart point selection or tree-view
 * selection.
 */
export interface DxBindingAdapter<TInstance extends DxWidget, TValue> {
    /**
     * Widget events (`'optionChanged'`, `'selectionChanged'`, ...) that may
     * affect the bound value. Names are checked against the widget's
     * `Properties` declaration — a typo or an event a DevExtreme upgrade
     * renamed is a compile error.
     */
    readonly events: readonly DxAdapterEventName<TInstance>[];
    /** Reads the current value from the widget. */
    read(instance: TInstance): TValue;
    /** Writes a new value to the widget. */
    write(instance: TInstance, value: TValue): void;
    /** Optional filter deciding whether a received event affects this binding. */
    accept?(eventName: DxAdapterEventName<TInstance>, eventArgs: unknown): boolean;
    /**
     * Re-read the widget immediately after every write and fold the result
     * back into the signal. For widgets that normalize or partially reject a
     * written value *synchronously* — e.g. selection APIs that silently skip
     * unknown keys — the re-entrancy latch drops the events they fire during
     * the write, so without this re-read the signal keeps a value the widget
     * rejected and structural equality suppresses the read that would fix it.
     *
     * Leave unset where a post-write read can be transiently incomplete: a
     * grid's `state()` is `{}` until the first render, so re-reading right
     * after a restore would wipe the very state the write carried.
     */
    readonly reReadAfterWrite?: boolean;
}

/** Which side wins the initial synchronization when the binding attaches. */
export type DxInitialSync =
    /** Push the signal's current value into the widget (unless it is `undefined`). */
    | 'signal'
    /** Pull the widget's current value into the signal. */
    | 'widget'
    /** Push if the signal holds a value other than `undefined`, otherwise pull. */
    | 'auto';

/** Tuning options for a two-way binding. */
export interface DxBindingOptions<TValue> {
    /** Equality used to suppress echo updates. Defaults to {@link dxStructuralEquals}. */
    readonly equal?: DxEqualityFn<NoInfer<TValue>>;
    /**
     * Debounce (milliseconds) applied to the widget → signal direction, e.g.
     * to tame per-keystroke `valueChanged` events. May be reactive.
     * A read still pending when the binding is torn down is dropped — the
     * signal keeps the last applied value.
     */
    readonly debounceMs?: number | (() => number);
    /** Initial synchronization strategy. Defaults to `'auto'`. */
    readonly initialSync?: DxInitialSync;
    /** Explicit injector when called outside an injection context. */
    readonly injector?: Injector;
}

/**
 * Wires a writable signal to widget state described by an adapter, in both
 * directions, with echo suppression and automatic teardown on destroy.
 *
 * - widget → signal: adapter events trigger a (optionally debounced) read;
 *   the signal is only written when the value structurally changed. Because
 *   the write is a plain signal write, zoneless change detection is scheduled
 *   without any `NgZone` involvement.
 * - signal → widget: an `effect` pushes changes into the widget, again only
 *   when the value actually differs.
 *
 * When `hostRef` is a getter (e.g. a `viewChild(...)` signal) the binding
 * survives widget re-creation: if the host component is destroyed and a new
 * one appears, the binding re-attaches and the initial synchronization runs
 * again — a signal holding state therefore restores it into the new widget.
 */
export function bindDxState<THost extends DxHostComponent, TValue>(
    hostRef: DxHostRef<THost>,
    source: WritableSignal<TValue>,
    adapter: DxBindingAdapter<DxInstanceOf<THost>, TValue>,
    options: DxBindingOptions<TValue> = {},
): void {
    if (options.injector === undefined) {
        assertInInjectionContext(bindDxState);
    }
    const injector = options.injector ?? inject(Injector);
    const equal = options.equal ?? (dxStructuralEquals as DxEqualityFn<TValue>);
    const debounceMs =
        typeof options.debounceMs === 'function'
            ? options.debounceMs
            : (): number => (options.debounceMs as number | undefined) ?? 0;
    const initialSync = options.initialSync ?? 'auto';

    /**
     * Re-entrancy latch. Both directions run synchronous DevExtreme code that
     * may fire events inline; the latch prevents those from re-entering the
     * binding while structural equality handles the asynchronous echo path.
     */
    let syncing = false;
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;

    const guarded = (work: () => void): void => {
        syncing = true;
        try {
            work();
        } finally {
            syncing = false;
        }
    };

    onDxWidgetReady(
        hostRef,
        (instance) => {
            const applyFromWidget = (): void => {
                const value = adapter.read(instance);
                if (!equal(untracked(source), value)) {
                    guarded(() => source.set(value));
                }
            };
            /**
             * Writes into the widget and — when the adapter opted in — folds
             * the widget's *synchronous* reaction back into the signal. The
             * latch drops the events fired during the write, so a widget that
             * normalized or partially rejected the value would otherwise
             * diverge from the signal silently.
             */
            const writeToWidget = (value: TValue): void => {
                guarded(() => adapter.write(instance, value));
                if (adapter.reReadAfterWrite === true) {
                    applyFromWidget();
                }
            };

            // --- initial synchronization -------------------------------------
            const initial = untracked(source);
            const pushInitial =
                initialSync === 'signal' ||
                (initialSync === 'auto' && initial !== undefined);
            if (pushInitial) {
                if (initial !== undefined && !equal(adapter.read(instance), initial)) {
                    writeToWidget(initial);
                }
            } else {
                const widgetValue = adapter.read(instance);
                if (!equal(initial, widgetValue)) {
                    guarded(() => source.set(widgetValue));
                }
            }

            // --- widget → signal ----------------------------------------------
            const detachers: (() => void)[] = [];
            for (const eventName of adapter.events) {
                const handler = (eventArgs: unknown): void => {
                    if (syncing) {
                        return;
                    }
                    if (adapter.accept !== undefined && !adapter.accept(eventName, eventArgs)) {
                        return;
                    }
                    const wait = debounceMs();
                    if (wait > 0) {
                        if (debounceTimer !== undefined) {
                            clearTimeout(debounceTimer);
                        }
                        debounceTimer = setTimeout(applyFromWidget, wait);
                    } else {
                        applyFromWidget();
                    }
                };
                instance.on(eventName, handler);
                detachers.push(() => instance.off(eventName, handler));
            }

            // --- signal → widget ----------------------------------------------
            const pusher = effect(
                () => {
                    const value = source();
                    if (syncing || value === undefined) {
                        return;
                    }
                    untracked(() => {
                        if (!equal(adapter.read(instance), value)) {
                            writeToWidget(value);
                        }
                    });
                },
                { injector },
            );
            detachers.push(() => pusher.destroy());

            return () => {
                // A pending debounced read must not fire into a dead widget.
                // Its trailing value is deliberately dropped — the signal
                // still holds the last applied state.
                if (debounceTimer !== undefined) {
                    clearTimeout(debounceTimer);
                    debounceTimer = undefined;
                }
                for (let i = detachers.length - 1; i >= 0; i--) {
                    detachers[i]?.();
                }
            };
        },
        injector,
    );
}

/**
 * The standard adapter: binds a signal to a single widget *option*, listening
 * to `optionChanged` filtered by option name. Nested changes
 * (`fullName: 'formData.firstName'`) are matched via their root name.
 */
export function dxOptionAdapter<
    THost extends DxHostComponent,
    TName extends DxHostOptionName<THost>,
    TValue,
>(optionName: TName): DxBindingAdapter<DxInstanceOf<THost>, TValue> {
    return {
        // Every DevExtreme widget declares `onOptionChanged`; the cast is
        // only needed because `THost` is an unresolved type parameter here.
        events: ['optionChanged'] as unknown as readonly DxAdapterEventName<
            DxInstanceOf<THost>
        >[],
        read: (instance) => instance.option(optionName) as TValue,
        write: (instance, value) => {
            (instance.option as (name: string, value: unknown) => void)(optionName, value);
        },
        accept: (_eventName, eventArgs) => {
            const args = eventArgs as DxOptionChangedArgs;
            return args.name === optionName || args.fullName === optionName;
        },
    };
}

/**
 * Two-way binds a writable signal to a widget option — the strongly-typed
 * workhorse behind all option-based directives of this library, and directly
 * usable for any option of any DevExtreme component:
 *
 * ```ts
 * const grid = viewChild(DxDataGridComponent<Order, number>);
 * readonly keys = signal<number[]>([]);
 * constructor() {
 *   bindDxOption(this.grid, 'selectedRowKeys', this.keys);
 * }
 * ```
 */
export function bindDxOption<
    THost extends DxHostComponent,
    TName extends DxHostOptionName<THost>,
    TValue extends DxHostOptionValue<THost, TName> | undefined,
>(
    hostRef: DxHostRef<THost>,
    optionName: TName,
    source: WritableSignal<TValue>,
    options?: DxBindingOptions<TValue>,
): void {
    bindDxState(hostRef, source, dxOptionAdapter<THost, TName, TValue>(optionName), options);
}
