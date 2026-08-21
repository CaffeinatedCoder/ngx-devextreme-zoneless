# Changelog

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
