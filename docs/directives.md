# Directive catalog

The complete two-way binding surface, family by family. **A directive absent
from these tables does not exist as far as consumers are concerned** — this
page is the contract the entry points are checked against. Signal Forms'
`[dxFieldState]` has [its own page](signal-forms.md), whose
[catalog](signal-forms.md#editors-that-carry-it) lists the nineteen editors it
covers.

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
| `dx-file-uploader` | `readonly File[]` — the picked files; `[]` clears the list, a written list renders but never uploads |
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

## Editor state beyond `value`

| Selector | Model |
|---|---|
| `dx-calendar[dxZoomLevel]` | `DxCalendarZoomLevel` (`'month' \| 'year' \| 'decade' \| 'century'`) — the view shown; drill-up and drill-down both land in the signal |
| `dx-chat[dxInputFieldText]` | `string` — the draft in the message box, per keystroke; sending resets it to `''`. `dxInputFieldTextDebounce` (ms) debounces widget → signal |

The calendar clamps a written level to `minZoomLevel`/`maxZoomLevel` (the
vendor's naming: `minZoomLevel` is the furthest it zooms *out*) with a second
option write from inside its own change handler; the adapter re-reads after
each write, so the signal converges to the level the calendar actually shows.

## Selection & data

| Selector | Model |
|---|---|
| `dx-data-grid[dxSelectedRowKeys]`, `dx-tree-list[dxSelectedRowKeys]` | `readonly TKey[]` |
| `dx-list[dxSelectedItemKeys]` | `readonly TKey[]` |
| `dx-tree-view[dxSelectedNodeKeys]` | `readonly TKey[]` (method-based: `getSelectedNodeKeys` / `selectItem`) |
| `dx-tree-view[dxExpandedNodeKeys]` | `readonly TKey[]` — the expanded nodes (method-based: `getNodes` / `expandItem`, `collapseAll`); the complete set, `[]` collapses all |
| `dx-data-grid[dxSelectionFilter]` | `DxFilterExpression \| null` — deferred selection (`<dxo-selection mode="multiple" [deferred]="true" />`); **`dx-data-grid` only** |
| `dx-card-view[dxSelectedCardKeys]` | `readonly TKey[]` — keys that match no card are dropped by the widget asynchronously and folded back in |
| `dx-file-manager[dxCurrentPathKeys]` | `readonly string[]` — the current directory as its key path (`['Docs', 'Docs/Reports']` by default); a path that does not exist is corrected back by the widget |
| `dx-file-manager[dxSelectedItemKeys]` | `readonly string[]` |
| `dx-file-manager[dxFocusedItemKey]` | `string \| null` |
| `dx-gantt[dxSelectedRowKey]` | `TKey \| null` |
| `dx-scheduler[dxCurrentDate]` | `Date \| number \| string` |
| `dx-scheduler[dxCurrentView]` | DevExtreme's view union |
| `dx-form[dxFormData]` | generic `TFormData` — emits a fresh value per field edit; the widget never shares the signal's object |

## Grid state (dx-data-grid, dx-tree-list — and dx-card-view where marked)

| Selector | Model |
|---|---|
| `[dxFocusedRowKey]` | `TKey \| null` (requires `focusedRowEnabled`; `null` clears) |
| `[dxFocusedRowIndex]` | `number` — the focused row's index on the page, `-1` when none (requires `focusedRowEnabled`) |
| `[dxFilterValue]` ◆ | `DxFilterExpression \| null` |
| `[dxPageIndex]`, `[dxPageSize]` ◆ | `number` (method-based — paging lives under the nested `paging` option) |
| `[dxGridState]` | `DxGridState \| null \| undefined` — the full layout state (`state()` / `stateStoring`) |
| `[dxSearchPanelText]` ◆ | `string` — the search panel's phrase (method-based: `searchByText`) |
| `dx-tree-list[dxExpandedRowKeys]` | `readonly TKey[]` — the expanded rows (**`dx-tree-list` only**) |
| `[dxEditingChanges]` | `readonly DxDataChange<TRowData, TKey>[]` — the pending edits of batch/cell editing (`editing.changes`); `[]` discards them |
| `[dxEditRowKey]` | `TKey \| null` — the row in row/form/popup edit mode (`editing.editRowKey`); a key opens the editor, `null` closes it |

◆ also on `dx-card-view`, which exposes the same `pageIndex()`/`pageSize()`/
`searchByText()` methods and the same option names although it is not built on
the grids' core: every one of its two-way states is a real option write and it
fires `contentReady` after every load, so the grid bases apply unchanged.
CardView has no focused-card *option* (only an `onFocusedCardChanged` event), so
there is no focus binding for it.

`[(dxFocusedRowIndex)]` is the render-relative counterpart of
`[(dxFocusedRowKey)]`: prefer the key where identity across reloads matters.
The keyboard controller writes the index through the option setter on every
click and arrow key, but pre-positions silently during virtual-scroll
navigation and resets it through a data operation when paging invalidates the
focused key, hence the family's `contentReady` re-read. `focusedColumnIndex`
has no directive on purpose: its change handler is a no-op marker, so a write
would move nothing — read it with `dxOptionSignal`.

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
| `dx-resizable[dxWidth]`, `dx-resizable[dxHeight]` | `DxResizableSize` (`number \| string`) — written live on every pointer move of a drag; `dxWidthDebounce`/`dxHeightDebounce` (ms) |
| `dx-splitter[dxItemSizes]` | `readonly number[] \| undefined` — the panes' pixel sizes, one per item; `undefined` before the first layout |
| `dx-splitter[dxCollapsedItems]` | `readonly number[]` — the collapsed panes' indexes as a complete set; `[]` expands all |

`[(dxVisible)]` tracks *every* way an overlay can close (shading click, escape,
close button, API) — the classic zoneless pain point.

The splitter is the one widget in the catalog whose write-back is *silent*: at
the end of a drag it re-measures every pane and stores the pixel size into
`items[i].size` without raising `optionChanged`. `[(dxItemSizes)]` therefore
listens to `resizeEnd`, `itemCollapsed`/`itemExpanded` and `contentReady` and
reads `option('items')`; a written size is applied, re-measured (clamped to
`minSize`/`maxSize`) and stored silently again, so the adapter re-reads after
each write and the signal converges to the layout the splitter produced. Only
pixel numbers are modelled — a `'30%'` configured on an item is what the widget
itself replaces with pixels on first layout — and a splitter that renders
hidden reports its sizes after its first resize or collapse. The collapse
handle, by contrast, writes `items[i].collapsed` through the regular setter.

## Visualization

| Selector | Model |
|---|---|
| `dx-chart[dxSelectedPoints]`, `dx-pie-chart[dxSelectedPoints]`, `dx-polar-chart[dxSelectedPoints]` | `readonly DxChartSelectedPoint[]` |
| `dx-chart[dxVisualRange]` | `DxChartVisualRange \| undefined` — the argument axis' visual range, what zoom and pan change |
| `dx-chart[dxValueAxisVisualRange]` | `DxChartValueAxisVisualRange \| undefined` — the (first) value axis' visual range, what a vertical zoom or pan changes |

Chart selection is method-based; selected points are exposed as serializable
`{ seriesName, argument, value }` descriptors that can be stored and restored.
DevExtreme charts do not select points on click by themselves (their demos
wire `onPointClick: e => e.target.select()` manually), so these directives
toggle the clicked point's selection by default — opt out with
`[dxPointClickToggle]="false"` if you want to handle `onPointClick` yourself.

`[(dxVisualRange)]` binds `argumentAxis.visualRange`, so several charts can
share one window or a zoom can be persisted and restored. Enable zooming with
`<dxo-zoom-and-pan argumentAxis="both" [allowMouseWheel]="true" />`. A written
range is applied verbatim, as a `[start, end]` pair or a
`{ startValue, endValue }` object (measured: neither shape nor bounds are
normalized on the way in), and the chart writes its own zoom and pan results
back in whichever shape the option holds — so the signal keeps the shape you
gave it. Once rendered, the chart reports the full data range the same way, so
the signal is `undefined` only before the first render (and `undefined` means
"do not push"). Widget → signal reads can be debounced via
`dxVisualRangeDebounce`.

`[(dxValueAxisVisualRange)]` is the same binding for `valueAxis.visualRange`
(`<dxo-zoom-and-pan valueAxis="both" />`): the chart writes it back through
the same setter, applies a written range the same way and reports the full
range once rendered. With several value axes (`<dxi-value-axis>`) it follows
the first.

## Components without a dedicated directive

The coverage model: **a directive exists wherever a widget has genuine
user-mutable two-way state** (value, selection, visibility, index, current
date/view, form data, chart points). Everything else — PivotGrid, Sortable,
Menu, and any component DevExtreme ships in the future — is fully supported
through the [composition API](composition-api.md), whose option names, value
types and event payloads are computed from the `Properties` declaration of
whatever host component you hand it. Support does not cliff-edge at this
catalog; it just gets one notch less sugary.

**Read-only options are not two-way bindings.** Some options a widget writes
are ignored on the way in: the scheduler's `selectedCellData` (its workspace's
change handler is a no-op) and the grids' `focusedColumnIndex` (a no-op marker).
A `[(…)]` directive would silently drop half of its contract there, so none is
shipped — `dxOptionSignal(host, 'selectedCellData')` is the one-line readout.
