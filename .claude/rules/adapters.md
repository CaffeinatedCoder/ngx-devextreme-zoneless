---
paths:
  - "core/src/lib/**"
  - "data/src/lib/**"
  - "editors/src/lib/**"
  - "navigation/src/lib/**"
  - "overlays/src/lib/**"
  - "visualization/src/lib/**"
---

# Writing a binding adapter

Every defect this library has shipped lived in an adapter, so this is the recipe rather than a
summary of one. `CLAUDE.md`'s Critical Rules state the invariants; this states the walk.

## Pick the adapter kind first

**Option-based** (`dxOptionAdapter` via `bindOption`) when the state is a *top-level* option in the
widget's `Properties`. The option name is type-checked against the widget, so a typo or a vendor
rename is a compile error. This is the overwhelming majority — `value`, `visible`, `selectedIndex`,
`selectedRowKeys`, `focusedRowKey`, `filterValue`.

**Method-based** (a hand-written `DxBindingAdapter` via `bindAdapter`) when the state is *not* a
top-level option:

- it lives under a nested option — `paging.pageIndex`, `searchPanel.text` — which the typed
  option-name surface deliberately does not cover;
- or it has no option at all and is reached through methods — TreeView's
  `getSelectedNodeKeys()`/`selectItem()`, the charts' point selection, the grids' `state()`.

## A method-based adapter almost always needs `contentReady`

State that is not an option changes without emitting a matching `optionChanged`. Three separate
defects came from exactly this:

- external `dataSource.pageIndex(0)` changes paging beneath the `paging` option and fires no
  `optionChanged` (fixed 2.1.0);
- a grid's `state()` is `{}` until the first render, so a read at `initialized` captures nothing
  (fixed 3.0);
- a `[(dxGridState)]` restore applies the search text through the state machinery rather than
  through a `searchPanel` `optionChanged` (which is why `[(dxSearchPanelText)]` shipped with the
  re-read already in place).

`contentReady` is the event the widget fires after rendering any such change. Structural equality
drops the reads that turn out to be no-ops, so the extra listener costs nothing. **Default to
including it**, and be able to say why if you leave it out.

## The `accept` filter

`optionChanged` fires for every option. Filter on `args.name` — the *root* name, which is what
DevExtreme sets even for a nested change (`name: 'paging'`, `fullName: 'paging.pageIndex'`). When
the adapter also listens to `contentReady`, accept that event by name before touching the payload:

```ts
accept: (eventName, eventArgs) =>
    (eventName as string) === 'contentReady' ||
    (eventArgs as DxOptionChangedArgs).name === 'paging',
```

## Never share a mutable object graph with the widget

If the widget edits what it was handed *in place*, both sides observe the same mutation and the
structural comparison guarding widget→signal can never see a change — the binding goes silent. This
is what happened to `[(dxFormData)]` for two releases. Write `dxStructuralClone(value)` in and read
`dxStructuralClone(...)` back out. Its reach matches `dxStructuralEquals` exactly; if you extend one,
extend the other, or clone depth and comparison depth disagree.

## Normalize "absent" to one representation

A widget that reports no value as `undefined` where the model type is a `string` should be
normalized in `read` (`?? ''`), so "cleared" has a single spelling on the model side.
`[(dxSearchPanelText)]` does this.

## What the engine already guarantees — do not re-implement

- **echo suppression** — structural equality on both directions, plus a re-entrancy latch for the
  synchronous case. Do not add your own guard flags;
- **`undefined` means "do not push"** — the pusher effect skips it deliberately. A signal cannot
  clear an option by going `undefined`; use `null` where the widget accepts one;
- **teardown and re-attach** — with a getter host ref the binding follows widget re-creation and
  re-runs initial sync. Adapters need no lifecycle code;
- **debounce** — offered per binding via `DxBindingOptions.debounceMs`; expose it as an
  `input()` (`dxValueDebounce`, `dxGridStateDebounce`, `dxSearchPanelTextDebounce`) rather than
  hard-coding a timer.

## Generic adapters need a positive control

An adapter written over a type parameter (`TInstance extends DxWidget & GridPagingLike`) cannot have
its event names checked at the declaration site, so it casts. Every name a generic adapter uses must
be pinned in `examples/type-tests.ts` against a concrete component, or a vendor rename passes CI:

```ts
const gridContentReadyEvent: DxHostEventName<Grid> = 'contentReady';
expectType<(text: string) => void>(gridInstance_.searchByText);
```

## Finish the change

A new directive is not done until it is in its family's `DX_*_DIRECTIVES` array, in
`examples/type-tests.ts`, on a smoke screen, covered by e2e in **both** directions, and in the
README's table. See the `/new-adapter` skill for the full walk.
