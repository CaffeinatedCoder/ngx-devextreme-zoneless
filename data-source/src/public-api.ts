/*
 * Public API surface of ngx-devextreme-zoneless/data-source — signals in,
 * DevExtreme `DataSource` out: `dxArrayStoreSource`, `dxReloadOn` and the
 * `dxRemoteStore` remote-data contract.
 *
 * Its own entry point, apart from `core`, for one measured reason: these
 * helpers construct `DataSource` and `CustomStore` instances, so they carry a
 * runtime import of DevExtreme's data layer — and `devextreme` declares no
 * `sideEffects: false`, so that import cannot be shaken. Kept in `core`, it
 * put ~40 KB (minified) into every chunk that used any directive at all, even
 * a text box that never sees a data source. Here, only a chunk that loads
 * data pays for the data layer; the main entry point re-exports this one.
 */

// Data loading (signals → DataSource)
export { dxArrayStoreSource, dxReloadOn } from './lib/data-source';
export type { DxArrayStoreSourceOptions, DxReloadTarget } from './lib/data-source';

// Remote data (resource()-style loading state over a DataSource)
export { dxRemoteStore, dxLoadOptionsParams } from './lib/remote';
export type { DxRemoteLoader, DxRemoteStore, DxRemoteStoreOptions } from './lib/remote';
