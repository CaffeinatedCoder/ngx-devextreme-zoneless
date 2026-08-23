---
paths:
  - "e2e/**"
  - "smoke/src/**"
---

# End-to-end conventions

The suite is not a quality gate on this library — it *is* the library's central claim. DevExpress
does not support zoneless, so "these bindings work zoneless against DevExtreme 26.1" is true exactly
to the extent that a Playwright run says so. Write tests accordingly.

## What a case must prove

Every case checks a **direction**: widget→signal (a user gesture updates a readout rendered from the
signal) or signal→widget (a button writes the signal and the widget's DOM follows). A readout that
updates proves the signal write scheduled zoneless CD; a widget that updates proves the pusher effect
ran. A directive with only one direction covered is half-tested — both of 3.0's silent-binding
defects were widget→signal.

## The smoke screens are reference consumers

`smoke/src/*.component.ts` is where the README's examples come from. Write a screen the way a
consumer would, not the way a fixture would: if it stops compiling, the docs are wrong.

## Shared state, and what it costs

`e2e/remote.spec.ts` is `test.describe.configure({ mode: 'default' })` — serial, one worker —
because the stub's config (`delayMs`, `failCount`, `stringCounts`) and its `__stats` are process-wide
mutable state.

**`beforeEach` must wait for every screen to finish its initial load.** A screen still in flight
eats another test's injected failure or skews a request count that belongs to someone else. Adding
two screens in 3.0 broke five previously-passing tests for exactly this reason; the fix was waiting
on all of them, not weakening the assertions.

If a new screen would add traffic to a path other tests count, **give it its own endpoint** — that is
why `/api/grouped-orders` exists alongside `/api/orders` serving the same rows.

## Assert against the wire, not against the app

A counter incremented in a component proves the component ran. The stub's `__stats` — `last` per path
and a bounded `history` — proves what actually reached the server. Protocol claims (a filter shape, a
`parentIds` array, a `groupSummary` expression) are asserted there. `stubReset` between tests keeps
history meaningful.

Note that an Angular `effect()` coalesces multiple signal writes within one change-detection flush,
so an emit counter is a lower bound, never a per-keystroke count. Assert that it *increased*.

## Traps that have cost real time here

- **A hidden page does not render a grid.** rAF-driven rendering never runs when
  `visibilityState === 'hidden'`, so browser-pane or manual DOM inspection lies while the
  DataSource-level state is still readable via `ng.getComponent`. Trust Playwright for DOM
  assertions, and never "confirm" a grid by looking at it in a background tab
- **`async` functions never throw synchronously.** A probe arming a `throw` inside an `async` loader
  exercises the rejected-promise path and passes while the synchronous defect is still live. Put the
  throw in the non-`async` arrow the caller actually invokes
- **DevExtreme floods stdout** with trial-license (`W0019`, `W0021`) and legacy-component (`W3001`)
  warnings on every run. Never read a run's success from a grep over that output; match Playwright's
  own summary line, or route the run through the `verify-runner` agent
- **`npm run e2e` starts both servers itself** via `webServer` and reuses running ones outside CI.
  Never start `stub-server.mjs` or `npm run smoke` by hand alongside it. `node -e "require(...)"` on
  the stub starts a listener and blocks — use `node --check` for a syntax question

## Prove the test, not just the fix

A test written against broken code and never seen to fail asserts nothing, and looks identical to one
that works. After the fix passes, strip **only** the fix, confirm the test fails for the reason you
expect, and restore. The `/prove-defect` skill is this loop written out.

## Probes are temporary

Throwaway probe specs and armed screens are scaffolding. Promote what earned its keep into
`smoke.spec.ts` or `remote.spec.ts` with a comment explaining the failure mode it guards, and delete
the rest — including any probe endpoints or config switches the permanent tests do not use.
