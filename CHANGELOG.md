# Changelog

## 3.0.0 (unreleased)

### Breaking changes

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

### Changed

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
  its own three. Suite: 36 → 55 — the added coverage is the remote grouping
  half (group descriptor with `isExpanded`, `groupSummary` and `totalSummary`
  on the wire, envelope summaries rendering), a remote-hierarchy TreeList,
  the TreeView selection screen with the partial-rejection convergence case,
  and the abort-ignoring-loader supersede pin.

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
