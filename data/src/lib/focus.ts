/**
 * The focused cell of a grid, and the focused card of a CardView, as read-only
 * signals.
 *
 * These are readers, not bindings, and deliberately so: `focusedColumnIndex`
 * has no directive in this package because its change handler is a no-op marker
 * (`focus/m_focus.js:67` sets `args.handled = true`), so a write moves nothing —
 * and the widget writes both focus indices itself on every cell focus. A
 * two-way directive over state only the widget owns would be a lie about the
 * surface. Verified against 26.1.6.
 */
import { computed, type Injector, type Signal } from '@angular/core';
import {
    dxEventSignal,
    dxStructuralEquals,
    type DxHostComponent,
    type DxHostEventName,
    type DxHostRef,
} from 'ngx-devextreme-zoneless/core';

/** The focused cell, named by its row's key and its column's field. */
export interface DxFocusedCell<TKey = unknown> {
    /**
     * The row's key. For a group row this is the group *path* — an array — and
     * the row's `rowType` is `'group'`, so a consumer that expects a data key
     * should check the shape before using it.
     */
    readonly rowKey: TKey;
    /**
     * `dataField`, falling back to `name`, falling back to the column's `type`.
     * A command column (`'selection'`, `'buttons'`, `'detailExpand'`, `'drag'`,
     * `'expand'`, `'groupExpand'`, `'adaptive'`) carries none of the first two,
     * so it reports its type.
     */
    readonly columnField: string;
}

/** The focused card, named by its key. */
export interface DxFocusedCard<TKey = unknown> {
    readonly cardKey: TKey;
}

/** What the event actually carries, as opposed to what the typings promise. */
interface DxFocusedCellArgs {
    readonly row?: { readonly key?: unknown } | undefined;
    readonly column?:
        | { readonly dataField?: string; readonly name?: string; readonly type?: string }
        | undefined;
}

interface DxFocusedCardArgs {
    readonly card?: { readonly key?: unknown } | undefined;
}

function projectCell<TKey>(args: DxFocusedCellArgs | undefined): DxFocusedCell<TKey> | undefined {
    const row = args?.row;
    const column = args?.column;
    if (row === undefined || column === undefined) {
        return undefined;
    }
    const columnField = column.dataField ?? column.name ?? column.type;
    if (columnField === undefined) {
        return undefined;
    }
    return { rowKey: row.key as TKey, columnField };
}

/**
 * A read-only signal of the focused cell on a `dx-data-grid` or `dx-tree-list`,
 * `undefined` until the first focus. Pass `TKey` to name your key type; the
 * event carries no type information about it.
 *
 * ```ts
 * private readonly grid = viewChild(DxDataGridComponent);
 * readonly focused = dxFocusedCellSignal<number>(this.grid);
 * ```
 *
 * What the widget does and does not tell us, all of it measured:
 *
 * - **It never reports losing focus.** `_fireFocusedCellChanged` has one call
 *   site, guarded on `columnIndex >= 0`, and `_resetFocusedCell` fires nothing;
 *   the focus indices go stale rather than to `-1`. So the signal holds the last
 *   focused cell after the user tabs out of the grid. "No cell is focused" is
 *   not derivable from the widget — a consumer that needs it must watch
 *   `focusout` itself.
 * - **The vendor already deduplicates**, by value on `(rowKey, columnIndex)`
 *   (`keyboard_navigation/m_keyboard_navigation.js:150`), so re-clicking the
 *   same cell is silent, and so is leaving the grid and coming back to it. This
 *   signal adds a structural comparison on the projection on top, which is what
 *   covers the one case the vendor's key misses: the same column can hold a
 *   different window-relative index after a horizontal scroll.
 * - **Entering edit on a cell fires nothing** (`isEditingCell` returns early),
 *   and because the vendor's memo has already stored that cell, focusing it
 *   again after the edit is silent too.
 * - **`keyboardNavigation.enabled: false` emits nothing at all**, and the focus
 *   indices stay at `-1`.
 * - **The event's `columnIndex` is deliberately not exposed.** Under column
 *   virtualization it is window-relative and counts the virtual spacers, while
 *   the `focusedColumnIndex` option is absolute — measured as index 4 against
 *   `dataField` `f33` and option value `33`. `column.dataField` is correct in
 *   both modes, which is why this names the column instead of numbering it.
 */
export function dxFocusedCellSignal<THost extends DxHostComponent, TKey = unknown>(
    hostRef: DxHostRef<THost>,
    injector?: Injector,
): Signal<DxFocusedCell<TKey> | undefined> {
    const latest = dxEventSignal(
        hostRef,
        'focusedCellChanged' as DxHostEventName<THost>,
        injector,
    );
    return computed(() => projectCell<TKey>(latest() as DxFocusedCellArgs | undefined), {
        equal: dxStructuralEquals,
    });
}

/**
 * A read-only signal of the focused card on a `dx-card-view`, `undefined` until
 * the first focus.
 *
 * CardView has no focused-card *option* at all — only `onFocusedCardChanged` —
 * which is why it has no focus binding in this package's directive tables. It
 * fires on arrow keys and on a click that moves the focus, stays silent when the
 * clicked card is already the focused one (including the first card at startup),
 * and, like the grids, says nothing when focus leaves the widget.
 */
export function dxFocusedCardSignal<THost extends DxHostComponent, TKey = unknown>(
    hostRef: DxHostRef<THost>,
    injector?: Injector,
): Signal<DxFocusedCard<TKey> | undefined> {
    const latest = dxEventSignal(
        hostRef,
        'focusedCardChanged' as DxHostEventName<THost>,
        injector,
    );
    return computed(
        () => {
            const card = (latest() as DxFocusedCardArgs | undefined)?.card;
            return card === undefined ? undefined : { cardKey: card.key as TKey };
        },
        { equal: dxStructuralEquals },
    );
}
