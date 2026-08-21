# ngx-devextreme-zoneless

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Context7](https://img.shields.io/badge/Context7-Indexed-3B82F6)](https://context7.com/caffeinatedcoder/ngx-devextreme-zoneless)
[![NPM](https://img.shields.io/npm/v/ngx-devextreme-zoneless?label=NPM&color=3B82F6)](https://www.npmjs.com/package/ngx-devextreme-zoneless)

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

- **Angular** ≥ 20 (built and verified against Angular 22, zoneless by default)
- **DevExtreme / devextreme-angular** ≥ 25.1 (built and verified against 26.1)
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
      <dxo-selection mode="multiple" />
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
family: `DX_VALUE_DIRECTIVES`, `DX_NAVIGATION_DIRECTIVES`,
`DX_VISIBLE_DIRECTIVES`, `DX_DATA_DIRECTIVES`, `DX_VISUALIZATION_DIRECTIVES`).

Components without a dedicated directive (PivotGrid, Sortable, Menu, …) are
covered too — see [Composition API](#composition-api): the same engine works
with **any** option and event of **any** DevExtreme component, fully typed.

## Directive catalog

### Editors — `[(dxValue)]`

Every value editor gets a `[(dxValue)]` two-way model plus `dxValueDebounce`
(ms, widget → signal direction) and `dxValueEqual` (custom comparer) inputs.

| Component | Model type |
|---|---|
| `dx-text-box`, `dx-text-area`, `dx-html-editor` | `string` |
| `dx-number-box` | `number \| null` |
| `dx-check-box` | `boolean \| null` |
| `dx-switch` | `boolean` |
| `dx-date-box` | `Date \| number \| string \| null` |
| `dx-date-range-box` | `readonly [start: DxDateValue \| null, end: DxDateValue \| null]` |
| `dx-calendar` | `DxDateValue \| readonly DxDateValue[] \| null` |
| `dx-color-box`, `dx-autocomplete` | `string \| null` |
| `dx-slider` | `number` |
| `dx-range-slider` | `readonly [start: number, end: number]` |
| `dx-select-box`, `dx-lookup`, `dx-drop-down-box`, `dx-radio-group` | generic `TValue` — inferred from your signal |
| `dx-tag-box` | generic `readonly TKey[]` |
| `dx-filter-builder` | `DxFilterExpression \| null` |
| `dx-range-selector` | DevExtreme's declared scale range type |

Where DevExtreme declares `value?: any` (SelectBox & friends) the directive is
**generic** instead, so `[(dxValue)]="status"` with a
`signal<OrderStatus | null>` is checked end-to-end.

### Selection & data

| Selector | Model |
|---|---|
| `dx-data-grid[dxSelectedRowKeys]`, `dx-tree-list[dxSelectedRowKeys]` | `readonly TKey[]` |
| `dx-list[dxSelectedItemKeys]` | `readonly TKey[]` |
| `dx-tree-view[dxSelectedNodeKeys]` | `readonly TKey[]` (method-based: `getSelectedNodeKeys` / `selectItem`) |
| `dx-gantt[dxSelectedRowKey]` | `TKey \| null` |
| `dx-scheduler[dxCurrentDate]` | `Date \| number \| string` |
| `dx-scheduler[dxCurrentView]` | DevExtreme's view union |
| `dx-form[dxFormData]` | generic `TFormData` — emits a fresh shallow copy per field edit |

### Grid state (dx-data-grid and dx-tree-list)

| Selector | Model |
|---|---|
| `[dxFocusedRowKey]` | `TKey \| null` (requires `focusedRowEnabled`; `null` clears) |
| `[dxFilterValue]` | `DxFilterExpression \| null` |
| `[dxPageIndex]`, `[dxPageSize]` | `number` (method-based — paging lives under the nested `paging` option) |
| `[dxGridState]` | `DxGridState \| null \| undefined` — the full layout state (`state()` / `stateStoring`) |

`[(dxGridState)]` is the layout-persistence story: bind it to a signal you
persist wherever you like. `undefined` pulls the current state on attach,
a saved state object restores the layout, `null` resets to defaults. Widget →
signal reads are debounced (`dxGridStateDebounce`, default 100 ms).

### Navigation & overlays

| Selector | Model |
|---|---|
| `dx-tabs`, `dx-tab-panel`, `dx-accordion`, `dx-gallery` + `[dxSelectedIndex]` | `number` |
| `dx-drawer[dxOpened]` | `boolean` |
| `dx-popup`, `dx-popover`, `dx-tooltip`, `dx-toast`, `dx-load-panel`, `dx-action-sheet` + `[dxVisible]` | `boolean` |

`[(dxVisible)]` tracks *every* way an overlay can close (shading click, escape,
close button, API) — the classic zoneless pain point.

### Visualization

| Selector | Model |
|---|---|
| `dx-chart[dxSelectedPoints]`, `dx-pie-chart[dxSelectedPoints]` | `readonly DxChartSelectedPoint[]` |

Chart selection is method-based; selected points are exposed as serializable
`{ seriesName, argument, value }` descriptors that can be stored and restored.
DevExtreme charts do not select points on click by themselves (their demos
wire `onPointClick: e => e.target.select()` manually), so these directives
toggle the clicked point's selection by default — opt out with
`[dxPointClickToggle]="false"` if you want to handle `onPointClick` yourself.

## Composition API

The directives are sugar. The same engine is available as injection-context
functions and covers **every option and event of every DevExtreme component**,
fully typed:

```ts
import {
  bindDxOption, dxOptionSignal, dxEventSignal, injectDxInstance,
} from 'ngx-devextreme-zoneless';

@Component({ /* ... */ })
export class MyComponent {
  // On the same element (inside a directive):
  private readonly textBox = inject(DxTextBoxComponent, { self: true });

  // Two-way signal for any option — names & types from DevExtreme Properties:
  readonly placeholder = dxOptionSignal(this.textBox, 'placeholder');
  readonly mode = dxOptionSignal(this.textBox, 'mode', { initialValue: 'search' });

  // Latest payload of any widget event:
  readonly focusOut = dxEventSignal(this.textBox, 'focusOut');

  // Works with view children too (pass the viewChild signal itself):
  private readonly grid = viewChild(DxDataGridComponent<Order, number>);
  readonly filter = dxOptionSignal(this.grid, 'filterValue');

  // Bind an existing signal to an option:
  readonly keys = signal<number[] | undefined>([]);
  constructor() {
    bindDxOption(this.grid, 'selectedRowKeys', this.keys);
  }

  // The raw widget instance as a signal (undefined until created):
  readonly widget = injectDxInstance(DxTextBoxComponent);

  // Same, but for a view child — resets to undefined while the widget is
  // gone and follows re-creation:
  readonly gridWidget = dxInstanceSignal(this.grid);
}
```

### Widget re-creation

Composition-API bindings on a **getter host reference** (a `viewChild(...)`
signal) survive widget re-creation: when an `@if`, a tab panel or re-created
popup content destroys the widget and later creates a new one, the binding
re-attaches automatically and the initial synchronization runs again — a
signal holding state therefore **restores it into the new widget**. The
attribute directives don't need any of this; they die and are re-created with
their element.

`onDxWidgetReady` is the underlying primitive: it fires once per widget
instance, and its callback may return a cleanup that runs when the widget
goes away.

### Components without a dedicated directive

The coverage model is simple: **a directive exists wherever a widget has
genuine user-mutable two-way state** (value, selection, visibility, index,
current date/view, form data, chart points). Every other component — and any
component DevExtreme ships in the future — is still fully supported through
the composition API, because `dxOptionSignal`, `dxEventSignal` and
`bindDxOption` are not written against a component list: their option names,
option value types and event payloads are computed from the `Properties`
declaration of whatever host component you hand them. Support doesn't
cliff-edge at the directive catalog; it just gets one notch less sugary.

A few real-world cases:

```ts
// PivotGrid — no two-way options (its mutable state lives in the
// PivotGridDataSource), but every event and option is reachable, typed:
private readonly pivot = inject(DxPivotGridComponent, { self: true });
readonly cellClick = dxEventSignal(this.pivot, 'cellClick');
readonly contextMenu = dxEventSignal(this.pivot, 'contextMenuPreparing');
```

```ts
// Scheduler beyond [(dxCurrentDate)] / [(dxCurrentView)] — appointment
// lifecycle as signals:
private readonly scheduler = inject(DxSchedulerComponent, { self: true });
readonly appointmentAdded = dxEventSignal(this.scheduler, 'appointmentAdded');
```

```ts
// Sortable (e.g. a Kanban board built from dx-sortable + lists) — purely
// event-driven, so state stays in your signals and events drive mutations:
private readonly sortable = viewChild(DxSortableComponent);
readonly reorder = dxEventSignal(this.sortable, 'reorder');
constructor() {
  effect(() => {
    const e = this.reorder();
    if (e) this.cards.update((cards) => moveItem(cards, e.fromIndex, e.toIndex));
  });
}
```

```ts
// Any option of any widget, two-way — e.g. Menu, ButtonGroup, Toolbar, ...:
readonly disabled = dxOptionSignal(this.menu, 'disabled');
```

For state that is neither an option nor a single event (method-based APIs),
implement a `DxBindingAdapter` and pass it to `bindDxState` — that is exactly
how the chart-selection and tree-view directives are built. And if you want
template sugar for a component we don't cover, a custom directive is ~10
lines by extending `DxValueDirectiveBase`, `DxVisibleDirectiveBase`, etc.

## Data loading (signals → DataSource)

Two-way state is one half of the zoneless problem; the other half is data
loading — DevExtreme components load through `DataSource`/stores, which know
nothing about signals.

**Array data in a signal** — `dxArrayStoreSource` wraps a
`Signal<readonly T[]>` in a `DataSource` that reloads whenever the signal
changes:

```ts
readonly orders = signal<readonly Order[]>([]);
readonly ordersSource = dxArrayStoreSource(this.orders, { key: 'id' });
// <dx-data-grid [dataSource]="ordersSource" />
```

**Remote data with signal-driven filters** — `dxReloadOn` triggers a reload
whenever dependency signals change, so external filter state needs no
hand-written `refresh()` plumbing:

```ts
readonly search = signal('');

// e.g. a DevExtreme.AspNet.Data endpoint:
readonly source = new DataSource({
  store: createStore({ loadUrl: '/api/orders', key: 'id' }),
});

constructor() {
  dxReloadOn(this.source, [this.search]);
}
```

The target can also be a callback (`dxReloadOn(() => this.grid()?.refresh(), [deps])`)
for anything that is not a `DataSource`.

## Remote data (`dxRemoteStore`) <sup>developer preview in 2.1</sup>

For server-side loading, `dxRemoteStore` wraps a load function in a
`DataSource` and exposes the loading state the widget cannot show for you,
using Angular `resource()` vocabulary — no third dialect. This section is
written from the reference screens in `smoke/src/remote.component.ts`, which
run in CI against a DevExtreme.AspNet.Data protocol stub
(`e2e/stub-server.mjs`) including slow- and failing-endpoint cases.

```ts
readonly search = signal('');
readonly status = signal<string | null>(null);

readonly orders = dxRemoteStore<Order, number>({
  key: 'id',
  deps: [this.search, this.status],   // query state living outside the widget
  debounce: 300,                      // for keystroke-fed dependency signals
  load: async (options, signal) => {
    // options: DevExtreme LoadOptions (filter/sort/skip/take/…) from the widget;
    // merge your external filter signals and go to the server:
    const filter = combineFilters(options.filter, myExternalFilter());
    const response = await fetch(`/api/orders?${dxLoadOptionsParams({ ...options, filter })}`, { signal });
    if (!response.ok) throw new Error(`orders failed: ${response.status}`);
    return response.json(); // { data, totalCount } — or a plain array
  },
});
```

```html
<dx-data-grid [dataSource]="orders.dataSource" [remoteOperations]="true">…</dx-data-grid>
@if (orders.isLoading()) { <app-spinner /> }
@if (orders.error(); as error) { <button (click)="orders.reload()">retry</button> }
```

`dxLoadOptionsParams` serializes `LoadOptions` into the exact query-string
format DevExtreme.AspNet.Data server libraries parse (JSON-encoded
`filter`/`sort`/`group`/`select`/summaries, plain `skip`/`take`/
`requireTotalCount`/`requireGroupCount`) — the same wire format the vendor's
`createStore({ loadUrl })` produces, but through your own `fetch`, so auth
headers, interceptors and `AbortSignal` stay in your hands.

**The contract**, aligned with `resource()` and verified by e2e:

- **Cancellation, last write wins.** Every load receives an `AbortSignal`. A
  reload — dependency-driven or manual — aborts whatever is in flight;
  superseded loads never overwrite newer results, never surface stale errors,
  and never trigger the widget's load-error UI.
- **`error` + retry.** `error` holds the rejection of the most recent settled
  load and is cleared by the next successful one; `reload()` is the retry.
  The widget additionally shows its own load-error row — `error` is for UI
  outside the widget.
- **Page ownership.** A dependency change is a new query, so the store resets
  to page 0 (mirroring `DataSource.filter()` semantics). Manual `reload()`
  refetches the same query and keeps the page. You never manage `pageIndex`
  yourself — and a bound `[(dxPageIndex)]` signal follows both cases.
- **Debounce ownership.** The `debounce` option applies to dependency-driven
  reloads only (type-ahead filter signals). Widget-driven search (a lookup's
  `searchTimeout`) is already debounced by the widget — don't stack a second
  debounce on the same keystrokes.
- **Search folds into `filter`.** Widget search options are merged into
  `LoadOptions.filter` before `load` runs (vendor-parity `useDefaultSearch`),
  so your load function only ever deals in filter expressions.

**Dependent queries** — a master grid's selection signal drives the detail
store; return an empty result to skip the request entirely:

```ts
readonly detailOrders = dxRemoteStore<Order, number>({
  key: 'id',
  deps: [this.selectedCustomerId],
  load: async (options, signal) => {
    const customerId = untracked(this.selectedCustomerId);
    if (customerId === undefined) return { data: [], totalCount: 0 };
    const filter = combineFilters(options.filter, ['customerId', '=', customerId]);
    return fetchJson(`/api/orders?${dxLoadOptionsParams({ ...options, filter })}`, signal);
  },
});
```

**Lookup editors need `byKey`** — a select box showing a programmatically set
value must resolve the item behind the key before any page is loaded. Against
a loadOptions endpoint, `byKey` is a filtered load:

```ts
readonly customerLookup = dxRemoteStore<Customer, number>({
  key: 'id',
  load: (options, signal) =>
    fetchJson(`/api/customers?${dxLoadOptionsParams(options)}`, signal),
  byKey: async (key, signal) => {
    const params = dxLoadOptionsParams({ filter: ['id', '=', key], take: 1 });
    const result = await fetchJson<{ data: Customer[] }>(`/api/customers?${params}`, signal);
    if (result.data[0] === undefined) throw new Error(`customer ${key} not found`);
    return result.data[0];
  },
});
```

**Scope: load-only, by design.** Create/update/delete deliberately stay out
of this first cut — editing flows couple to validation, conflict handling and
optimistic-update policy that this package should not decide for you. For
editable grids, hand the widget a full `CustomStore` (or the vendor's
`createStore` with `insertUrl`/`updateUrl`/`deleteUrl`) and keep
`dxRemoteStore` for the read paths. If real consumer screens produce a shape
worth hardening, CRUD can graduate the same way this API did.

## Semantics

- **Initial sync** (`initialSync`, default `'auto'`): the signal's value is
  pushed into the widget on attach; if it is `undefined`, the widget's current
  value is pulled into the signal instead.
- **`undefined` vs `null`**: `undefined` means *absent* — a signal holding
  `undefined` is never pushed into the widget (that is what makes `'auto'`
  initial sync and late-created widgets work). To *clear* an option through a
  binding, use `null`: `status.set(null)` clears a select box,
  `status.set(undefined)` does nothing. This mirrors DevExtreme's own
  conventions — its clearable editors write `null`, not `undefined`.
- **Debounced typing**: DevExtreme text editors update their `value` option on
  *blur* by default. Pair `[(dxValue)]` + `dxValueDebounce` with
  `valueChangeEvent="input"` on the editor to get live per-keystroke updates:

  ```html
  <dx-text-box [(dxValue)]="search" [dxValueDebounce]="300" valueChangeEvent="input" />
  ```

  Without it, the binding appears to only fire on blur — that is the widget's
  event timing, not the binding's.
- **Echo suppression**: updates only propagate when the value *structurally*
  changed (`Date`-aware, deep for arrays/plain objects). Override per binding
  via `equal` / `dxValueEqual`.
- **Debounce** applies to the widget → signal direction only, so typing into a
  `dx-text-box` doesn't storm your `computed()` graph.
- **Teardown** is automatic via `DestroyRef` — event handlers are detached and
  effects destroyed when the directive/component dies.
- **Re-attach**: with a getter host reference the binding follows widget
  re-creation (see [Widget re-creation](#widget-re-creation)); per-widget
  resources are disposed on each detach.
- **Zoneless**: no `NgZone`, no `markForCheck` — signal writes are the change
  notification.

## Entry points & tree-shaking

The package ships per-family secondary entry points:

```
ngx-devextreme-zoneless            → everything (re-exports the below)
ngx-devextreme-zoneless/core       → engine, types, bases, data-source/remote helpers
ngx-devextreme-zoneless/editors    → [(dxValue)] directives
ngx-devextreme-zoneless/navigation → [(dxSelectedIndex)], [(dxOpened)], …
ngx-devextreme-zoneless/overlays   → [(dxVisible)] directives
ngx-devextreme-zoneless/data       → grid/form/scheduler/tree directives
ngx-devextreme-zoneless/visualization → chart selection, range selector
```

Importing from the main entry is fine: bundlers drop the families you don't
use at module level (CI proves it — a probe app importing a single editor
directive is asserted to contain no Gantt, Scheduler, HtmlEditor, chart or
grid modules). Import from a family entry point when you want the split to be
explicit.

## Type helpers

All building blocks are exported, e.g.:

```ts
DxHostOptionName<DxTextBoxComponent>          // 'value' | 'placeholder' | 'mode' | ...
DxHostOptionValue<DxTextBoxComponent, 'mode'> // 'email' | 'password' | ... | undefined
DxHostEventName<DxDataGridComponent>          // 'rowClick' | 'selectionChanged' | ...
DxHostEventArg<DxTextBoxComponent, 'valueChanged'>
DxHostValue<DxCheckBoxComponent>              // boolean | null
```

## Development

```bash
npm run build               # ng-packagr build → dist/ (all entry points)
npm run typecheck:examples  # strict-template check of examples/ + type contract tests
npm run verify              # both
npm run smoke               # runtime smoke test app on http://localhost:4299
npm run e2e                 # Playwright suite against the smoke app
npm run probe               # bundle tree-shaking probe (requires a prior build)
```

The smoke app ([smoke/src/smoke.component.ts](smoke/src/smoke.component.ts))
boots with `provideZonelessChangeDetection()` — zone.js is not even installed
in this workspace — and exercises text box, select box, check box, slider,
tabs, grid selection/paging/focus, signal-driven data loading, popup
visibility, chart point selection, the composition API and widget
re-creation in a real browser. The Playwright suite
([e2e/smoke.spec.ts](e2e/smoke.spec.ts)) asserts both directions of every
binding against the `data-testid` readouts and runs in CI on every push.

See [examples/order-dashboard.component.ts](examples/order-dashboard.component.ts)
for a complete signal-driven dashboard and
[examples/type-tests.ts](examples/type-tests.ts) for the compile-time contract
tests.
