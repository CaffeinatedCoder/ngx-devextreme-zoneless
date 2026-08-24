# Composition API

The directives are sugar. The same engine is available as injection-context
functions and covers **every option and event of every DevExtreme component**,
fully typed:

```ts
import {
  bindDxOption, dxOptionSignal, dxEventSignal, injectDxInstance,
} from 'ngx-devextreme-zoneless';

@Component({ /* ... */ })
export class MyComponent {
  // On the same element (inside a directive):
  private readonly textBox = inject(DxTextBoxComponent, { self: true });

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
