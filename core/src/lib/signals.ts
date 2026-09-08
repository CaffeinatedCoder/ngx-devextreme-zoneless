import {
    assertInInjectionContext,
    inject,
    Injector,
    signal,
    type ProviderToken,
    type Signal,
    type WritableSignal,
} from '@angular/core';
import { NestedOptionHost } from 'devextreme-angular/core';
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
 *
 * Every fire notifies consumers, even when DevExtreme reuses or mutates the
 * event-args object — an event stream never dedupes. With a getter `hostRef`
 * the subscription follows widget re-creation; the last payload is kept
 * across the gap.
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
    const latest = signal<TArg | undefined>(undefined, { equal: () => false });

    onDxWidgetReady(
        hostRef,
        (instance) => {
            const handler = (eventArgs: TArg): void => latest.set(eventArgs);
            instance.on(eventName, handler);
            return () => instance.off(eventName, handler);
        },
        resolvedInjector,
    );
    return latest.asReadonly();
}

/**
 * Exposes the DevExtreme widget instance behind a host reference as a signal
 * that is `undefined` until the widget exists. With a getter `hostRef` (e.g.
 * a `viewChild(...)` signal) it follows widget re-creation: the signal resets
 * to `undefined` when the widget goes away and yields the new instance once
 * it is ready.
 *
 * ```ts
 * private readonly gridRef = viewChild(DxDataGridComponent);
 * readonly grid = dxInstanceSignal(this.gridRef);
 * ```
 */
export function dxInstanceSignal<THost extends DxHostComponent>(
    hostRef: DxHostRef<THost>,
    injector?: Injector,
): Signal<DxInstanceOf<THost> | undefined> {
    if (injector === undefined) {
        assertInInjectionContext(dxInstanceSignal);
    }
    const resolvedInjector = injector ?? inject(Injector);
    const instance = signal<DxInstanceOf<THost> | undefined>(undefined);
    onDxWidgetReady(
        hostRef,
        (widget) => {
            instance.set(widget);
            return () => instance.set(undefined);
        },
        resolvedInjector,
    );
    return instance.asReadonly();
}

/**
 * Injects the devextreme-angular component hosting the *current element*
 * without naming its class — and therefore without a runtime import of
 * `devextreme-angular/ui/<widget>`:
 *
 * ```ts
 * const host = injectDxHost<DxTextBoxComponent>(); // `DxTextBoxComponent` is a type-only import
 * ```
 *
 * Every generated wrapper lists `NestedOptionHost` in its own `providers` and
 * calls `setHost(this)` in its constructor (verified against devextreme-angular
 * 26.1.4 for all forty adapted widgets), so the token resolves at the widget's
 * element injector and points at the wrapper itself. Nested option components
 * (`dxo-*`, `dxi-*`) get their *own* instance on their own element and never
 * overwrite the widget's. The injection is strictly `{ self: true }`.
 *
 * This is what every shipped directive uses, and the reason is bundle
 * isolation rather than taste: a value import of the wrapper class is a
 * module-level edge from the directive's FESM to the widget, and esbuild
 * assigns files to chunks by reachability — so a widget that is live for one
 * lazy route becomes part of every other route's closure that shares the FESM.
 * With the class as a type-only import the edge does not exist. The caller
 * names the type; the directive's selector (`dx-text-box[dxValue]`) is what
 * makes it true.
 */
export function injectDxHost<THost extends DxHostComponent>(): THost {
    return inject(NestedOptionHost, { self: true }).getHost() as unknown as THost;
}

/**
 * Injects a devextreme-angular component from the *current element* and
 * exposes its widget instance as a signal that becomes non-`undefined` once
 * the widget has been created:
 *
 * ```ts
 * readonly grid = injectDxInstance(DxDataGridComponent);
 * ```
 *
 * The injection is strictly `{ self: true }` — it throws when the current
 * element does not carry the component. (Versions before 2.0 silently fell
 * back to ancestor injection, which could grab a *parent* widget of the same
 * type; use `dxInstanceSignal(viewChild(...))` or an explicit `inject()` to
 * reach a widget elsewhere in the template.)
 */
export function injectDxInstance<THost extends DxHostComponent>(
    token: ProviderToken<THost>,
): Signal<DxInstanceOf<THost> | undefined> {
    return dxInstanceSignal(inject(token, { self: true }));
}
