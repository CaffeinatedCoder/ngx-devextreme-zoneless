# Binding semantics and type helpers

The engine-level contract every binding shares.

## Semantics

- **Initial sync** (`initialSync`, default `'auto'`): the signal's value is
  pushed into the widget on attach; if it is `undefined`, the widget's current
  value is pulled into the signal instead.
- **`undefined` vs `null`**: `undefined` means *absent* — a signal holding
  `undefined` is never pushed into the widget (that is what makes `'auto'`
  initial sync and late-created widgets work). To *clear* an option through a
  binding, use `null`: `status.set(null)` clears a select box,
  `status.set(undefined)` does nothing. This mirrors DevExtreme's own
  conventions — its clearable editors write `null`, not `undefined`.
- **Debounced typing**: DevExtreme text editors update their `value` option on
  *blur* by default. Pair `[(dxValue)]` + `dxValueDebounce` with
  `valueChangeEvent="input"` on the editor to get live per-keystroke updates:

  ```html
  <dx-text-box [(dxValue)]="search" [dxValueDebounce]="300" valueChangeEvent="input" />
  ```

  Without it, the binding appears to only fire on blur — that is the widget's
  event timing, not the binding's.
- **Echo suppression**: updates only propagate when the value *structurally*
  changed (`Date`-aware, deep for arrays/plain objects). Override per binding
  via `equal` / `dxValueEqual`.
- **Debounce** applies to the widget → signal direction only, so typing into a
  `dx-text-box` doesn't storm your `computed()` graph.
- **Teardown** is automatic via `DestroyRef` — event handlers are detached and
  effects destroyed when the directive/component dies.
- **Re-attach**: with a getter host reference the binding follows widget
  re-creation (see
  [Composition API → Widget re-creation](composition-api.md#widget-re-creation));
  per-widget resources are disposed on each detach.
- **Zoneless**: no `NgZone`, no `markForCheck` — signal writes are the change
  notification.

## Type helpers

All building blocks are exported, e.g.:

```ts
DxHostOptionName<DxTextBoxComponent>          // 'value' | 'placeholder' | 'mode' | ...
DxHostOptionValue<DxTextBoxComponent, 'mode'> // 'email' | 'password' | ... | undefined
DxHostEventName<DxDataGridComponent>          // 'rowClick' | 'selectionChanged' | ...
DxHostEventArg<DxTextBoxComponent, 'valueChanged'>
DxHostValue<DxCheckBoxComponent>              // boolean | null
```
