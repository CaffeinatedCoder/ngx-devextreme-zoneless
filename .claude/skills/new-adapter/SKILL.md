---
name: new-adapter
description: The full walk for adding a two-way binding directive — choosing the adapter kind, wiring the events, registering it, and the six other places a directive has to appear before it exists. Use when adding a `[(dxSomething)]` binding for a DevExtreme widget, extending a family with another widget, or exposing a widget option or method as a signal. Triggers on "add a binding for", "support dxX", "expose X as a signal", "new directive". Not for fixing an existing adapter — that is /prove-defect.
---

# /new-adapter — a directive is eight edits, not one

Missing one of these is silent: the directive compiles, and is invisible to consumers, to the type
contract, or to CI. `[(dxSearchPanelText)]` touched all eight.

Read `.claude/rules/adapters.md` first — it loads with the family directories and holds the design
rules (option vs method-based, when `contentReady` is mandatory, the never-share-a-graph rule). This
is the checklist over it.

## 1. Place it

Which entry point owns the widget: `editors/` (value-holding), `navigation/` (index/selection),
`overlays/` (visibility), `data/` (grids, form, scheduler, treeview), `visualization/` (charts,
range selector). The entry point may import only `devextreme-angular/ui/<widget>` modules it actually
adapts — a stray import breaks `npm run probe`, which is the probe working.

## 2. Choose the adapter kind

Top-level option → `bindOption` with a type-checked option name. Nested option or method-only state
→ a hand-written `DxBindingAdapter` via `bindAdapter`, and almost certainly with a `contentReady`
re-read. The rules file explains why; be able to state the reason if you omit it.

## 3. Reuse a base if one fits

`DxValueDirectiveBase`, `DxSelectedRowKeysDirectiveBase`, `DxSelectedItemKeysDirectiveBase`,
`DxSelectedIndexDirectiveBase`, `DxVisibleDirectiveBase` already carry the model name, the debounce
and equality inputs, and the binding call. A new family gets a new base only if two widgets will
share it.

## 4. Write the directive

Selector `<dx-widget>[dxThing]`, `exportAs: 'dxThing'`, `model.required<T>()` named exactly as the
binding. Generic over the row/key/value type where DevExtreme declares `any`, so the type is inferred
from the consumer's signal rather than lost. Expose a debounce `input()` if widget→signal can burst.

## 5. Register it in the family array

`DX_DATA_DIRECTIVES` / `DX_VALUE_DIRECTIVES` / etc., alphabetically. `DX_SIGNAL_DIRECTIVES` picks it
up from there automatically.

## 6. Extend `examples/type-tests.ts` — in this change, not later

That is the enforcement. At minimum, pin anything a generic adapter casts: every event name it uses
and every widget method it calls, asserted against a concrete component, so a vendor rename fails CI
instead of passing it.

## 7. Add a smoke screen and both-direction e2e

A screen in `smoke/src/`, written the way a consumer would write it — it is where the README's
example comes from. Then a spec covering **both** directions: a user gesture updating the readout,
and a button write updating the widget's DOM. One direction is half-tested; both of 3.0's silent
defects were widget→signal.

If the screen adds traffic to a stub path other tests count, give it its own endpoint.

## 8. Document it

The README's directive table plus a paragraph if the binding has semantics worth stating (what
`null` means, what the debounce interacts with). A directive absent from the table does not exist as
far as users are concerned. Then `CHANGELOG.md`.

## Close

`npm run verify`, `npm run e2e` (the full suite), `npm run probe`. Route them through the
`verify-runner` agent.
