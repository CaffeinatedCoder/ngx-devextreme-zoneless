# Changelog

## 4.0.0 (2026-09-08)

### Breaking changes

- **The data-loading helpers moved out of `core` into
  `ngx-devextreme-zoneless/data-source`.** `dxArrayStoreSource`, `dxReloadOn`,
  `dxRemoteStore`, `dxLoadOptionsParams` and their types
  (`DxArrayStoreSourceOptions`, `DxReloadTarget`, `DxRemoteLoader`,
  `DxRemoteStore`, `DxRemoteStoreOptions`) are exported from the new entry
  point and, as before, from the main entry. An import of those names from
  `ngx-devextreme-zoneless/core` must change to `ngx-devextreme-zoneless/data-source`
  or to the main entry; nothing else about them changed. Why: they construct
  `DataSource` and `CustomStore`, so they carry a runtime import of
  DevExtreme's data layer, and `devextreme` declares no `sideEffects: false`,
  so that import cannot be shaken. Kept in `core` it cost every chunk that used
  any directive at all — measured on a text-box-only chunk: 44,984 B over the
  bare wrapper, of which 39,862 B was `devextreme/esm/__internal/data`. A
  chunk with a select box or a grid already carries the data layer and gains
  nothing; a sign-in page or a settings form gains roughly 10 KB brotli on
  first load. `npm run probe` now asserts that only the `data-source` entry
  point imports `devextreme/`, and that a text-box chunk's closure carries no
  data-layer module.
- **`DxFieldStateDirectiveBase` takes the host instance, not its class token.**
  A subclass now calls `super(injectDxHost<DxTextBoxComponent>())` — or passes
  any host it injected itself — instead of `super(DxTextBoxComponent)`, which
  is the same shape as every core base. Only subclasses of the base are
  affected; the shipped `[dxFieldState]` directives are unchanged.

### Fixed

- **`dxRemoteStore`'s `items()` now emits for a pushed update.** The handle
  published the `DataSource`'s own items array into the signal. That is
  correct for a load, which replaces the array — but a real-time update
  pushed into the store (`store().push([{ type: 'update', key, data }])`,
  how a websocket message reaches a bound grid) is applied by *mutating*
  the array the `DataSource` already handed out, and it then fires
  `changed`. Publishing the same reference is an `Object.is` no-op, so the
  grid re-rendered the change while `items()` silently never emitted it —
  measured as a grid cell reading 999 next to a readout still reading 87.
  The signal now gets a fresh array per publish. Note the vendor limit this
  exposed, which is not ours to fix: a paginated `DataSource` drops pushed
  inserts and removes and keeps only updates, so `reload()` remains the
  route for those.
- **The chart selection adapters no longer throw on the server.** DevExtreme
  builds every viz widget as an empty stand-in when there is no `window`
  (`isServerSide ? getEmptyComponent()` in the viz base, 26.1.4), whose
  public methods return nothing; `[(dxSelectedPoints)]`'s initial read called
  `getAllSeries().flatMap(…)` on it from the stand-in's `initialized` timer —
  outside Angular's error handling, as an uncaught exception, which is fatal
  to a Node server by default. The adapter now reads an empty selection from
  the stand-in. Found by the new server-render measurement below.
- **A directive no longer drags sibling widgets into a lazy route's closure.**
  Every family entry point imported the wrapper class of each widget it adapts
  — `import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid'` —
  as the injection token for its host. That is a module-level edge from the
  family's FESM to the widget, and esbuild assigns files to chunks by
  *reachability*, not by use: a widget that is live for one lazy route is
  reachable from every other route sharing the FESM, whether or not that
  route's directive touches it. Measured in a consumer (3.0.0, devextreme-
  angular 26.1.4): a shell layout importing only
  `DxTreeViewSelectedNodeKeysDirective` from `/data`, next to a lazy page
  using `dx-data-grid`, carried the whole grid runtime in its static closure —
  1,705,093 B raw / 325,755 B brotli on every first load, more than its own
  eager bundle. The same shape exists in every family: a text-box page next to
  an html-editor page, both via `/editors`, put Quill into the text-box chunk.

  Wrapper classes are now **type-only imports**, and the host is resolved
  through `NestedOptionHost` — the public `devextreme-angular/core` token that
  every generated wrapper provides at its own element and points at itself
  (`optionHost.setHost(this)` in the constructor; verified against 26.1.4 for
  all forty adapted widgets, and nested `dxo-*`/`dxi-*` components get their
  own instance). No built entry point imports `devextreme-angular/ui/<widget>`
  at runtime any more; the only widget code in a bundle is what the consumer
  imports. Behaviour is unchanged — `npm run e2e` drives every directive
  through the new injection. In the probe, the static closure of a lazy chunk
  importing TreeView selection from `/data` while another chunk uses the grid
  went from 2,836,967 B to 261,895 B (minified, uncompressed).

  Two findings worth keeping. It was never "importing `/data` costs grid +
  gantt + scheduler": only widgets live *elsewhere in the same app* were
  dragged in, which is also why the single-chunk tree-shaking probe never saw
  it — with one entry nothing makes a sibling live. And an `export *` barrel
  over separate FESMs does **not** re-couple them (measured with named imports
  through the main entry), so the main entry point is not the trap; a shared
  FESM with a value import is.

### Added

