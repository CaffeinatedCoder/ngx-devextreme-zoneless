# Development

```bash
npm run build               # ng-packagr build → dist/ (all entry points)
npm run typecheck:examples  # strict-template check of examples/ + type contract tests
npm run verify              # both
npm run smoke               # runtime smoke test app on http://localhost:4299
npm run e2e                 # Playwright suite against the smoke app
npm run probe               # bundle isolation probe: FESM scan + six-chunk closures (needs a prior build)
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

See [examples/order-dashboard.component.ts](../examples/order-dashboard.component.ts)
for a complete signal-driven dashboard and
[examples/type-tests.ts](../examples/type-tests.ts) for the compile-time
contract tests.
