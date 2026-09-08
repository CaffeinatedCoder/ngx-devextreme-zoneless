/*
 * Public API surface of ngx-devextreme-zoneless — re-exports every secondary
 * entry point for convenient single-import usage. None of them carries widget
 * runtime (wrapper classes are type-only imports; see `injectDxHost`), and an
 * `export *` barrel over separate FESMs was measured not to re-couple them
 * under code splitting, so importing from here costs nothing over the family
 * entry points: `ngx-devextreme-zoneless/core`, `/editors`, `/navigation`,
 * `/overlays`, `/data`, `/data-source`, `/visualization`.
 */

export * from 'ngx-devextreme-zoneless/core';
export * from 'ngx-devextreme-zoneless/editors';
export * from 'ngx-devextreme-zoneless/navigation';
export * from 'ngx-devextreme-zoneless/overlays';
export * from 'ngx-devextreme-zoneless/data';
export * from 'ngx-devextreme-zoneless/data-source';
export * from 'ngx-devextreme-zoneless/visualization';

// Aggregate
export { DX_SIGNAL_DIRECTIVES } from './lib/all';
