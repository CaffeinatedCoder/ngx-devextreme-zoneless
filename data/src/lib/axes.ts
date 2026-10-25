/**
 * The complete row and column axes of a grid, in display order.
 *
 * Both of DevExtreme's public readers are *windowed* under virtual rendering:
 * measured at 131 rows × 53 columns with `rowRenderingMode` and
 * `columnRenderingMode` both `'virtual'`, `getVisibleRows()` returned 16 of the
 * 131 rows (10 after scrolling) and `getVisibleColumns()` 11 of the 53 — and the
 * windowed column list additionally carries `{ command: 'virtual' }` spacers at
 * its ends. Anything that works past the edge of the screen — a range
 * selection, a fill handle, an export of what the user sees — cannot be built
 * on them.
 *
 * The vendor's own code reaches past the window the same way these helpers do
 * (`keyboard_navigation/m_keyboard_navigation_core.js:41` calls
 * `getVisibleColumns(null, true)`, `focus/m_focus.js:205` calls
 * `getKeyByRowIndex(i, true)`), so this is a supported capability with no
 * declared surface rather than a trick. Verified against 26.1.6.
 */
/**
 * The shape both grid widgets share. Structural on purpose: it accepts a
 * `dxDataGrid` or a `dxTreeList` instance and infers each one's own `Row` and
 * `Column` types from its own declarations, so nothing here names a vendor type.
 * `dxCardView` deliberately does not match — it has `getVisibleCards()` instead,
 * is not built on `grid_core`, and has no row or column virtualization at all,
 * so its public reader is already complete for the page.
 */
export interface DxGridAxes<TRow, TColumn> {
    getVisibleRows(): TRow[];
    getVisibleColumns(): TColumn[];
}

/**
 * Every row the grid currently holds, in display order — group, footer and new
 * rows included, across all loaded pages.
 *
 * **"Complete" means loaded, not the whole dataset.** Under standard paging the
 * answer is the current page; a TreeList defaults `scrolling.mode` to
 * `'virtual'` with `removeInvisiblePages: true`, so pages it has scrolled away
 * from have been evicted and are not in the result. Enumerating a dataset is a
 * job for the store, not for this.
 *
 * The distinction that decides what you get is **virtual rendering versus
 * virtual paging**. `scrolling.rowRenderingMode: 'virtual'` windows the DOM and
 * leaves every row loaded — that is the case these helpers exist for.
 * `scrolling.mode: 'virtual'` additionally *pages the DataSource*, so before the
 * first scroll only one page is loaded: measured, a 60-row grid answered 20,
 * its default page size. The helper is not wrong there — "every row the grid
 * holds" is genuinely 20.
 *
 * There is no public route to the complete row *objects* in 26.1.6 — every
 * entry in every `publicMethods()` array returns either the rendered window or
 * raw data — so this goes through the data controller. If that reader ever
 * disappears this throws rather than falling back to `getVisibleRows()`:
 * a silently windowed answer is the exact defect the helper exists to prevent.
 *
 * The array is a copy. The controller hands out its live array, and sorting or
 * splicing it in place would corrupt the grid's own state.
 */
export function dxGridRows<TRow, TColumn>(
    instance: DxGridAxes<TRow, TColumn>,
): readonly TRow[] {
    const controller = (
        instance as unknown as { getController?: (name: string) => unknown }
    ).getController?.('data');
    const items = (controller as { items?: (allItems?: boolean) => TRow[] } | undefined)?.items;
    if (items === undefined) {
        throw new Error(
            'dxGridRows: this widget exposes no data controller with items(). ' +
                'DevExtreme has no public reader for the complete row list, and ' +
                'getVisibleRows() would answer with the rendered window only.',
        );
    }
    return [...items.call(controller, true)];
}

/**
 * Every visible column, in display order, with no virtual spacers.
 *
 * `getVisibleColumns` forwards extra arguments to its controller
 * (`grid_core/modules/modules.js:292` registers public methods as
 * `(...arguments)` wrappers), and the second one — `isBase` — skips the
 * windowing. The cast is needed because the typings declare only `()` and
 * `(headerLevel: number)`; passing `undefined` for the level means the leaf
 * row, which is what a consumer reading "the columns" wants. Harmless when
 * column virtualization is off, and on the server the windowing never engages
 * at all (`isVirtualMode()` is gated on `hasWindow()`).
 *
 * **Returns `[]` while `stateStoring` is enabled and has not finished loading**
 * — the state-storing extender suppresses the column list until then, whatever
 * `isBase` says. Read the axes on `contentReady`, not at `initialized`.
 *
 * The array is a copy, for the same reason as {@link dxGridRows}.
 */
export function dxGridColumns<TRow, TColumn>(
    instance: DxGridAxes<TRow, TColumn>,
): readonly TColumn[] {
    const read = instance.getVisibleColumns as (
        headerLevel?: number,
        isBase?: boolean,
    ) => TColumn[];
    return [...read.call(instance, undefined, true)];
}
