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

## Drop-down open state — `[(dxOpened)]`

| Component | Model |
|---|---|
| `dx-select-box`, `dx-lookup`, `dx-date-box`, `dx-date-range-box`, `dx-tag-box`, `dx-drop-down-box`, `dx-autocomplete`, `dx-color-box` | `boolean` |
| `dx-drop-down-button` (navigation entry point) | `boolean` |
| `dx-drawer` (navigation entry point) | `boolean` |

The popup's open state on a signal: drive it from outside, and observe every
way it closes — outside click, escape, an item pick, tab-out. The widget writes
`opened` through its regular option setter on each user toggle, so this is a
plain option binding (added in 4.0 for the editors and the drop-down button).

## Selection & data

| Selector | Model |
|---|---|
| `dx-data-grid[dxSelectedRowKeys]`, `dx-tree-list[dxSelectedRowKeys]` | `readonly TKey[]` |
| `dx-list[dxSelectedItemKeys]` | `readonly TKey[]` |
| `dx-tree-view[dxSelectedNodeKeys]` | `readonly TKey[]` (method-based: `getSelectedNodeKeys` / `selectItem`) |
| `dx-tree-view[dxExpandedNodeKeys]` | `readonly TKey[]` — the expanded nodes (method-based: `getNodes` / `expandItem`, `collapseAll`); the complete set, `[]` collapses all |
| `dx-data-grid[dxSelectionFilter]` | `DxFilterExpression \| null` — deferred selection (`<dxo-selection mode="multiple" [deferred]="true" />`); **`dx-data-grid` only** |
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
| `[dxEditingChanges]` | `readonly DxDataChange<TRowData, TKey>[]` — the pending edits of batch/cell editing (`editing.changes`); `[]` discards them |
| `[dxEditRowKey]` | `TKey \| null` — the row in row/form/popup edit mode (`editing.editRowKey`); a key opens the editor, `null` closes it |

`[(dxEditingChanges)]` and `[(dxEditRowKey)]` put the grids' editing state on
signals — the state DevExtreme designed for external ownership (it is how the
React and Vue wrappers keep batch edits in application state). A change is
`{ type: 'insert' | 'update' | 'remove', key, data }`; the grid never shares
the signal's objects, so a change you hold is never mutated behind your back.
Both are nested options (`editing.*`), hence method-based, with the family's
`contentReady` re-read.

`[(dxSelectionFilter)]` is the remote-scale counterpart of
`[(dxSelectedRowKeys)]`: with deferred selection the grid keeps no key array,
it keeps a filter expression describing the selected rows — which is what
makes "select all" over a remote source scale, and what a server can apply
directly. Pair it with `dxRemoteStore`. `dx-tree-list` declares neither
`selectionFilter` nor `selection.deferred`, so it is `dx-data-grid` only.

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
| `dx-tabs`, `dx-tab-panel`, `dx-accordion`, `dx-gallery`, `dx-multi-view`, `dx-stepper` + `[dxSelectedIndex]` | `number` |
| `dx-tabs`, `dx-accordion`, `dx-button-group` + `[dxSelectedItemKeys]` | `readonly TKey[]` (multi-select: `selectionMode="multiple"` / `[multiple]="true"`) |
| `dx-pagination[dxPageIndex]`, `dx-pagination[dxPageSize]` | `number` — the standalone pager; its `pageIndex` is **1-based**, unlike the grids' |
| `dx-drawer[dxOpened]`, `dx-drop-down-button[dxOpened]` | `boolean` |
| `dx-popup`, `dx-popover`, `dx-tooltip`, `dx-toast`, `dx-load-panel`, `dx-action-sheet`, `dx-context-menu` + `[dxVisible]` | `boolean` |

`[(dxVisible)]` tracks *every* way an overlay can close (shading click, escape,
close button, API) — the classic zoneless pain point.

## Visualization

| Selector | Model |
|---|---|
| `dx-chart[dxSelectedPoints]`, `dx-pie-chart[dxSelectedPoints]`, `dx-polar-chart[dxSelectedPoints]` | `readonly DxChartSelectedPoint[]` |
| `dx-chart[dxVisualRange]` | `DxChartVisualRange \| undefined` — the argument axis' visual range, what zoom and pan change |

Chart selection is method-based; selected points are exposed as serializable
`{ seriesName, argument, value }` descriptors that can be stored and restored.
DevExtreme charts do not select points on click by themselves (their demos
wire `onPointClick: e => e.target.select()` manually), so these directives
toggle the clicked point's selection by default — opt out with
`[dxPointClickToggle]="false"` if you want to handle `onPointClick` yourself.

`[(dxVisualRange)]` binds `argumentAxis.visualRange`, so several charts can
share one window or a zoom can be persisted and restored. Enable zooming with
`<dxo-zoom-and-pan argumentAxis="both" [allowMouseWheel]="true" />`. The chart
normalizes what it is handed — a `[start, end]` pair is read back as
`{ startValue, endValue }` — and the adapter re-reads after each write, so the
signal converges to the chart's representation. Once rendered, the chart
reports the full data range the same way, so the signal is `undefined` only
before the first render (and `undefined` means "do not push"). Widget → signal
reads can be debounced via `dxVisualRangeDebounce`.

## Components without a dedicated directive

The coverage model: **a directive exists wherever a widget has genuine
user-mutable two-way state** (value, selection, visibility, index, current
date/view, form data, chart points). Everything else — PivotGrid, Sortable,
Menu, and any component DevExtreme ships in the future — is fully supported
through the [composition API](composition-api.md), whose option names, value
types and event payloads are computed from the `Properties` declaration of
whatever host component you hand it. Support does not cliff-edge at this
catalog; it just gets one notch less sugary.
