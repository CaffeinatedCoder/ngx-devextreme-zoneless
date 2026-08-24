/*
 * Public API surface of ngx-devextreme-zoneless/forms — the Angular Signal
 * Forms seam.
 *
 * Kept out of the main entry point on purpose: this is the only entry point
 * with a peer dependency outside DevExtreme, and re-exporting it from
 * `ngx-devextreme-zoneless` would make that optional peer mandatory for every
 * consumer. Import from `ngx-devextreme-zoneless/forms` explicitly.
 */

export { DxFieldStateDirectiveBase } from './lib/base';
export * from './lib/forms';
