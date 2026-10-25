# Composition API

The directives are sugar. The same engine is available as injection-context
functions and covers **every option and event of every DevExtreme component**,
fully typed:

```ts
import {
  bindDxOption, dxOptionSignal, dxEventSignal, injectDxHost, injectDxInstance,
} from 'ngx-devextreme-zoneless';

@Component({ /* ... */ })
export class MyComponent {
  // On the same element (inside a directive):
  private readonly textBox = inject(DxTextBoxComponent, { self: true });
  // …or with the wrapper as a type-only import — what the shipped directives
  // do, so that no entry point carries widget runtime:
  private readonly host = injectDxHost<DxTextBoxComponent>();

  // Two-way signal for any option — names & types from DevExtreme Properties:
  readonly placeholder = dxOptionSignal(this.textBox, 'placeholder');
  readonly mode = dxOptionSignal(this.textBox, 'mode', { initialValue: 'search' });

  // Latest payload of any widget event:
  readonly focusOut = dxEventSignal(this.textBox, 'focusOut');

  // Works with view children too (pass the viewChild signal itself):
  private readonly grid = viewChild(DxDataGridComponent<Order, number>);
  readonly filter = dxOptionSignal(this.grid, 'filterValue');

  // Bind an existing signal to an option:
  readonly keys = signal<number[] | undefined>([]);
  constructor() {
    bindDxOption(this.grid, 'selectedRowKeys', this.keys);
  }

  // The raw widget instance as a signal (undefined until created):
  readonly widget = injectDxInstance(DxTextBoxComponent);

  // Same, but for a view child — resets to undefined while the widget is
  // gone and follows re-creation:
  readonly gridWidget = dxInstanceSignal(this.grid);
}
```

## Widget re-creation

Composition-API bindings on a **getter host reference** (a `viewChild(...)`
signal) survive widget re-creation: when an `@if`, a tab panel or re-created
popup content destroys the widget and later creates a new one, the binding
re-attaches automatically and the initial synchronization runs again — a
signal holding state therefore **restores it into the new widget**. The
attribute directives don't need any of this; they die and are re-created with
their element.

`onDxWidgetReady` is the underlying primitive: it fires once per widget
instance, and its callback may return a cleanup that runs when the widget
goes away.

## Real-world cases without a dedicated directive

```ts
// PivotGrid — no two-way options (its mutable state lives in the
// PivotGridDataSource), but every event and option is reachable, typed:
private readonly pivot = inject(DxPivotGridComponent, { self: true });
readonly cellClick = dxEventSignal(this.pivot, 'cellClick');
readonly contextMenu = dxEventSignal(this.pivot, 'contextMenuPreparing');
```

```ts
// Scheduler beyond [(dxCurrentDate)] / [(dxCurrentView)] — appointment
// lifecycle as signals:
private readonly scheduler = inject(DxSchedulerComponent, { self: true });
readonly appointmentAdded = dxEventSignal(this.scheduler, 'appointmentAdded');
```

```ts
// Sortable (e.g. a Kanban board built from dx-sortable + lists) — purely
// event-driven, so state stays in your signals and events drive mutations:
private readonly sortable = viewChild(DxSortableComponent);
readonly reorder = dxEventSignal(this.sortable, 'reorder');
constructor() {
  effect(() => {
    const e = this.reorder();
    if (e) this.cards.update((cards) => moveItem(cards, e.fromIndex, e.toIndex));
  });
}
```

```ts
// Any option of any widget, two-way — e.g. Menu, ButtonGroup, Toolbar, ...:
readonly disabled = dxOptionSignal(this.menu, 'disabled');
```

## Readers for state the widget will not give back

Three helpers in `ngx-devextreme-zoneless/data` are not bindings at all. They
read state DevExtreme either windows or never reports, and nothing is pushed
back — a write would move nothing, which is also why there is no
`[(dxFocusedCell)]` directive and never was a `focusedColumnIndex` one.

### The complete row and column axes

Both public readers are **windowed** under virtual rendering. Measured on a
60 × 20 grid with `rowRenderingMode` and `columnRenderingMode` both `virtual`:
`getVisibleRows()` answers about 10 of the 60 rows and `getVisibleColumns()`
about 5 of the 20 — and the windowed column list carries virtual spacer entries
at its ends. Anything that works past the edge of the screen needs the full
lists:

