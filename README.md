# ngx-devextreme-zoneless

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Context7](https://img.shields.io/badge/Context7-Indexed-3B82F6)](https://context7.com/caffeinatedcoder/ngx-devextreme-zoneless)
[![NPM](https://img.shields.io/npm/v/ngx-devextreme-zoneless?label=NPM&color=3B82F6)](https://www.npmjs.com/package/ngx-devextreme-zoneless)

> **Independent community project.** DevExtreme is a registered trademark of
> Developer Express Inc. This library is not affiliated with, endorsed by, or
> sponsored by Developer Express Inc.

Strongly-typed **signal & zoneless change-detection adapters** for
[DevExtreme Angular](https://js.devexpress.com/Angular/) components.

DevExtreme widgets mutate their own state (user typing, row selection, popup
closing, chart point clicks, …) through their internal option system. Under
zoneless change detection nothing tells Angular about those mutations. This
library bridges the gap with **signals**: every adapter writes widget changes
into a signal (which schedules zoneless CD natively) and pushes signal changes
back into the widget — with echo suppression, structural equality, optional
debouncing and automatic teardown.

```
Angular signal  ──effect──▶  widget option / method
Angular signal  ◀──set────  widget event (optionChanged, selectionChanged, …)
```

- **Angular** ≥ 22.1 < 23 (built and verified against Angular 22.2.3, zoneless by default)
- **DevExtreme / devextreme-angular** ≥ 26.1 (built and verified against 26.1.6)
- **TypeScript** 6.0, `strict`, zero `any` in the public surface

> **Why this library exists:** DevExpress officially still requires zone.js.
> As of 2026-08-10 DevExpress is *"considering zoneless Angular support for a
> future release"* (ticket T1328486) — no ETA, and that thread is where an
> invite to test will be announced if a release is set. Running DevExtreme
> zoneless is therefore outside the vendor-supported configuration, and this
> library is the bridge. Its CI (a Playwright suite driving every binding
> through a real zoneless app on every push) is the compatibility net the
> vendor does not provide.

Everything is *derived from DevExtreme's own `Properties` declarations* via
template-literal and conditional types — option names, option value types and
event payload types are string-literal unions that automatically follow the
installed DevExtreme version. A typo'd option name is a compile error.

## Installation

```bash
npm i ngx-devextreme-zoneless
```

## Quick start

```ts
import { Component, signal } from '@angular/core';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import { DxDataGridModule } from 'devextreme-angular/ui/data-grid';
import {
  DxTextBoxValueDirective,
  DxDataGridSelectedRowKeysDirective,
} from 'ngx-devextreme-zoneless';

@Component({
  imports: [DxTextBoxModule, DxDataGridModule,
            DxTextBoxValueDirective, DxDataGridSelectedRowKeysDirective],
  template: `
    <dx-text-box [(dxValue)]="search" [dxValueDebounce]="300" />
    <dx-data-grid [(dxSelectedRowKeys)]="selected" [dataSource]="orders" keyExpr="id">
      <dxo-data-grid-selection mode="multiple" />
    </dx-data-grid>
  `,
})
export class OrdersComponent {
  readonly search = signal('');
  readonly selected = signal<readonly number[]>([]); // TKey inferred as number
  readonly orders = [{ id: 1 }, { id: 2 }];
}
```

Or import everything at once with `DX_SIGNAL_DIRECTIVES` (also available per
family: `DX_VALUE_DIRECTIVES`, `DX_OPENED_DIRECTIVES`, `DX_EDITOR_STATE_DIRECTIVES`,
`DX_NAVIGATION_DIRECTIVES`, `DX_VISIBLE_DIRECTIVES`, `DX_DATA_DIRECTIVES`,
`DX_VISUALIZATION_DIRECTIVES`).

## Choosing your binding style

Three ways to put a value on a DevExtreme editor — the classic one, and the
two this package opens up:

| | A: zone.js + Reactive Forms | B: `[(dxValue)]` | C: `[formField]` + `[dxFieldState]` |
|---|---|---|---|
| Change detection | zone.js (opt-in since v21) | zoneless, native | zoneless, native |
| Vendor support | ✅ the supported config | outside support — netted by this repo's CI | same net |
| Error display | hand-rolled per field/rule | DIY | the widget's own UI, zero template markup |
| Schema-driven readonly/hidden/disabled | manual | — | yes, all three |
| Value type safety | typed forms | end-to-end compile error | restored via `[dxFieldState]` |
| Boilerplate per field | ~5–8 template lines | ~1 line | ~2 lines, flat |

Use **B** for state outside a form (filters, toolbars, settings), **C** for
forms, and **A** only where zone.js is staying anyway. Full code for all
three, the trade-offs, and the two rules that keep them honest:
**[Choosing your binding style](https://github.com/CaffeinatedCoder/ngx-devextreme-zoneless/blob/main/docs/binding-styles.md)**.
The smoke app renders them side by side (`npm run smoke` →
http://localhost:4299/compare) — including the classic syntax's measured
zoneless behaviour: field state arrives (Angular's reactive directives mark
for check on their own); the widget state a CVA never carries is what stays
invisible, and is what the rest of this package covers.

## What is covered

Two-way directives exist wherever a widget has genuine user-mutable state —
`[(dxValue)]` and `[(dxOpened)]` on the editors, selection, focus, editing
state, deferred selection and layout state on the grids and the card view,
navigation, selection and focus on the file manager, expansion on the trees,
`[(dxVisible)]`/`[(dxOpened)]`/`[(dxSelectedIndex)]`/`[(dxSelectedItemKeys)]`
on overlays and navigation, pane sizes and dimensions on the splitter and the
resizable, chart point selection and both axes' visual ranges — each typed to
the widget's real value type. The
**[directive catalog](https://github.com/CaffeinatedCoder/ngx-devextreme-zoneless/blob/main/docs/directives.md)**
is the authoritative table. Components without a dedicated directive
(PivotGrid, Sortable, Menu, …) are fully covered by the
**[composition API](https://github.com/CaffeinatedCoder/ngx-devextreme-zoneless/blob/main/docs/composition-api.md)**:
`dxOptionSignal`, `dxEventSignal` and `bindDxOption` work with **any** option
and event of **any** DevExtreme component, fully typed.

For data, `dxArrayStoreSource` puts a signal-held array behind a `DataSource`,
and `dxRemoteStore` wraps a server load function in `resource()` vocabulary —
loading/error signals, cancellation, signal-driven dependencies — speaking the
complete DevExtreme.AspNet.Data loadOptions wire protocol through your own
`fetch`:
**[data loading and remote data](https://github.com/CaffeinatedCoder/ngx-devextreme-zoneless/blob/main/docs/remote-data.md)**.

## Entry points & tree-shaking

```
ngx-devextreme-zoneless            → everything (re-exports the below)
ngx-devextreme-zoneless/core       → engine, types, bases, signal factories
ngx-devextreme-zoneless/data-source → dxArrayStoreSource, dxReloadOn, dxRemoteStore, dxLoadOptionsParams
ngx-devextreme-zoneless/editors    → [(dxValue)], [(dxOpened)], [(dxZoomLevel)], [(dxInputFieldText)]
ngx-devextreme-zoneless/navigation → [(dxSelectedIndex)], [(dxOpened)], splitter and resizable layout, …
ngx-devextreme-zoneless/overlays   → [(dxVisible)] directives
ngx-devextreme-zoneless/data       → grid/card-view/file-manager/form/scheduler/tree directives, axis + focus readers
ngx-devextreme-zoneless/visualization → chart selection, range selector
ngx-devextreme-zoneless/forms      → [dxFieldState] (Signal Forms; NOT re-exported by the main entry)
```

No entry point of this package carries widget runtime: every directive holds
its `devextreme-angular` wrapper class as a type-only import and resolves the
host through the wrapper's own `NestedOptionHost` provider, so the only widget
code in your bundle is what you import yourself. That matters under code
splitting, where bundlers assign files to chunks by reachability rather than by
use — a directive FESM that imported the grid wrapper would put the grid into
every lazy route touching that FESM as soon as one route used the grid. CI
measures both halves: a static scan of the built entry points rejects any
runtime `devextreme-angular/ui/` import, and a six-chunk probe app asserts that
a chunk importing TreeView selection next to a grid page, or a text-box
directive next to an html-editor one, keeps only its own widget in its static
closure. Importing from the main entry is fine — its `export *` barrel over
separate FESMs was measured not to re-couple them — and the family entry points
exist to make the split explicit.

## Documentation

| Page | What it covers |
|---|---|
| **[Choosing your binding style](https://github.com/CaffeinatedCoder/ngx-devextreme-zoneless/blob/main/docs/binding-styles.md)** | The same form three ways — classic zone.js, `[(dxValue)]`, Signal Forms — with syntax, boilerplate and capability compared |
| **[Directive catalog](https://github.com/CaffeinatedCoder/ngx-devextreme-zoneless/blob/main/docs/directives.md)** | Every two-way directive with its model type: editors, selection, grid state, navigation, overlays, visualization |
| **[Signal Forms](https://github.com/CaffeinatedCoder/ngx-devextreme-zoneless/blob/main/docs/signal-forms.md)** | `[dxFieldState]`: what crosses the vendor CVA, what the directive adds, why the field is named twice, debounce ownership |
| **[Composition API](https://github.com/CaffeinatedCoder/ngx-devextreme-zoneless/blob/main/docs/composition-api.md)** | `dxOptionSignal`/`dxEventSignal`/`bindDxOption` for any component, widget re-creation, custom adapters |
| **[Data loading & remote data](https://github.com/CaffeinatedCoder/ngx-devextreme-zoneless/blob/main/docs/remote-data.md)** | `dxArrayStoreSource`, `dxReloadOn`, and the `dxRemoteStore` contract: cancellation, error/retry, paging, `byKey`, `langParams` |
| **[Binding semantics & type helpers](https://github.com/CaffeinatedCoder/ngx-devextreme-zoneless/blob/main/docs/semantics.md)** | The engine contract: `undefined` vs `null`, initial sync, echo suppression, debounce, teardown, the exported type helpers |

Working on the package itself:
[development](https://github.com/CaffeinatedCoder/ngx-devextreme-zoneless/blob/main/docs/development.md)
— builds, the smoke app's six screens, the e2e suite, the tree-shaking
probe and the server-render measurement.

## Verified, not assumed

Running DevExtreme zoneless is outside the vendor-supported configuration, so
the claim this package makes is exactly as strong as its suite: a Playwright
run drives every directive in the catalog through a real zoneless app — both
directions on every widget, widget re-creation, signal-driven `*dxTemplate`
content, slow and failing endpoints against a wire-protocol stub — on every
push, and a server render of every screen under `@angular/platform-server`
pins that the same app bootstraps, settles and raises nothing on the server
with the vendor's `DxServerModule` in place (measured, not assumed: the vendor
constructs every widget there, and its viz widgets are empty stand-ins — see
[development](https://github.com/CaffeinatedCoder/ngx-devextreme-zoneless/blob/main/docs/development.md)).
The compile-time surface has its own contract tests
([examples/type-tests.ts](examples/type-tests.ts)): option names, event names
and value types are pinned so a vendor rename fails the build instead of
shipping.
