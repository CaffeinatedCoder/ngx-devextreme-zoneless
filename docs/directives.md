# Directive catalog

The complete two-way binding surface, family by family. **A directive absent
from these tables does not exist as far as consumers are concerned** — this
page is the contract the entry points are checked against. Signal Forms'
`[dxFieldState]` has [its own page](signal-forms.md).

## Editors — `[(dxValue)]`

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

## Selection & data

| Selector | Model |
|---|---|
| `dx-data-grid[dxSelectedRowKeys]`, `dx-tree-list[dxSelectedRowKeys]` | `readonly TKey[]` |
| `dx-list[dxSelectedItemKeys]` | `readonly TKey[]` |
| `dx-tree-view[dxSelectedNodeKeys]` | `readonly TKey[]` (method-based: `getSelectedNodeKeys` / `selectItem`) |
| `dx-gantt[dxSelectedRowKey]` | `TKey \| null` |
| `dx-scheduler[dxCurrentDate]` | `Date \| number \| string` |
| `dx-scheduler[dxCurrentView]` | DevExtreme's view union |
| `dx-form[dxFormData]` | generic `TFormData` — emits a fresh value per field edit; the widget never shares the signal's object |

## Grid state (dx-data-grid and dx-tree-list)

| Selector | Model |
|---|---|
| `[dxFocusedRowKey]` | `TKey \| null` (requires `focusedRowEnabled`; `null` clears) |
| `[dxFilterValue]` | `DxFilterExpression \| null` |
| `[dxPageIndex]`, `[dxPageSize]` | `number` (method-based — paging lives under the nested `paging` option) |
| `[dxGridState]` | `DxGridState \| null \| undefined` — the full layout state (`state()` / `stateStoring`) |
| `[dxSearchPanelText]` | `string` — the search panel's phrase (method-based: `searchByText`) |
| `dx-tree-list[dxExpandedRowKeys]` | `readonly TKey[]` — the expanded rows (**`dx-tree-list` only**) |

`[(dxExpandedRowKeys)]` is the expansion-state binding for hierarchies — bind
it to a signal you persist and a restored tree comes back opened the way the
user left it. The signal holds the *complete* set, so writing a new array both
expands and collapses to match, and `[]` collapses everything. It is
`dx-tree-list` only: `dx-data-grid` declares no such option, and its *group*
expansion is reachable through `expandRow`/`collapseAll` methods instead.

`[(dxSearchPanelText)]` puts the grid's built-in search box on a signal, so
the widget's own search can drive query state that lives outside it — pair it
with `dxRemoteStore({ deps: [search] })` and the search panel becomes a
server-side search without an external input. Widget → signal reads are
debounced via `dxSearchPanelTextDebounce` (default 0), independently of the
widget's own `searchPanel` timeout.

`[(dxGridState)]` is the layout-persistence story: bind it to a signal you
persist wherever you like. `undefined` pulls the current state once the grid
has rendered (a grid has no layout state before that), a saved state object
restores the layout, `null` resets to defaults. Widget → signal reads are
debounced (`dxGridStateDebounce`, default 100 ms).

## Navigation & overlays

| Selector | Model |
|---|---|
| `dx-tabs`, `dx-tab-panel`, `dx-accordion`, `dx-gallery` + `[dxSelectedIndex]` | `number` |
| `dx-drawer[dxOpened]` | `boolean` |
| `dx-popup`, `dx-popover`, `dx-tooltip`, `dx-toast`, `dx-load-panel`, `dx-action-sheet` + `[dxVisible]` | `boolean` |

`[(dxVisible)]` tracks *every* way an overlay can close (shading click, escape,
close button, API) — the classic zoneless pain point.

## Visualization

| Selector | Model |
|---|---|
| `dx-chart[dxSelectedPoints]`, `dx-pie-chart[dxSelectedPoints]` | `readonly DxChartSelectedPoint[]` |

Chart selection is method-based; selected points are exposed as serializable
`{ seriesName, argument, value }` descriptors that can be stored and restored.
DevExtreme charts do not select points on click by themselves (their demos
wire `onPointClick: e => e.target.select()` manually), so these directives
toggle the clicked point's selection by default — opt out with
`[dxPointClickToggle]="false"` if you want to handle `onPointClick` yourself.

## Components without a dedicated directive

The coverage model: **a directive exists wherever a widget has genuine
user-mutable two-way state** (value, selection, visibility, index, current
date/view, form data, chart points). Everything else — PivotGrid, Sortable,
Menu, and any component DevExtreme ships in the future — is fully supported
through the [composition API](composition-api.md), whose option names, value
types and event payloads are computed from the `Properties` declaration of
whatever host component you hand it. Support does not cliff-edge at this
catalog; it just gets one notch less sugary.
