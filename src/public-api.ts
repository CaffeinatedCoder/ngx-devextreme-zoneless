/*
 * Public API surface of ngx-devextreme-zoneless
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
} from './lib/core/types';

// Equality helpers
export { dxStructuralEquals, dxShallowObjectEquals } from './lib/core/equality';
export type { DxEqualityFn } from './lib/core/equality';

// Readiness
export { onDxWidgetReady } from './lib/core/ready';

// Binding engine (composition API)
export { bindDxState, bindDxOption, dxOptionAdapter } from './lib/core/binding';
export type {
    DxBindingAdapter,
    DxBindingOptions,
    DxInitialSync,
} from './lib/core/binding';

// Signal factories (composition API)
export { dxOptionSignal, dxEventSignal, injectDxInstance } from './lib/core/signals';
export type { DxOptionSignalOptions } from './lib/core/signals';

// Directive bases (for building adapters for components not covered out of the box)
export {
    DxBindingDirectiveBase,
    DxValueDirectiveBase,
    DxSelectedRowKeysDirectiveBase,
    DxSelectedItemKeysDirectiveBase,
    DxSelectedIndexDirectiveBase,
    DxVisibleDirectiveBase,
} from './lib/directives/bases';

// Editor directives
export * from './lib/directives/editors';

// Navigation directives
export * from './lib/directives/navigation';

// Overlay directives
export * from './lib/directives/overlays';

// Data-component directives
export * from './lib/directives/data';

// Visualization directives
export * from './lib/directives/visualization';

// Aggregate
export { DX_SIGNAL_DIRECTIVES } from './lib/directives/all';
