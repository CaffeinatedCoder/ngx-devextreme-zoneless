/**
 * Core structural typings that connect the three worlds involved in a binding:
 *
 *  1. the DevExtreme widget instance (`dxTextBox`, `dxDataGrid<TRowData, TKey>`, ...),
 *  2. the devextreme-angular host component (`DxTextBoxComponent`, ...) sitting on
 *     the same element, and
 *  3. Angular signals.
 *
 * Everything is *derived* from DevExtreme's own `Properties` declarations, so
 * option names, option value types and event payload types automatically follow
 * the installed DevExtreme version.
 */
import type { Component as DxCoreComponent } from 'devextreme/core/component';

/* ------------------------------------------------------------------------ *
 *  Widget side
 * ------------------------------------------------------------------------ */

/**
 * Any DevExtreme widget instance. All DevExtreme widgets derive from
 * `Component<TProperties>` which carries the full option bag as its generic
 * argument — that is the anchor for every type computation below.
 */
export type DxWidget<TProperties = object> = DxCoreComponent<TProperties>;

/** Extracts the `Properties` bag of a DevExtreme widget instance. */
export type DxPropertiesOf<TInstance> =
    TInstance extends DxCoreComponent<infer TProperties> ? TProperties : never;

/**
 * The names of all *data* options of a widget — every key of its `Properties`
 * bag except the `onXxx` event handler properties.
 *
 * Example: `DxOptionName<Properties of dxTextBox>` ⇒
 * `'value' | 'placeholder' | 'maxLength' | 'mode' | ...`
 */
export type DxOptionName<TProperties> = Exclude<keyof TProperties & string, `on${string}`>;

/** The declared type of a single widget option. */
export type DxOptionValue<
    TProperties,
    TName extends DxOptionName<TProperties>,
> = TProperties[TName & keyof TProperties];

/**
 * All event names a widget supports, derived from its `onXxx` handler options
 * via template-literal key remapping:
 * `onValueChanged` ⇒ `'valueChanged'`, `onSelectionChanged` ⇒ `'selectionChanged'`, ...
 */
export type DxEventName<TProperties> = keyof {
    [K in keyof TProperties & string as K extends `on${infer TEvent}`
        ? Uncapitalize<TEvent>
        : never]: unknown;
} &
    string;

/** The payload type of a widget event, resolved from the matching `onXxx` handler option. */
export type DxEventArg<
    TProperties,
    TEvent extends DxEventName<TProperties>,
> = `on${Capitalize<TEvent>}` extends infer THandler extends keyof TProperties
    ? NonNullable<TProperties[THandler]> extends (e: infer TArg) => unknown
        ? TArg
        : never
    : never;

/* ------------------------------------------------------------------------ *
 *  Angular host side
 * ------------------------------------------------------------------------ */

/** Minimal subscribable contract satisfied by Angular's `EventEmitter`. */
export interface DxSubscribable<T> {
    subscribe(next: (value: T) => void): { unsubscribe(): void };
}

/**
 * The structural contract every devextreme-angular component
 * (`DxTextBoxComponent`, `DxDataGridComponent<TRowData, TKey>`, ...) fulfils.
 *
 * Note: `instance` is typed non-nullable by devextreme-angular but is only
 * assigned during `ngAfterViewInit`; the readiness helpers in this library
 * account for that.
 */
export interface DxHostComponent<TInstance extends DxWidget = DxWidget> {
    readonly instance: TInstance;
    readonly onInitialized: DxSubscribable<unknown>;
}

/**
 * Extracts the widget instance type of a devextreme-angular host component.
 *
 * Deliberately matches the `instance` member directly instead of
 * `DxHostComponent<infer TInstance>`: some DevExtreme widgets (e.g.
 * `dxDateRangeBox`) derive from `Omit<...>`-based intersection bases, which
 * makes TypeScript's inference through the constrained interface parameter
 * fall back to the constraint and lose the concrete widget type.
 */
export type DxInstanceOf<THost> = THost extends { readonly instance: infer TInstance }
    ? TInstance
    : never;

/** Shorthand: the `Properties` bag of a devextreme-angular host component's widget. */
export type DxHostProperties<THost> = DxPropertiesOf<DxInstanceOf<THost>>;

/** Option names available on a host component's widget. */
export type DxHostOptionName<THost> = DxOptionName<DxHostProperties<THost>>;

/** The value type of a named option on a host component's widget. */
export type DxHostOptionValue<
    THost,
    TName extends DxHostOptionName<THost>,
> = DxOptionValue<DxHostProperties<THost>, TName>;

/** Event names available on a host component's widget. */
export type DxHostEventName<THost> = DxEventName<DxHostProperties<THost>>;

/** The payload type of a named event on a host component's widget. */
export type DxHostEventArg<
    THost,
    TEvent extends DxHostEventName<THost>,
> = DxEventArg<DxHostProperties<THost>, TEvent>;

/**
 * The value type used by the `[(dxValue)]` model of an editor directive:
 * the widget's declared `value` option type without the `undefined` that
 * stems from the option being declared optional.
 * (`dxTextBox` ⇒ `string`, `dxCheckBox` ⇒ `boolean | null`, ...)
 */
export type DxHostValue<THost> = 'value' extends DxHostOptionName<THost>
    ? Exclude<DxHostOptionValue<THost, 'value' & DxHostOptionName<THost>>, undefined>
    : never;

/**
 * A host component reference, or a reactive getter for one (e.g. a
 * `viewChild(DxDataGridComponent)` signal). Getters may return `undefined`
 * until the view is initialized.
 */
export type DxHostRef<THost extends DxHostComponent> =
    | THost
    | (() => THost | undefined | null);

/* ------------------------------------------------------------------------ *
 *  Event payload shapes shared across widgets
 * ------------------------------------------------------------------------ */

/** The relevant subset of DevExtreme's `optionChanged` event payload. */
export interface DxOptionChangedArgs {
    readonly name?: string;
    readonly fullName?: string;
    readonly value?: unknown;
    readonly previousValue?: unknown;
}

/** The relevant subset of DevExtreme's `initialized` event payload. */
export interface DxInitializedArgs<TInstance extends DxWidget = DxWidget> {
    readonly component?: TInstance;
    readonly element?: unknown;
}
