# ngx-devextreme-zoneless

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
}
```

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

## Semantics

- **Initial sync** (`initialSync`, default `'auto'`): the signal's value is
  pushed into the widget on attach; if it is `undefined`, the widget's current
  value is pulled into the signal instead.
- **Echo suppression**: updates only propagate when the value *structurally*
  changed (`Date`-aware, deep for arrays/plain objects). Override per binding
  via `equal` / `dxValueEqual`.
- **Debounce** applies to the widget → signal direction only, so typing into a
  `dx-text-box` doesn't storm your `computed()` graph.
- **Teardown** is automatic via `DestroyRef` — event handlers are detached and
  effects destroyed when the directive/component dies.
- **Zoneless**: no `NgZone`, no `markForCheck` — signal writes are the change
  notification.

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
npm run build               # ng-packagr build → dist/
npm run typecheck:examples  # strict-template check of examples/ + type contract tests
npm run verify              # both
npm run smoke               # runtime smoke test app on http://localhost:4299
```

The smoke app ([smoke/src/smoke.component.ts](smoke/src/smoke.component.ts))
boots with `provideZonelessChangeDetection()` — zone.js is not even installed
in this workspace — and exercises text box, select box, check box, slider,
tabs, grid selection, popup visibility, chart point selection and the
composition API in a real browser, with `data-testid` readouts for scripted
verification of both binding directions.

See [examples/order-dashboard.component.ts](examples/order-dashboard.component.ts)
for a complete signal-driven dashboard and
[examples/type-tests.ts](examples/type-tests.ts) for the compile-time contract
tests.
