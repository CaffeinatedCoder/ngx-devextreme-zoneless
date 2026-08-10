# Changelog

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
