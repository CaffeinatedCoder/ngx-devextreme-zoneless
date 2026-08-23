---
name: prove-defect
description: The reproduce-then-fix loop for a suspected binding or protocol defect — arm a probe in the smoke app, write a throwaway spec, watch it fail for the right reason, fix, then prove the test by reverting the fix. Use when a binding "silently does nothing", a signal stops emitting, loading state sticks, a widget shows stale data, or any behaviour needs establishing before it can be fixed. Triggers on "is this a bug", "why doesn't X update", "the signal isn't emitting", "reproduce", "prove this". Not for a defect already covered by a failing test — just fix that one.
---

# /prove-defect — measure it, fix it, then prove the test

Every defect closed in 3.0 went through this loop, and the two that had shipped for two releases
were invisible precisely because nobody ran it. The expensive mistakes are all at the start: a probe
that passes for the wrong reason costs more than no probe.

## 1. State the hypothesis as an observable

Not "dxFormData is broken" but "**typing in a form editor should change the readout rendered from the
signal, and I predict it will not**". If you cannot name the DOM or readout that would differ, you
cannot write the probe — go read the adapter first.

## 2. Arm the smoke app

Add the minimum to `smoke/src/smoke.component.ts` (binding screen) or `remote.component.ts`
(`/remote`): the widget, a readout rendering the signal, and a button writing it. For "does it emit
at all" questions add an emit counter:

```ts
effect(() => { this.thing(); untracked(() => this.emits.update((n) => n + 1)); });
```

Note that an `effect()` coalesces writes inside one CD flush, so this is a lower bound — assert that
it *increased*, never an exact per-keystroke count.

## 3. Write a throwaway spec and run it

`e2e/<thing>-probe.spec.ts`, run alone. **Print the observed values before asserting** —
`console.log` the readout, the wire params, the page errors. The first run's job is to tell you what
actually happens, not to pass.

Traps that have produced false results here:

- **`async` functions never throw synchronously.** Arming a `throw` inside an `async` loader tests
  the rejected-promise path, and the probe passed while the defect was live. Put it in the
  non-`async` arrow the caller invokes
- **a backgrounded page does not render a grid** — rAF never runs when `visibilityState === 'hidden'`.
  Assert through Playwright, not by looking
- **`node -e "require('./e2e/stub-server.mjs')"` starts a listener and blocks.** `node --check` for
  syntax; Playwright owns the servers

## 4. Confirm it fails for the *expected* reason

A red probe is not yet evidence. Read the actual failure: is the readout stale, or did the locator
never match? Is the count wrong, or is the request missing? Wrong-reason failures send fixes at the
wrong layer.

## 5. Fix, and re-run the probe

The fix belongs in the adapter or the engine, not in the screen. If the screen needed changing to
make it pass, the fix is in the wrong place.

## 6. Prove the test by breaking the fix

Strip **only** the fix, confirm the probe fails again for the expected reason, restore. A test that
passes with and without the fix asserts nothing — and one written against broken code looks identical
to one that works. This step is the point of the whole skill.

## 7. Promote and clean up

- Move the case into `e2e/smoke.spec.ts` or `e2e/remote.spec.ts`, in a `describe` named for the
  binding, with a comment stating **the failure mode it guards** — not what it does. The existing
  ones read like "if the widget and the signal share an object graph, the comparison can never see a
  difference and the signal silently stops emitting"
- Keep the smoke-screen additions if they are a reference a consumer would recognise; delete armed
  switches nothing permanent uses
- Delete the probe spec
- Run the **full** suite: a new screen can break existing specs through shared stub state
- Record the finding in `CHANGELOG.md`, and if it is a durable law of the vendor or the protocol, add
  it to `CLAUDE.md`'s Critical Rules with the release that earned it
