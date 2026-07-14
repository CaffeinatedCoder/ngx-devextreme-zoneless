import {
    assertInInjectionContext,
    DestroyRef,
    inject,
    Injector,
    signal,
    type ProviderToken,
    type Signal,
    type WritableSignal,
} from '@angular/core';
import { bindDxOption, type DxBindingOptions } from './binding';
import { onDxWidgetReady } from './ready';
import type {
    DxHostComponent,
    DxHostEventArg,
    DxHostEventName,
    DxHostOptionName,
    DxHostOptionValue,
    DxHostRef,
    DxInstanceOf,
} from './types';

/** Options for {@link dxOptionSignal}. */
export interface DxOptionSignalOptions<TValue> extends DxBindingOptions<TValue> {
    /**
     * Value the signal holds until the widget is ready. When provided, the
     * signal is also pushed into the widget on attach; without it, the
     * widget's current option value is pulled into the signal instead.
     */
    readonly initialValue?: TValue;
}

/**
 * Creates a writable signal that is two-way bound to a widget option — the
 * universal escape hatch that works with *every* option of *every*
 * devextreme-angular component, fully typed from DevExtreme's `Properties`:
 *
 * ```ts
 * private readonly textBox = inject(DxTextBoxComponent, { self: true });
 * readonly placeholder = dxOptionSignal(this.textBox, 'placeholder');
 * readonly mode = dxOptionSignal(this.textBox, 'mode', { initialValue: 'search' });
 * ```
 */
export function dxOptionSignal<
    THost extends DxHostComponent,
    TName extends DxHostOptionName<THost>,
>(
    hostRef: DxHostRef<THost>,
    optionName: TName,
    options: DxOptionSignalOptions<DxHostOptionValue<THost, TName>> & {
        initialValue: DxHostOptionValue<THost, TName>;
    },
): WritableSignal<DxHostOptionValue<THost, TName>>;
export function dxOptionSignal<
    THost extends DxHostComponent,
    TName extends DxHostOptionName<THost>,
>(
    hostRef: DxHostRef<THost>,
    optionName: TName,
    options?: DxOptionSignalOptions<DxHostOptionValue<THost, TName>>,
): WritableSignal<DxHostOptionValue<THost, TName> | undefined>;
export function dxOptionSignal<
    THost extends DxHostComponent,
    TName extends DxHostOptionName<THost>,
>(
    hostRef: DxHostRef<THost>,
    optionName: TName,
    options: DxOptionSignalOptions<DxHostOptionValue<THost, TName>> = {},
): WritableSignal<DxHostOptionValue<THost, TName> | undefined> {
    type TValue = DxHostOptionValue<THost, TName>;
    const source = signal<TValue | undefined>(options.initialValue);
    const equal = options.equal;
    bindDxOption<THost, TName, TValue | undefined>(hostRef, optionName, source, {
        ...options,
        // Widen the caller's comparer to the `undefined`-including signal type.
        equal:
            equal === undefined
                ? undefined
                : (a, b) => (a === undefined || b === undefined ? Object.is(a, b) : equal(a, b)),
        // `undefined` initial value ⇒ pull from the widget once it is ready.
        initialSync: options.initialSync ?? 'auto',
    });
    return source;
}

/**
 * Creates a read-only signal holding the latest payload of a widget event
 * (`undefined` until the event fires for the first time). Event names and
 * payload types are derived from DevExtreme's `onXxx` handler options:
 *
 * ```ts
 * readonly focusOut = dxEventSignal(this.textBox, 'focusOut');
 * readonly rowClick = dxEventSignal(this.grid, 'rowClick');
 * ```
 */
export function dxEventSignal<
    THost extends DxHostComponent,
    TEvent extends DxHostEventName<THost>,
>(
    hostRef: DxHostRef<THost>,
    eventName: TEvent,
    injector?: Injector,
): Signal<DxHostEventArg<THost, TEvent> | undefined> {
    type TArg = DxHostEventArg<THost, TEvent>;
    if (injector === undefined) {
        assertInInjectionContext(dxEventSignal);
    }
    const resolvedInjector = injector ?? inject(Injector);
    const latest = signal<TArg | undefined>(undefined);

    onDxWidgetReady(
        hostRef,
        (instance) => {
            const handler = (eventArgs: TArg): void => latest.set(eventArgs);
            instance.on(eventName, handler);
            resolvedInjector.get(DestroyRef).onDestroy(() => instance.off(eventName, handler));
        },
        resolvedInjector,
    );
    return latest.asReadonly();
}

/**
 * Injects a devextreme-angular component from the current element and exposes
 * its widget instance as a signal that becomes non-`undefined` once the
 * widget has been created:
 *
 * ```ts
 * readonly grid = injectDxInstance(DxDataGridComponent);
 * ```
 */
export function injectDxInstance<THost extends DxHostComponent>(
    token: ProviderToken<THost>,
): Signal<DxInstanceOf<THost> | undefined> {
    const host = inject(token, { self: true, optional: true }) ?? inject(token);
    const instance = signal<DxInstanceOf<THost> | undefined>(undefined);
    onDxWidgetReady(host, (widget) => instance.set(widget));
    return instance.asReadonly();
}
