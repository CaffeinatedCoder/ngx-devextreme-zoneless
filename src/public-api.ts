/*
 * Public API surface of ngx-devextreme-zoneless — re-exports every secondary
 * entry point for convenient single-import usage. Bundlers drop the families
 * you do not use (module-level tree-shaking across the entry points); for
 * explicit control, import from the per-family entry points directly:
 * `ngx-devextreme-zoneless/core`, `/editors`, `/navigation`, `/overlays`,
 * `/data`, `/visualization`.
 */

export * from 'ngx-devextreme-zoneless/core';
export * from 'ngx-devextreme-zoneless/editors';
export * from 'ngx-devextreme-zoneless/navigation';
export * from 'ngx-devextreme-zoneless/overlays';
export * from 'ngx-devextreme-zoneless/data';
export * from 'ngx-devextreme-zoneless/visualization';

// Aggregate
export { DX_SIGNAL_DIRECTIVES } from './lib/all';