```ts
import { dxGridColumns, dxGridRows } from 'ngx-devextreme-zoneless/data';

private readonly grid = viewChild('grid', { read: DxDataGridComponent });

selectEverything(): void {
  const instance = this.grid()?.instance;
  if (instance === undefined) return;
  const rows = dxGridRows(instance);       // all 60, group and footer rows included
  const columns = dxGridColumns(instance); // all 20, no virtual spacers
}
```

Both take a `dx-data-grid` or `dx-tree-list` instance and infer that widget's own
`Row` and `Column` types. `dx-card-view` deliberately does not fit: it is not
built on the grids' core and has no row or column virtualization, so its own
`getVisibleCards()` is already complete for the page — filter that on
`visible !== false` though, because it also carries pending inserts the view
does not render.

Three things to know before relying on them:

- **"Complete" means loaded, not the whole dataset.** Under standard paging you
  get the current page. A TreeList defaults `scrolling.mode` to `virtual` with
  `removeInvisiblePages`, so pages scrolled away from have been evicted.
  Enumerating a dataset is the store's job.
- **Virtual rendering and virtual paging are not the same thing, and the
  difference decides what you get.** `scrolling.rowRenderingMode: 'virtual'`
  windows the DOM and leaves every row loaded — that is what these helpers are
  for. `scrolling.mode: 'virtual'` *also* pages the DataSource, so before the
  first scroll only one page is loaded, and a 60-row grid then answers 20. The
  helper is not wrong there; the grid really is holding 20 rows.
- **`dxGridColumns` answers `[]` while `stateStoring` is enabled and still
  loading**, whatever else is true. Read the axes on `contentReady`, not at
  `initialized`.
- **Both return copies.** DevExtreme hands out its live arrays, and sorting or
  splicing one in place corrupts the grid's own state.

If keys are all you need, no helper is required and the route is entirely
public: `getKeyByRowIndex(i, true)` answers for loaded-but-unrendered rows. The
undeclared second argument reaches the controller because public methods are
registered as argument-forwarding wrappers, and the vendor calls it that way
itself.

### The focused cell, and the focused card

```ts
import { dxFocusedCellSignal } from 'ngx-devextreme-zoneless/data';

private readonly grid = viewChild('grid', { read: DxDataGridComponent });
readonly focused = dxFocusedCellSignal<DxDataGridComponent<Order, number>, number>(this.grid);
// → { rowKey: 7, columnField: 'amount' } | undefined
```

The column is **named, not numbered**, on purpose: under column virtualization
the event's `columnIndex` is window-relative and counts the virtual spacers
while the `focusedColumnIndex` option is absolute — measured as index 4 against
dataField `f33` and option value `33`. A command column reports its `type`
(`selection`, `buttons`, …), having neither `dataField` nor `name`, and a group
row's `rowKey` is the group *path* array.

**The widget never reports losing focus.** The event has a single call site,
guarded on a real column index; the internal reset fires nothing and the focus
indices go stale rather than to `-1`. So the signal keeps the last focused cell
after the user tabs away, and "nothing is focused" is not derivable from the
widget — watch `focusout` yourself if you need it. Re-clicking the same cell is
silent (the vendor memoizes by value), entering edit on a cell is silent, and
`keyboardNavigation.enabled: false` emits nothing at all.

`dxFocusedCardSignal` is the CardView counterpart, over `focusedCardChanged` —
the only focus surface that widget has, which is why it appears in no directive
table.

## Custom adapters

For state that is neither an option nor a single event (method-based APIs),
implement a `DxBindingAdapter` and pass it to `bindDxState` — that is exactly
how the chart-selection and tree-view directives are built. If the widget may
normalize or partially reject what your `write` hands it (the tree view
silently skips unknown keys, editors clamp), set `reReadAfterWrite: true` and
the signal converges to what the widget actually accepted. And if you want
template sugar for a component we don't cover, a custom directive is ~10
lines by extending `DxValueDirectiveBase`, `DxVisibleDirectiveBase`, or the
grid bases exported from `/data`.
