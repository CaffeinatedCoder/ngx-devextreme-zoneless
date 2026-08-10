/*
 * Public API surface of ngx-devextreme-zoneless/core — the binding engine,
 * type system and directive bases, without any per-widget directives.
 */

// Core type system
export type {
    DxWidget,
    DxPropertiesOf,
    DxOptionName,
    DxOptionValue,
    DxEventName,
    DxEventArg,
    DxSubscribable,
    DxHostComponent,
    DxInstanceOf,
    DxHostProperties,
    DxHostOptionName,
    DxHostOptionValue,
    DxHostEventName,
    DxHostEventArg,
    DxHostValue,
    DxHostRef,
    DxOptionChangedArgs,
    DxInitializedArgs,
} from './lib/types';

// Shared editor value types
export type {
    DxDateValue,
    DxDateRange,
    DxNumberRange,
    DxFilterExpression,
} from './lib/value-types';

// Equality helpers
export { dxStructuralEquals, dxShallowObjectEquals } from './lib/equality';
export type { DxEqualityFn } from './lib/equality';

// Readiness
export { onDxWidgetReady } from './lib/ready';
export type { DxWidgetReadyCleanup } from './lib/ready';

// Binding engine (composition API)
export { bindDxState, bindDxOption, dxOptionAdapter } from './lib/binding';
export type {
    DxAdapterEventName,
    DxBindingAdapter,
    DxBindingOptions,
    DxInitialSync,
} from './lib/binding';

// Signal factories (composition API)
export {
    dxOptionSignal,
    dxEventSignal,
    dxInstanceSignal,
    injectDxInstance,
} from './lib/signals';
export type { DxOptionSignalOptions } from './lib/signals';

// Data loading (signals → DataSource)
export { dxArrayStoreSource, dxReloadOn } from './lib/data-source';
export type { DxArrayStoreSourceOptions, DxReloadTarget } from './lib/data-source';

// Directive bases (for building adapters for components not covered out of the box)
export {
    DxBindingDirectiveBase,
    DxValueDirectiveBase,
    DxSelectedRowKeysDirectiveBase,
    DxSelectedItemKeysDirectiveBase,
    DxSelectedIndexDirectiveBase,
    DxVisibleDirectiveBase,
} from './lib/bases';
