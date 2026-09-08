# Development

```bash
npm run build               # ng-packagr build → dist/ (all entry points)
npm run typecheck:examples  # strict-template check of examples/ + type contract tests
npm run verify              # both
npm run smoke               # runtime smoke test app on http://localhost:4299
npm run e2e                 # Playwright suite against the smoke app
npm run probe               # bundle isolation probe: FESM scan + six-chunk closures (needs a prior build)
npm run ssr                 # server render of every smoke screen under @angular/platform-server
```

The smoke app ([smoke/src/smoke.component.ts](../smoke/src/smoke.component.ts))
boots with `provideZonelessChangeDetection()` — zone.js is not even installed
in this workspace — and exercises text box, select box, check box, slider,
tabs, grid selection/paging/focus, signal-driven data loading, popup
visibility, chart point selection, the composition API and widget
re-creation in a real browser. The Playwright suite
([e2e/smoke.spec.ts](../e2e/smoke.spec.ts)) asserts both directions of every
binding against the `data-testid` readouts and runs in CI on every push.

Six screens, path-switched without a router: `/` is the binding smoke screen,
`/remote` the remote-data reference screens, `/forms` the Signal Forms
certification screen, `/compare` the
[three-way binding-style comparison](binding-styles.md) — including the classic
Reactive Forms syntax running under zoneless, with its measured behaviour
pinned by `e2e/compare.spec.ts` — and, since 4.0, `/coverage` and
`/forms-coverage`: one row per directive the binding screen does not place,
so that every directive in the catalog, not merely every family, is driven
through a real zoneless app in both directions (`e2e/coverage.spec.ts`,
`e2e/forms-coverage.spec.ts`). `/coverage` also pins a signal read inside a
widget-rendered `*dxTemplate` re-rendering with no zone.
The demand-driven bindings 4.0 added after its first cut — file uploader,
calendar zoom level, chat draft, resizable, splitter, focused row by index,
CardView, FileManager, the chart's value axis — have their rows at the tail
of `/coverage` and their cases in `e2e/demand-driven.spec.ts`.

## Server-side rendering, measured

`npm run ssr` builds the smoke app with its server entry
([smoke/src/main.server.ts](../smoke/src/main.server.ts) — the same shell,
zoneless, under `@angular/platform-server` with the vendor's `DxServerModule`)
and renders all six screens in Node through
[scripts/ssr-check.mjs](../scripts/ssr-check.mjs). Every screen has to
bootstrap, become stable, produce its readouts, raise nothing through Angular's
`ErrorHandler`, and leave nothing that fires after the platform is destroyed;
the pinned state is that all six do. What the measurement established:
devextreme-angular constructs every widget on the server (nothing is
platform-gated); the vendor's `DxServerModule` is required, since without it
the widgets' Inferno-rendered parts reach for a global `document` and three
screens never settle; and every viz widget is an empty stand-in on the server
whose methods return nothing — which is why the chart adapters read an empty
selection there instead of throwing from the stand-in's `initialized` timer,
outside Angular's error handling. Nothing is served or hydrated; the run exists
so that a vendor or Angular change to any of this turns CI red.

See [examples/order-dashboard.component.ts](../examples/order-dashboard.component.ts)
for a complete signal-driven dashboard and
[examples/type-tests.ts](../examples/type-tests.ts) for the compile-time
contract tests.