- **25 new bindings, every one with a smoke row and both-direction e2e.**
  - **`[(dxOpened)]`** for the drop-down editors — select box, lookup, date
    box, date range box, tag box, drop-down box, autocomplete, color box — and
    for `dx-drop-down-button`: the popup's open state on a signal, with every
    way it closes observed. The widget writes `opened` through its regular
    option setter on each user toggle (verified against 26.1.4), so it is a
    plain option binding. `DxOpenedDirectiveBase` joins the core bases and the
    drawer's directive now extends it; `DX_OPENED_DIRECTIVES` is the bulk
    import.
  - **`[(dxExpandedNodeKeys)]`** for `dx-tree-view`: the expanded nodes as a
    complete key set, method-based over `getNodes()` / `expandItem` /
    `collapseAll`, with the post-write re-read `expandItem`'s silent no-op on an
    unknown key demands. The downstream consumer's own decision record had
    noted the package "carries no expansion directive at all".
  - **`[(dxEditingChanges)]` and `[(dxEditRowKey)]`** for `dx-data-grid` and
    `dx-tree-list`: the editing state DevExtreme designed for external
    ownership (`editing.changes`, `editing.editRowKey`) as signals — pending
    batch edits you can persist, restore or discard with `[]`, and the row in
    edit mode you can open or close by key. Cloned both ways: the editing
    controller mutates the entries' `data` objects as the user types, and
    sharing them would have been the `[(dxFormData)]` defect one level down.
    `DxDataChange<TRowData, TKey>` is exported for the model type.
  - **`[(dxSelectionFilter)]`** for `dx-data-grid`: deferred selection as a
    signal — the remote-scale counterpart of `[(dxSelectedRowKeys)]`, and the
    half of the remote story that was missing. `dx-data-grid` only; TreeList
    declares neither `selectionFilter` nor `selection.deferred`.
  - **`[(dxVisualRange)]`** for `dx-chart`: the argument axis' visual range,
    what zoom and pan change, so charts can share a window or a zoom can be
    restored. The chart writes it back through the regular setter on every
    zoom (verified: `_notifyVisualRange` → `option('argumentAxis.visualRange', …)`)
    in whichever shape the option holds; a written range is applied verbatim
    (measured: pair or object, in or out of the data range, read back
    unchanged), so there is no post-write re-read. `DxChartVisualRange` is
    exported.
  - **Selection breadth**: `[(dxSelectedItemKeys)]` for `dx-tabs`,
    `dx-accordion` and `dx-button-group`; `[(dxSelectedIndex)]`
    for `dx-multi-view` and `dx-stepper`; `[(dxPageIndex)]` / `[(dxPageSize)]`
    for the standalone `dx-pagination` pager (its index is 1-based, unlike the
    grids'); `[(dxVisible)]` for `dx-context-menu`; `[(dxSelectedPoints)]` for
    `dx-polar-chart`.
- **`items()` and `totalCount()` on the `dxRemoteStore` handle.** The loaded
  page and the server's count were observable only inside the widget; a
  header count or an empty-state message needed a second request or a hand
  subscription to the DataSource. Both are now signals fed by the
  DataSource's `changed` event, so they describe exactly what the widget
  renders. `totalCount` is `undefined` when the server sent none.
- **`injectDxHost<THost>()`** in `core`: the devextreme-angular component
  hosting the current element, without naming its class — so the wrapper can
  stay a type-only import. The caller names the type; the directive's selector
  is what makes it true. This is what every shipped directive now uses.
- **Fifteen more bindings, closing the demand-driven backlog** — every one
  with a smoke row and both-direction e2e (`e2e/demand-driven.spec.ts`), and
  every vendor claim below verified against 26.1.4 before the adapter was
  written.
  - **`[(dxValue)]` for `dx-file-uploader`** (`readonly File[]`): the picked
    files. The widget assigns a fresh array on every pick, drop and removal,
    so nothing is shared; `[]` clears the list, and a written list renders
    but never uploads. `[dxFieldState]` covers it too — it extends `Editor`
    and inherits the validation rendering unchanged.
  - **`[(dxZoomLevel)]` for `dx-calendar`** (`DxCalendarZoomLevel`): the view
    shown, drill-up and drill-down. The widget clamps a written level to
    `minZoomLevel`/`maxZoomLevel` with a second setter call from inside its
    change handler, which the engine's latch drops, so the adapter re-reads
    after each write — proven by stripping it: a write of `'century'` past a
    `minZoomLevel` of `'year'` then leaves the signal on `'century'` over a
    year view.
  - **`[(dxInputFieldText)]` for `dx-chat`** (`string`, with
    `dxInputFieldTextDebounce`): the draft. The chat's text area forwards
    every keystroke to the option, and sending resets it through the same
    setter.
  - **`[(dxWidth)]` and `[(dxHeight)]` for `dx-resizable`** (`DxResizableSize`,
    each with a debounce input): written live on every pointer move of a drag
    (`_updateDimensions` → `option({ width })`), applied through the standard
    dimension pipeline.
  - **`[(dxItemSizes)]` and `[(dxCollapsedItems)]` for `dx-splitter`**: the
    panes' pixel sizes and the collapsed set. The splitter is the one widget in
    the catalog whose size write-back is *silent* — at the end of a drag it
    re-measures every pane and stores `items[i].size` through
    `Options.silent()`, raising no `optionChanged` — so the sizes adapter
    listens to `resizeEnd`, the collapse events and `contentReady` and reads
    `option('items')`; a written size is re-measured silently again, so it
    re-reads after each write. Proven both ways: dropping `resizeEnd` leaves a
    drag unobserved, and dropping the re-read leaves a size written below
    `minSize` in the signal while the pane shows the clamp. Collapse writes go
    through the regular setter. Sizes are `undefined` before the first layout,
    like the chart's range.
  - **`[(dxFocusedRowIndex)]` for `dx-data-grid` and `dx-tree-list`**
    (`number`, `-1` when none): the render-relative counterpart of
    `[(dxFocusedRowKey)]`. The keyboard controller writes it through the
    setter on every click and arrow key, but pre-positions silently during
    virtual-scroll navigation and resets it through a data operation when
    paging invalidates the focused key — the family's `contentReady` re-read
    covers both. `focusedColumnIndex` deliberately has no directive: its
    change handler is a no-op marker, so a write would move nothing; it is a
    `dxOptionSignal` readout.
  - **CardView**: `[(dxSelectedCardKeys)]`, `[(dxPageIndex)]`, `[(dxPageSize)]`,
    `[(dxFilterValue)]` and `[(dxSearchPanelText)]` for `dx-card-view`. It is
    not built on the grids' core, but every two-way state is an
    `OptionsController.twoWay()` whose setter is a real `option()` write, it
    fires `contentReady` after every load and exposes `pageIndex()`,
    `pageSize()` and `searchByText()`, so the grid bases apply unchanged. Keys
    that match no card are dropped asynchronously and written back through
    the setter, which the binding folds in as it would any user change. There
    is no focused-card option to bind.
  - **FileManager**: `[(dxCurrentPathKeys)]`, `[(dxSelectedItemKeys)]` and
    `[(dxFocusedItemKey)]` for `dx-file-manager`. All three are top-level
    options written through the setter on every gesture; a path that does not
    resolve is corrected back through the same setter once the directory load
    fails, so the correction arrives as an ordinary change.
  - **`[(dxValueAxisVisualRange)]` for `dx-chart`**: the value axis' range,
    what a vertical zoom or pan changes — the same `_notifyVisualRange`
    write-back, verbatim apply and full-range-on-render as the argument axis,
    on the `valueAxis.visualRange` path (or `valueAxis[0].visualRange` when
    the axis is configured as an array, which is the branch the chart itself
    takes). `DxChartValueAxisVisualRange` is exported. Measuring it corrected
    the argument-axis entry above: the chart does not normalize a written
    range on either axis, and a re-read that the first cut had justified with
    that claim was inert and is gone.
  - **Not bindable, and now documented as such**: the scheduler's
    `selectedCellData` is written by the widget but ignored on the way in (its
    workspace's change handler is a no-op), so a two-way directive would drop
    half of its contract; `dxOptionSignal` is the readout.

### Tests

- **Every directive is now driven through the zoneless app, not merely every
  family — all 116 of them, checked mechanically.** The binding screen placed 14
  widget tags, which left 26 of the 40
  adapted widgets — and 17 of the 18 `[dxFieldState]` editors — with no
  runtime coverage; both 3.0 defects lived in exactly such directives. Two new
  screens close that: `/coverage` places every `[(dxValue)]`, `[(dxSelectedIndex)]`,
  `[(dxSelectedItemKeys)]`, `[(dxOpened)]`, `[(dxVisible)]`, `[(dxSelectedRowKey)]`,
  `[(dxCurrentDate)]`/`[(dxCurrentView)]` and `[(dxSelectedPoints)]` directive the
  binding screen does not, with both directions asserted per widget
  (`e2e/coverage.spec.ts`), and `/forms-coverage` presents an always-invalid,
  switchable-to-read-only field through `[dxFieldState]` on all 19 editors
  (`e2e/forms-coverage.spec.ts`). Where a gesture would test DevExtreme's own
  pointer handling rather than the binding — the filter builder's inline
  editors, the range selector's SVG sliders, the date range box's masked
  inputs — the widget → signal direction is driven by writing the widget's
  option through its instance, the same setter the gesture ends in. The suite
  grew from 104 to 207 cases and runs in about 75 seconds.

  The last twelve arrived late, found by diffing every directive selector
  against every widget element in the smoke screens rather than by reading the
  list: the seven TreeList halves of the grid-state family (whose DataGrid
  twins were covered and whose bases are shared), `dx-data-grid`'s
  `[(dxFilterValue)]` and `[(dxPageSize)]` (placed only on a card view), and
  `[(dxValue)]` on the number box, date box and tag box (placed only under
  `[dxFieldState]`). Placing them turned up two vendor asymmetries a DataGrid
  never shows: a TreeList defaults `scrolling.mode` to `'virtual'` where the
  DataGrid defaults to `'standard'`, and grid_core's state restore forces
  `paging.pageIndex` back to 0 under virtual scrolling without a rows-view
  height — so a restored page is silently dropped. The TreeList state case
  therefore asserts on `expandedRowKeys`, which is what the TreeList's own
  state-storing module adds to the shared layout and the honest twin
  difference to prove.
- **A signal read inside a widget-rendered `*dxTemplate` is pinned** to
  re-render on the signal change with no zone (a list item template on
  `/coverage`). Consumers' cell and item templates rely on exactly this and
  nothing had measured it.
- **`npm run probe` now guards isolation under code splitting**, which the
  single-directive probe could not. A static scan fails on any
  `devextreme-angular/ui/` import in `dist/fesm2022/*.mjs` — red the instant an
  `import type` regresses to a value import, a second scan fails on any
  `devextreme/` import outside the `data-source` entry point — and the probe app
  builds seven lazy chunks (text box via the main entry, html editor, TreeView
  selection, a grid page, `[dxFieldState]` on a text box and on the html editor,
  and `dxRemoteStore` alone), asserting
  each chunk's static closure holds only its own widget while the heavy
  siblings are live in another chunk. The old single-directive assertion
  survives as the sanity check that the probe is meaningful. Proven by
  breaking: restoring one value import in `data` turns both halves red in one
  run — the scan names the FESM line, and the TreeView chunk's closure grows
  from 1,081,606 B to 2,887,294 B with the grid inside it.
- **Server-side rendering is measured, not assumed.** `npm run ssr` — a CI
  step — builds the smoke app with a server entry (`smoke/src/main.server.ts`:
  the same shell, zoneless, under `@angular/platform-server` with the vendor's
  `DxServerModule`) and renders all six screens in Node
  (`scripts/ssr-check.mjs`). The pinned state: every screen bootstraps,
  becomes stable, renders its readouts, raises nothing through Angular's
  `ErrorHandler`, and nothing fires after the platform is destroyed. Three
  findings on the way there, each of which the check would now report:
  devextreme-angular constructs every widget in `ngOnInit` on the server too
  (nothing is platform-gated; only the wrappers' `ngSkipHydration` is); without
  `DxServerModule` the widgets' Inferno-rendered parts reach for a global
  `document`, and the three grid-bearing screens never settle; and the viz
  widgets are empty stand-ins there (the fix above). `renderApplication`
  would have turned each of these into a bare timeout, so the check drives
  the platform directly and reports settle state, errors and the document
  separately per screen. The shell reads its path through `PlatformLocation`
  now rather than the global `location`, which is what let it render at all.
  Nothing is served or hydrated; the run exists so that a vendor or Angular
  change to any of this turns CI red.
- The suite grew from 207 to 240 cases with `e2e/demand-driven.spec.ts` and
  the file uploader's `[dxFieldState]` row.

### Docs

- README "Entry points & tree-shaking" now states the guarantee that is
  measured — no entry point carries widget runtime — instead of a tree-shaking
  claim that held only for single-chunk apps. `docs/composition-api.md` shows
  `injectDxHost`.
- `docs/directives.md` carries every new binding with its model type and the
  semantics worth stating (deferred selection, editing state, the chart's
  full-range initial value, the pager's 1-based index); `docs/remote-data.md`
  the loaded-data signals and the entry-point move; `docs/development.md` the
  six smoke screens, the `ssr` gate and what it measured.
- `docs/directives.md` names the options that are read-only by vendor design
  (`selectedCellData`, `focusedColumnIndex`) and the composition-API route for
  them, so "no directive" reads as a decision rather than a gap.
- `docs/signal-forms.md` now **names** the nineteen editors that carry
  `[dxFieldState]`, with each one's field value type. The page stated the
  count and the rule but never the list, which left those nineteen directives
  outside the catalog the docs claim as their contract; it also now records
  that `dx-filter-builder` and `dx-range-selector` have `[(dxValue)]` and no
  `[dxFieldState]`, because neither extends `Editor`.

### Not in this release, by decision

- `dx-tab-panel[dxSelectedItemKeys]` was built, failed its signal → widget case
  (a key write did not move the tab), and was withdrawn rather than shipped
  unproven: a tab panel's selection is single by construction and
  `[(dxSelectedIndex)]` already owns it.
- Map centre/zoom, Diagram and ScrollView are not bindable — silent setters or
  methods only. The scheduler's `selectedCellData` and the grids'
  `focusedColumnIndex` are read-only by vendor design (see Added).
- CRUD on `dxRemoteStore` stays deferred by the remote-data scope decision,
  and a `testing` entry point waits for demand.
- No `ng update` migration: the breaking change moves four symbols' import path,
  a one-line edit, and the main entry keeps exporting them unchanged.

## 3.0.0 (2026-08-24)

### Breaking changes

- **The Angular peer range is now `>=22.1.0 <23.0.0`** (was `>=20.0.0 <23.0.0`).
  Consumers on Angular 20 or 21 should stay on 2.1.0. The old floor was never
  exercised by CI, which has only ever built and tested against 22.1.x — an
  advertised range with no gate behind it is not a claim this package should
  make, and Signal Forms support is what brought it to a head. `@angular/forms`
  joins as an **optional** peer on the same range, for the new `forms` entry
  point only; declaring it on a narrower range than `@angular/core` would have
  manufactured a peer conflict for every Angular 20/21 consumer who had forms
  installed, since an optional peer is still range-checked when present.

- **`[(dxFormData)]` no longer lets the widget mutate your object.** `dxForm`
  used to edit the bound `formData` object in place — the very defect that made
  the binding stop emitting (see *Fixed*). The widget now works on its own
  clone, so the object held by your signal is never written to behind your
  back. Code that read edits back off the original object reference must read
  them off the signal instead; code that already went through the signal is
  unaffected and starts working for the first time.
- **`[(dxGridState)]` yields a different initial value.** The signal used to
  settle on the widget's pre-render `{}` snapshot; it now yields the real
  layout state. Anything persisting that signal will start saving a populated
  layout where it previously saved an empty object — including, on first run
  after upgrade, over a stored empty one.
- **The repository history was rewritten.** Every commit SHA prior to 3.0.0
  changed. Existing clones cannot fast-forward and must be re-cloned, and the
  build-provenance links recorded for the published 1.x/2.x versions point at
  commits that no longer exist. Published packages themselves are untouched.

### Added

- **`[dxFieldState]` and a new `ngx-devextreme-zoneless/forms` entry point** —
  the Angular Signal Forms seam. `[formField]` already carries value, `touched`
  and `disabled` through each editor's own `ControlValueAccessor`; this
  directive writes the state a CVA has no hook for — `readonly`, `hidden`,
  `errors` and async `pending` — into the widget's own UI (`readOnly`,
  `visible`, `isValid`, `validationStatus`, `validationErrors`). Available on
  all 18 editor families carrying DevExtreme's `Editor` validation surface;
  `dx-filter-builder` is excluded because it is not an Editor. `hidden` keeps
  the widget in the DOM (`dx-state-invisible`), so Angular's dev-only `NG01916`
  advisory — which prefers `@if` — still logs; the README documents that trade.

  It is a companion to `[formField]`, not a replacement, and the field is named
  twice on purpose. Angular synthesises 17 input assignments onto a form-control
  host, which collide by name with DevExtreme's generated wrappers and fail
  `strictTemplates` on nine editor families. That is a false positive, but a
  directive claiming the `formField` binding to suppress it also disables the
  runtime instruction that makes `[formField]` work at all — the compiler gate
  and the runtime gate are the same gate, which was measured rather than
  assumed. `[formField]` therefore still needs `$any()` on those families, and
  passing the same field to `[dxFieldState]` — typed to each family's real value
  type — is what restores the compile-time check.

  `required` and `dirty` are deliberately not mirrored. No DevExtreme editor
  declares a `required` option (26.1.4) — a required field surfaces through the
  error it raises. `isDirty` exists but is the widget's own telemetry: the
  editor no-ops external writes and overwrites the flag on every value change,
  so mirroring it would fight the widget's own writer for a flag nobody
  renders.

  `@angular/forms` is a new **optional** peer dependency. In dev mode the
  directive injects Angular's `FORM_FIELD` token and throws when `[formField]`
  and `[dxFieldState]` name different fields — the mistake the type system
  cannot catch, and the entry point's one runtime import of
  `@angular/forms/signals`. The `forms` entry point is not re-exported by the
  main entry point, so consumers who do not use Signal Forms never load it.

- **`[(dxSearchPanelText)]`** for `dx-data-grid` and `dx-tree-list` — two-way
  binds the search panel's phrase to a signal. `searchPanel.text` is a nested
  option outside the typed option-name surface, so the adapter writes through
  `searchByText()` and reads the nested option back, and also listens to
  `contentReady` as the family default for method-based grid adapters.
  `undefined` (no search text) normalizes to `''`, so
  "cleared" has one representation on the model side. Widget → signal reads
  are debounced via `dxSearchPanelTextDebounce` (default 0). Pairing it with
  `dxRemoteStore({ deps: [search] })` makes the built-in search box a
  server-side search with no external input.

- **`[(dxExpandedRowKeys)]`** for `dx-tree-list` — two-way binds the set of
  expanded rows to a signal, the piece of hierarchy state a consumer actually
  wants to persist. `expandedRowKeys` is a top-level typed option and every
  path that changes it (the expand arrow, `expandRow()`, `collapseRow()`)
  writes it through the public option setter, so this is a plain option
  adapter with no `contentReady` re-read — the exception to the family
  default, pinned by both-direction e2e rather than assumed. There is no
  `dx-data-grid` counterpart and therefore no shared base: the grid declares
  no such option and reaches group expansion through methods.

- **`dxRemoteStore({ langParams })` and `langParams` in `dxLoadOptionsParams`** —
  language-sensitive sorting and filtering (`{ locale, collatorOptions }`) now
  reaches the server. It was unreachable in both directions before: the member
  belongs to the `DataSource`, which `dxRemoteStore` constructs internally, and
  the serializer dropped it — invisibly, since DevExtreme declares it on
  `DataSourceOptions` and not on `LoadOptions`, so no typing flagged the gap.
  Note DevExtreme keeps it in the remote payload only when filtering **and**
  sorting are both remote; the grid's default `remoteOperations: 'auto'`
  resolves to all-local for a custom store and strips it, so pair it with
  `[remoteOperations]="true"`.

- **`DxBindingAdapter.reReadAfterWrite`** — an adapter may now opt into a
  post-write convergence read: the engine re-reads the widget immediately
  after every write and folds the result back into the signal. This is for
  widgets that normalize or partially reject a written value *synchronously*:
  the engine's re-entrancy latch deliberately drops the events they fire
  during our own write (they are usually echoes), so without the re-read the
  signal would keep a value the widget refused — and structural equality would
  then suppress the very read that could reconcile the two sides. Off by
  default; adapters whose post-write read can be transiently incomplete (a
  grid's `state()` is `{}` until first render) must not enable it.
- **Grid directive bases are exported from `/data`** —
  `DxFocusedRowKeyDirectiveBase`, `DxFilterValueDirectiveBase`,
  `DxPageIndexDirectiveBase`, `DxPageSizeDirectiveBase`,
  `DxSearchPanelTextDirectiveBase` and `DxGridStateDirectiveBase`, the same
  extension idiom the core family bases already offer. Each grid capability is
  now written once and shared by the `dx-data-grid`/`dx-tree-list` directive
  pairs, which also keeps defaults (such as `dxGridStateDebounce`'s 100 ms) in
  a single place. `/visualization` exports `DxSelectedPointsDirectiveBase` on
  the same footing, shared by the `dx-chart`/`dx-pie-chart` pair.

### Fixed

- **`dxRemoteStore.reload()` raced a pending dependency change instead of
  adopting it.** A manual reload landing inside the `debounce` window fetched
  at the current page, and the debounced dependency run then fired anyway with
  its own page-0 reset — four round trips against two on the same path,
  measured, with the page moving a few hundred milliseconds after the user had
  already asked for fresh data. `reload()` now takes the pending change's
  page-0 reset and drops its timer, so the two collapse into one refetch.

  The adopted path costs one request or two, not a fixed floor — measured:
  resetting the page and refetching are separate `DataSource` operations, so a
  widget sitting off page 0 may issue its current-page load before the page-0
  one, but the grid's own load scheduling can also collapse that transitional
  load into the page-0 read alone. Collapsing it deliberately would mean
  reaching into the widget's paging controller, which this store does not do —
  it owns a `DataSource`, not a grid.

- **`[(dxSelectedPoints)]` kept selections the chart never made.** A descriptor
  matching no point is silently skipped by the adapter's write, and the
  selection events the chart fires during that write are dropped by the
  engine's re-entrancy latch — so the signal held the rejected descriptor and
  structural equality suppressed the read that would have reconciled it. The
  same partial-rejection class as the TreeView fix below, and it takes the same
  remedy: the chart adapter now opts into `reReadAfterWrite`.

  One visible consequence: the signal converges to what the adapter *reads
  back*, so a descriptor written without a `seriesName` returns carrying the
  series' actual name. Code comparing selection descriptors by exact object
  shape should compare by `argument`/`value` instead.

- **`[(dxSelectedNodeKeys)]` kept keys the widget rejected.** TreeView's
  `selectItem(key)` silently no-ops for a key the widget does not know, and
  the selection events it fires during our own write are dropped by the
  engine's re-entrancy latch — so after writing `[3, 999]` with `999` unknown,
  the widget held `[3]` while the signal kept `[3, 999]`, silently and
  forever. The adapter now opts into `reReadAfterWrite` (see *Added*): the
  signal converges to what the widget actually accepted. The TreeView binding
  also gained the smoke screen and both-direction e2e coverage it had shipped
  without.

- **`[(dxFormData)]` stopped emitting on user edits.** `dxForm` edits the
  bound `formData` object **in place**, and the binding handed the widget the
  signal's own object — so both sides observed the same mutation and the
  structural comparison guarding the widget → signal direction could never see
  a difference. Every edit was silently swallowed: the signal kept its value,
  no change detection was scheduled, and `computed()` consumers and the view
  went stale (while the consumer's object was mutated behind their back). The
  adapter now writes a structural clone into the widget and reads one back
  out, so the two object graphs stay separate. Adds `dxStructuralClone` to
  `/core` — the clone counterpart of `dxStructuralEquals`, with exactly its
  reach (plain objects, arrays and `Date` deep; everything else by reference).
- **`[(dxGridState)]` captured an empty layout.** The binding attaches at
  `initialized`, when a grid still reports `{}` from `state()` — the real
  layout only exists after the first render. Without a post-layout re-read the
  signal kept that empty snapshot for the widget's whole lifetime, so anything
  persisting it saved an empty layout. The adapter now also re-reads on
  `contentReady` (the same fix shape as 2.1.0's paging adapters), and refuses
  to write an empty state back into the widget — `state({})` wipes the very
  layout the binding exists to restore.
- **`dxRemoteStore` forwarded string-spelled counts straight into the widget.**
  DevExtreme types `totalCount`/`groupCount` as `number`, but the protocol's
  reference server implementations aggregate counts into a decimal and spell a
  decimal as a quoted JSON string — so a conformant endpoint may answer `"120"`
  where the typings promise `120`. Forwarded untouched, the grid's pager
  arithmetic concatenates instead of adding: a 120-row result rendered as
  "Page 1 of 120 (1200 items)", silently and without an error. Both fields are
  now coerced when the string parses as a finite number. `summary` is
  deliberately left alone — it is positional and may legitimately carry
  non-numeric aggregates.
- **`dxRemoteStore`: `reload()` cancelled in-flight `byKey` lookups.** A
  reload supersedes the *query*; a `byKey` is scoped to a key the widget
  already holds, so aborting it left lookup editors permanently blank — the
  widget asked once for a display text, got a rejection, and never asked
  again. `byKey` requests now live in their own cancellation scope and are
  aborted only on injector destruction.
- **`dxRemoteStore`: a synchronously throwing load function pinned
  `isLoading`.** A load function not declared `async` throws synchronously
  when it fails while building its request; that escaped the tracking, so the
  in-flight count never came back down (`isLoading` stayed `true` for the rest
  of the session) and the reason never reached `error`. Both `load` and
  `byKey` now funnel a synchronous throw into their normal rejection path.

- **`parentIds` is now serialized by `dxLoadOptionsParams`.** It is the one
  loadOptions member a TreeList adds — the keys of the rows being expanded —
  and dropping it made a remote hierarchy unimplementable: the server never
  learned which node was opened. Worth knowing, and verified against the
  reference .NET implementation 5.1.0 rather than assumed: that package
  declares no `ParentIds` and never parsed it, so a remote hierarchy is a
  contract between the widget and *your* endpoint. The client's job is only
  not to drop what the widget produced. Also pinned by the new reference
  screen: DevExtreme's TreeList asks for roots with its `rootValue` sentinel
  `0` (not `null`) and sends both `parentIds` and an equivalent `filter`.

### Verified

- **A stale resolve can never overwrite the newest query.** A `dxRemoteStore`
  loader that never forwards its `AbortSignal` to the transport resolves its
  superseded load normally — and measurement shows the grid still keeps the
  newest result. The mechanism is vendor-side, established against 26.1.3
  sources: the `DataSource` load queue is strictly FIFO per instance, grid
  adapters cancel the superseded operation id on every new load, and
  `_loadFromStore` drops any result whose deferred has already settled. Those
  are untyped internals, so the behaviour is now pinned by an e2e case driving
  an abort-ignoring loader; no client-side guard was added, deliberately.
- **`error` describes the newest load, stated precisely.** The signal carries
  the rejection reason of the most recently *started* load once it settles;
  a load superseded by a newer one never writes it, even when it settles
  later (grouped grids issue parallel loads). The doc comment previously said
  "most recent settled load", which is not what the implementation guarantees
  — the implementation semantic is the intended one and is now documented.

### Docs

- **The README was split into a short front page plus `docs/`.** Quick start,
  the new binding-style chooser, entry points and a documentation table stay in
  the README; the directive catalog, Signal Forms, composition API, remote
  data, semantics and development guides each got their own page. README links
  into `docs/` are absolute GitHub URLs because the npm tarball ships only the
  README.
- **A binding-style comparison** (`docs/binding-styles.md`, live at `/compare`
  in the smoke app): the same field as classic Reactive Forms, `[(dxValue)]`,
  and `[formField]` + `[dxFieldState]`, side by side. Building it produced a
  measured correction: classic reactive-forms *field* state reaches a zoneless
  template on its own (the forms directives mark for check on value/status
  changes — pinned by e2e); what zone.js actually hides is the non-CVA widget
  state this package covers.
- **`docs/signal-forms.md` carries the boundary and corner material**: ISO
  string date models via the widget's own `dateSerializationFormat` (and its
  traps: format inference needs a string to infer from, the
  `forceIsoDateParsing` gate, `Date`-instance aliasing on the no-format path),
  number-box `null`-on-clear against the vendor's `value?: number` typing, the
  three pinned upstream corners, and why `aria-required` is a one-line
  consumer recipe rather than a directive feature (no public vendor surface).
- **`docs/remote-data.md` opens with the loadOptions ecosystem**: who provides
  what between `devextreme`, `devextreme-angular`, DevExtreme.AspNet.Data's
  two halves and this package, plus the measured client/server gap table —
  which loadOptions members the widgets send, which the reference server
  parses, and who closes each gap.

### Changed

- **`dxRemoteStore` is stable — the developer-preview marker is dropped.** The
  API shipped in 2.1.0 is unchanged; what changed is the evidence behind it.
  This cycle closed its defects (count coercion, the `byKey` cancellation
  scope, synchronous-throw tracking, reload adopting a pending dependency
  change), widened the wire-protocol coverage (`parentIds`, `langParams`,
  grouping and summaries), and pinned the vendor-side guarantees it leans on.
  The contract — `load`/`byKey` with `AbortSignal`, `resource()` vocabulary,
  page-ownership semantics — is now a compatibility claim like any other
  binding's.
- **Trademark attribution is now the first thing a reader meets.** The notice
  moved from the foot of the README to directly under the badges, and the npm
  `description` carries the same "independent community project — not
  affiliated with or endorsed by Developer Express Inc." line, since the npm
  page is where most readers land first.

### Removed

- The package logo and its README reference.

### Tests

- Coverage for the two directives that had none: `[(dxFormData)]` and
  `[(dxGridState)]` now have reference sections in the smoke app and
  Playwright tests for both directions — each of the four fixes above is
  pinned by a test that fails without it. `[(dxSearchPanelText)]` ships with
  its own three. The remote surface gained the grouping half (group
  descriptor with `isExpanded`, `groupSummary` and `totalSummary` on the
  wire, envelope summaries rendering), a remote-hierarchy TreeList, the
  TreeView selection screen with the partial-rejection convergence case, and
  the abort-ignoring-loader supersede pin.
- The pre-release review mutation-tested the earlier fixes: six mutations
  survived the suite and each case was reworked until its mutation killed
  exactly it; two turned out to guard unreachable states, and their false
  justifications were corrected at the source instead of being re-asserted.
- Signal Forms is certified end to end: value, `touched` and `disabled`
  across the vendor CVA per editor family; negative pins for what a CVA
  cannot carry (`readonly`, `required`, errors — a case going red means a
  vendor release closed the gap); `[dxFieldState]` presenting errors, async
  `pending` and `hidden` through the widget's own UI, including widget
  re-creation; the three-way binding comparison screen; ISO date round-trips
  via `dateSerializationFormat` plus the inference-from-empty trap; and pins
  for three upstream fragile corners (angular#68076 fixed in 22.0.0,
  angular#67882 blocked-retry semantics, angular#69635 native keystroke loss
  — flush-timing-dependent, with the DevExtreme number box measured immune).
  Suite: 36 → 104.

## 2.1.0 (2026-08-21)

### Added

- **`dxRemoteStore` (developer preview).** Remote data with Angular
  `resource()` vocabulary: wraps a consumer-supplied
  `load(loadOptions, abortSignal)` in a DevExtreme `DataSource` and returns
  `{ dataSource, isLoading, error, reload }`. Semantics, all e2e-verified
  against an in-repo DevExtreme.AspNet.Data protocol stub with injectable
  latency and failures: every load gets an `AbortSignal` and a reload aborts
  in-flight requests (last write wins, no stale results, no stale errors, no
  widget error-UI flash for superseded loads); `error` reflects the most
  recent settled load with `reload()` as the retry; dependency-signal changes
  reset to page 0 while manual `reload()` keeps the page; `debounce` applies
  to dependency-driven reloads only; widget search folds into
  `LoadOptions.filter` (vendor-parity `useDefaultSearch`); `byKey` supports
  lookup editors. Load-only by design — CRUD intentionally stays out of this
  cut (see the README's scope note).
- **`dxLoadOptionsParams`** serializes `LoadOptions` into the query-string
  wire format DevExtreme.AspNet.Data server libraries parse (JSON-encoded
  structured options, plain scalars, string `sort`/`group` entries normalized
  to `{ selector }` objects) — the vendor client's format, through your own
  `fetch`.
- **Reference screens + protocol stub as permanent fixtures.** The smoke app
  gains a `/remote` screen (external filter signals over a remote grid,
  master–detail driven by a selection signal, lookup with server-side search
  and `byKey`, widget re-creation over a surviving store), driven by 14 new
  Playwright tests against `e2e/stub-server.mjs` — assertions about the wire
  protocol are made on real HTTP traffic via the stub's `__stats` endpoint.

### Fixed

- **`[(dxPageIndex)]` / `[(dxPageSize)]` now follow DataSource-level paging
  changes.** The paging adapters additionally re-read on `contentReady`:
  manipulating the bound `DataSource` directly (`pageIndex(0)` + reload — as
  `dxRemoteStore`'s dependency-driven reset does, and as `DataSource.filter()`
  always did) changes paging beneath the `paging` option without any
  `optionChanged`, which previously left the bound signal stale.

## 2.0.0 (2026-08-10)

### Breaking changes

- **Secondary entry points.** The package is now split per family:
  `ngx-devextreme-zoneless/core`, `/editors`, `/navigation`, `/overlays`,
  `/data`, `/visualization`. The main entry re-exports everything, so existing
  imports keep compiling — but the split is what makes a single-directive
  import tree-shake away Gantt, Scheduler, HtmlEditor, charts and grids
  (verified by a bundle probe in CI; a single-FESM layout demonstrably did
  not shake).
- **`onDxWidgetReady` fires per widget instance.** With a getter host
  reference (e.g. a `viewChild(...)` signal) the callback now runs again when
  the widget is destroyed and re-created; it may return a cleanup function
  that runs when the widget goes away. Direct host references keep the
  one-shot behaviour.
- **`injectDxInstance` no longer falls back to ancestor injection.** It is
  strictly `{ self: true }` and throws when the current element does not carry
  the component — the fallback could silently grab a *parent* widget of the
  same type. Use `dxInstanceSignal(viewChild(...))` to reach widgets elsewhere
  in the template.
- **`DxBindingAdapter.events` is typed.** Event names in custom adapters are
  now checked against the widget's `Properties`
  (`DxAdapterEventName<TInstance>`); a typo or a DevExtreme rename is a
  compile error. Stringly-typed custom adapters may need their event names
  corrected.
- **`dxEventSignal` never dedupes.** Every event fire notifies consumers,
  even when DevExtreme reuses or mutates the event-args object (previously
  the signal's default `Object.is` equality could swallow fires).

### Fixed

- **Bindings survive widget re-creation** (the F2 correctness gap): a
  composition-API binding on a `viewChild` signal re-attaches when an `@if` /
  tab panel destroys and re-creates the widget, and the signal's surviving
  state is restored into the new widget. Previously the second widget
  instance was silently unbound.
- Per-attach resources (event unhooks, pusher effect, pending debounce) are
  disposed on re-attach instead of accumulating on `DestroyRef`.

### Added

- **Runtime verification + CI**: a Playwright suite (22 tests) drives the
  zoneless smoke app and checks both directions of every binding family,
  including widget re-creation and echo suppression; GitHub Actions runs
  build, type-contract tests, the bundle probe and the e2e suite on push/PR.
- **Data-in story**: `dxArrayStoreSource(signal)` — a `DataSource` over a
  signal-held array that reloads on change; `dxReloadOn(target, deps)` —
  signal-driven `reload()`/`refresh()` triggers for remote sources. The full
  remote-loading pattern (CustomStore + loading/error signals) ships as a
  documented recipe.
- **Grid state directives**: `[(dxFocusedRowKey)]`, `[(dxFilterValue)]`,
  `[(dxPageIndex)]`, `[(dxPageSize)]` for `dx-data-grid` and `dx-tree-list`,
  and `[(dxGridState)]` — a `stateStoring`-equivalent two-way binding of the
  full grid layout state to a signal (with `DxGridState` type).
- `dxInstanceSignal(hostRef)` — widget instance as a signal that resets to
  `undefined` while the widget is gone and follows re-creation.
- `DxWidgetReadyCleanup`, `DxAdapterEventName`, `DxGridState`,
  `DxArrayStoreSourceOptions`, `DxReloadTarget` types.

### Docs

- README: `undefined` vs `null` contract (`undefined` = absent/never pushed,
  `null` = cleared), the `valueChangeEvent="input"` pairing for live
  `[(dxValue)]` typing, the data-loading section, entry-point layout, and a
  note on DevExpress's official zoneless support status.

## 1.0.0 (2026-07-14)
- Initial public release.
- Strongly-typed directive adapters for editors, selection, navigation, overlays, and visualization.
- Core composition API (`dxOptionSignal`, `dxEventSignal`, `bindDxOption`).
