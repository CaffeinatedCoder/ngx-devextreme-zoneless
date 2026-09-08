import { Directive, input, model } from '@angular/core';
import type { DxCardViewComponent } from 'devextreme-angular/ui/card-view';
import type { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import type { DxFileManagerComponent } from 'devextreme-angular/ui/file-manager';
import type { DxFormComponent } from 'devextreme-angular/ui/form';
import type { DxGanttComponent } from 'devextreme-angular/ui/gantt';
import type { DxSchedulerComponent } from 'devextreme-angular/ui/scheduler';
import type { DxTreeListComponent } from 'devextreme-angular/ui/tree-list';
import type { DxTreeViewComponent } from 'devextreme-angular/ui/tree-view';
import type { DataChange } from 'devextreme/common/grids';
import {
    DxBindingDirectiveBase,
    DxSelectedItemKeysDirectiveBase,
    DxSelectedRowKeysDirectiveBase,
    dxOptionAdapter,
    dxStructuralClone,
    injectDxHost,
    type DxAdapterEventName,
    type DxBindingAdapter,
    type DxDateValue,
    type DxFilterExpression,
    type DxHostComponent,
    type DxHostOptionName,
    type DxHostOptionValue,
    type DxInstanceOf,
    type DxOptionChangedArgs,
    type DxWidget,
} from 'ngx-devextreme-zoneless/core';

/** `[(dxSelectedRowKeys)]` for `dx-data-grid`; `TKey` is inferred from your signal. */
@Directive({ selector: 'dx-data-grid[dxSelectedRowKeys]', exportAs: 'dxSelectedRowKeys' })
export class DxDataGridSelectedRowKeysDirective<
    TRowData = unknown,
    TKey = unknown,
> extends DxSelectedRowKeysDirectiveBase<DxDataGridComponent<TRowData, TKey>, TKey> {
    constructor() {
        super(injectDxHost<DxDataGridComponent>(), 'selectedRowKeys');
    }
}

/** `[(dxSelectedRowKeys)]` for `dx-tree-list`. */
@Directive({ selector: 'dx-tree-list[dxSelectedRowKeys]', exportAs: 'dxSelectedRowKeys' })
export class DxTreeListSelectedRowKeysDirective<
    TRowData = unknown,
    TKey = unknown,
> extends DxSelectedRowKeysDirectiveBase<DxTreeListComponent<TRowData, TKey>, TKey> {
    constructor() {
        super(injectDxHost<DxTreeListComponent>(), 'selectedRowKeys');
    }
}

/** `[(dxSelectedRowKey)]` for `dx-gantt` (single selection; `null` clears it). */
@Directive({ selector: 'dx-gantt[dxSelectedRowKey]', exportAs: 'dxSelectedRowKey' })
export class DxGanttSelectedRowKeyDirective<TKey = unknown> extends DxBindingDirectiveBase {
    readonly dxSelectedRowKey = model.required<TKey | null>();

    constructor() {
        super();
        this.bindOption<DxGanttComponent, TKey | null>(
            injectDxHost<DxGanttComponent>(),
            'selectedRowKey',
            this.dxSelectedRowKey,
        );
    }
}

/** `[(dxCurrentDate)]` for `dx-scheduler`. */
@Directive({ selector: 'dx-scheduler[dxCurrentDate]', exportAs: 'dxCurrentDate' })
export class DxSchedulerCurrentDateDirective extends DxBindingDirectiveBase {
    readonly dxCurrentDate = model.required<DxDateValue>();

    constructor() {
        super();
        this.bindOption<DxSchedulerComponent, DxDateValue>(
            injectDxHost<DxSchedulerComponent>(),
            'currentDate',
            this.dxCurrentDate,
        );
    }
}

/** The view identifier type of `dx-scheduler` (`'day' | 'week' | ... | string`). */
export type DxSchedulerView = Exclude<
    DxHostOptionValue<DxSchedulerComponent, 'currentView'>,
    undefined
>;

/** `[(dxCurrentView)]` for `dx-scheduler`. */
@Directive({ selector: 'dx-scheduler[dxCurrentView]', exportAs: 'dxCurrentView' })
export class DxSchedulerCurrentViewDirective extends DxBindingDirectiveBase {
    readonly dxCurrentView = model.required<DxSchedulerView>();

    constructor() {
        super();
        this.bindOption<DxSchedulerComponent, DxSchedulerView>(
            injectDxHost<DxSchedulerComponent>(),
            'currentView',
            this.dxCurrentView,
        );
    }
}

/**
 * `[(dxFormData)]` for `dx-form`.
 *
 * DevExtreme edits the bound `formData` object **in place** as the user types.
 * Handing the widget the signal's own object would therefore make both sides
 * of the binding observe the same mutation, and the structural comparison that
 * guards the widget → signal direction could never see a difference — the
 * signal would silently stop emitting. The adapter keeps the two graphs
 * separate instead: it writes a structural clone into the widget and reads one
 * back out, so every edit yields a genuinely new value and `computed()`
 * consumers and zoneless views stay up to date.
 */
@Directive({ selector: 'dx-form[dxFormData]', exportAs: 'dxFormData' })
export class DxFormDataDirective<
    TFormData extends object = Record<string, unknown>,
> extends DxBindingDirectiveBase {
    readonly dxFormData = model.required<TFormData>();

    constructor() {
        super();
        const adapter: DxBindingAdapter<DxInstanceOf<DxFormComponent>, TFormData> = {
            events: ['fieldDataChanged', 'optionChanged'],
            read: (instance) => dxStructuralClone(instance.option('formData') as TFormData),
            write: (instance, value) => {
                (instance.option as (name: string, value: unknown) => void)(
                    'formData',
                    dxStructuralClone(value),
                );
            },
            accept: (eventName, eventArgs) =>
                eventName !== 'optionChanged' ||
                (eventArgs as DxOptionChangedArgs).name === 'formData',
        };
        this.bindAdapter(injectDxHost<DxFormComponent>(), this.dxFormData, adapter);
    }
}

/**
 * `[(dxSelectedNodeKeys)]` for `dx-tree-view`.
 *
 * TreeView has no `selectedItemKeys` option, so this adapter is method-based:
 * it reads `getSelectedNodeKeys()` and writes via `unselectAll()` +
 * `selectItem(key)` inside a `beginUpdate()`/`endUpdate()` batch.
 */
@Directive({ selector: 'dx-tree-view[dxSelectedNodeKeys]', exportAs: 'dxSelectedNodeKeys' })
export class DxTreeViewSelectedNodeKeysDirective<
    TItem = unknown,
    TKey = unknown,
> extends DxBindingDirectiveBase {
    readonly dxSelectedNodeKeys = model.required<readonly TKey[]>();

    constructor() {
        super();
        type TInstance = DxInstanceOf<DxTreeViewComponent<TItem, TKey>>;
        const adapter: DxBindingAdapter<TInstance, readonly TKey[]> = {
            events: ['selectionChanged'],
            // `selectItem(key)` silently no-ops for a key the widget does not
            // know; without the post-write re-read the signal keeps keys the
            // widget rejected, and structural equality suppresses the read
            // that would reconcile them.
            reReadAfterWrite: true,
            read: (instance) => instance.getSelectedNodeKeys(),
            write: (instance, keys) => {
                instance.beginUpdate();
                try {
                    instance.unselectAll();
                    for (const key of keys) {
                        instance.selectItem(key);
                    }
                } finally {
                    instance.endUpdate();
                }
            },
        };
        this.bindAdapter<DxTreeViewComponent<TItem, TKey>, readonly TKey[]>(
            injectDxHost<DxTreeViewComponent>(),
            this.dxSelectedNodeKeys,
            adapter,
        );
    }
}

/* ------------------------------------------------------------------------ *
 *  Grid state beyond selection: focused row, filter, paging, layout state.
 *  dxDataGrid and dxTreeList share these APIs, so each capability is written
 *  once as an abstract base (the same idiom as the core family bases) and
 *  the per-widget directives only inject their host.
 * ------------------------------------------------------------------------ */

/** `[(dxFocusedRowKey)]` base shared by the grid-like widgets; `null` clears the focus. */
@Directive()
export abstract class DxFocusedRowKeyDirectiveBase<
    THost extends DxHostComponent,
    TKey,
> extends DxBindingDirectiveBase {
    readonly dxFocusedRowKey = model.required<TKey | null>();

    protected constructor(host: THost, optionName: DxHostOptionName<THost>) {
        super();
        this.bindOption<THost, TKey | null>(host, optionName, this.dxFocusedRowKey);
    }
}

/** `[(dxFocusedRowKey)]` for `dx-data-grid` (requires `focusedRowEnabled`). */
@Directive({ selector: 'dx-data-grid[dxFocusedRowKey]', exportAs: 'dxFocusedRowKey' })
export class DxDataGridFocusedRowKeyDirective<
    TRowData = unknown,
    TKey = unknown,
> extends DxFocusedRowKeyDirectiveBase<DxDataGridComponent<TRowData, TKey>, TKey> {
    constructor() {
        super(injectDxHost<DxDataGridComponent>(), 'focusedRowKey');
    }
}

/** `[(dxFocusedRowKey)]` for `dx-tree-list` (requires `focusedRowEnabled`). */
@Directive({ selector: 'dx-tree-list[dxFocusedRowKey]', exportAs: 'dxFocusedRowKey' })
export class DxTreeListFocusedRowKeyDirective<
    TRowData = unknown,
    TKey = unknown,
> extends DxFocusedRowKeyDirectiveBase<DxTreeListComponent<TRowData, TKey>, TKey> {
    constructor() {
        super(injectDxHost<DxTreeListComponent>(), 'focusedRowKey');
    }
}

/** `[(dxFilterValue)]` base shared by the grid-like widgets; `null` clears the filter. */
@Directive()
export abstract class DxFilterValueDirectiveBase<
    THost extends DxHostComponent,
> extends DxBindingDirectiveBase {
    readonly dxFilterValue = model.required<DxFilterExpression | null>();

    protected constructor(host: THost, optionName: DxHostOptionName<THost>) {
        super();
        this.bindOption<THost, DxFilterExpression | null>(host, optionName, this.dxFilterValue);
    }
}

/** `[(dxFilterValue)]` for `dx-data-grid`. */
@Directive({ selector: 'dx-data-grid[dxFilterValue]', exportAs: 'dxFilterValue' })
export class DxDataGridFilterValueDirective<
    TRowData = unknown,
    TKey = unknown,
> extends DxFilterValueDirectiveBase<DxDataGridComponent<TRowData, TKey>> {
    constructor() {
        super(injectDxHost<DxDataGridComponent>(), 'filterValue');
    }
}

/** `[(dxFilterValue)]` for `dx-tree-list`. */
@Directive({ selector: 'dx-tree-list[dxFilterValue]', exportAs: 'dxFilterValue' })
export class DxTreeListFilterValueDirective<
    TRowData = unknown,
    TKey = unknown,
> extends DxFilterValueDirectiveBase<DxTreeListComponent<TRowData, TKey>> {
    constructor() {
        super(injectDxHost<DxTreeListComponent>(), 'filterValue');
    }
}

/* Structural view of the paging/state APIs shared by dxDataGrid and dxTreeList. */
interface GridPagingLike {
    pageIndex(): number;
    pageIndex(newIndex: number): unknown;
    pageSize(): number;
    pageSize(value: number): unknown;
}
interface GridStateLike {
    state(): unknown;
    state(state: unknown): void;
}

/**
 * The shared shape of every method-based grid adapter: read and write through
 * methods, listen for `optionChanged` plus `contentReady`, and accept the
 * option change only for `optionName` — or for every option when it is
 * omitted, because any of them may have moved the value.
 *
 * It exists for one reason: the event names have to be cast. An adapter
 * written over a structural type parameter has no `Properties` bag to derive
 * them from, so `DxAdapterEventName` cannot check them where they are written.
 * Doing that once leaves a single cast to keep honest rather than one per
 * capability, and `examples/type-tests.ts` pins `contentReady` against a
 * concrete grid so a vendor rename still fails CI.
 */
function gridMethodAdapter<TInstance extends DxWidget, TValue>(
    optionName: string | undefined,
    read: (instance: TInstance) => TValue,
    write: (instance: TInstance, value: TValue) => void,
): DxBindingAdapter<TInstance, TValue> {
    return {
        events: ['optionChanged', 'contentReady'] as unknown as readonly DxAdapterEventName<
            TInstance
        >[],
        read,
        write,
        accept: (eventName, eventArgs) =>
            (eventName as string) === 'contentReady' ||
            optionName === undefined ||
            (eventArgs as DxOptionChangedArgs).name === optionName,
    };
}

/**
 * Paging lives under the nested `paging` option (`paging.pageIndex`), which
 * option-name typing deliberately does not cover — this adapter goes through
 * the `pageIndex()` / `pageSize()` methods instead and listens for the nested
 * option change. It additionally re-reads on `contentReady`: paging can
 * change beneath the `paging` option, without any `optionChanged`, when the
 * bound `DataSource` is manipulated directly (`dataSource.pageIndex(0)` +
 * reload — e.g. a `dxRemoteStore` dependency-driven page reset), and
 * `contentReady` is the event the grid fires after rendering any such change.
 */
function gridPagingAdapter(
    method: 'pageIndex' | 'pageSize',
): DxBindingAdapter<DxWidget & GridPagingLike, number> {
    return gridMethodAdapter<DxWidget & GridPagingLike, number>(
        'paging',
        (instance) => instance[method](),
        (instance, value) => void instance[method](value),
    );
}

/** `[(dxPageIndex)]` base shared by the grid-like widgets (zero-based). */
@Directive()
export abstract class DxPageIndexDirectiveBase<
    THost extends DxHostComponent<DxWidget & GridPagingLike>,
> extends DxBindingDirectiveBase {
    readonly dxPageIndex = model.required<number>();

    protected constructor(host: THost) {
        super();
        this.bindAdapter<THost, number>(
            host,
            this.dxPageIndex,
            // The `THost` constraint guarantees the instance shape; the cast
            // bridges TS's inability to prove it for an unresolved parameter.
            gridPagingAdapter('pageIndex') as DxBindingAdapter<DxInstanceOf<THost>, number>,
        );
    }
}

/** `[(dxPageSize)]` base shared by the grid-like widgets. */
@Directive()
export abstract class DxPageSizeDirectiveBase<
    THost extends DxHostComponent<DxWidget & GridPagingLike>,
> extends DxBindingDirectiveBase {
    readonly dxPageSize = model.required<number>();

    protected constructor(host: THost) {
        super();
        this.bindAdapter<THost, number>(
            host,
            this.dxPageSize,
            gridPagingAdapter('pageSize') as DxBindingAdapter<DxInstanceOf<THost>, number>,
        );
    }
}

/** `[(dxPageIndex)]` for `dx-data-grid` (zero-based). */
@Directive({ selector: 'dx-data-grid[dxPageIndex]', exportAs: 'dxPageIndex' })
export class DxDataGridPageIndexDirective<
    TRowData = unknown,
    TKey = unknown,
> extends DxPageIndexDirectiveBase<DxDataGridComponent<TRowData, TKey>> {
    constructor() {
        super(injectDxHost<DxDataGridComponent>());
    }
}

/** `[(dxPageIndex)]` for `dx-tree-list` (zero-based). */
@Directive({ selector: 'dx-tree-list[dxPageIndex]', exportAs: 'dxPageIndex' })
export class DxTreeListPageIndexDirective<
    TRowData = unknown,
    TKey = unknown,
> extends DxPageIndexDirectiveBase<DxTreeListComponent<TRowData, TKey>> {
    constructor() {
        super(injectDxHost<DxTreeListComponent>());
    }
}

/** `[(dxPageSize)]` for `dx-data-grid`. */
@Directive({ selector: 'dx-data-grid[dxPageSize]', exportAs: 'dxPageSize' })
export class DxDataGridPageSizeDirective<
    TRowData = unknown,
    TKey = unknown,
> extends DxPageSizeDirectiveBase<DxDataGridComponent<TRowData, TKey>> {
    constructor() {
        super(injectDxHost<DxDataGridComponent>());
    }
}

/** `[(dxPageSize)]` for `dx-tree-list`. */
@Directive({ selector: 'dx-tree-list[dxPageSize]', exportAs: 'dxPageSize' })
export class DxTreeListPageSizeDirective<
    TRowData = unknown,
    TKey = unknown,
> extends DxPageSizeDirectiveBase<DxTreeListComponent<TRowData, TKey>> {
    constructor() {
        super(injectDxHost<DxTreeListComponent>());
    }
}

/* Structural view of the search API shared by dxDataGrid and dxTreeList. */
interface GridSearchLike {
    searchByText(text: string): void;
}

/**
 * The search panel's phrase lives under the nested `searchPanel` option
 * (`searchPanel.text`), which option-name typing deliberately does not cover
 * — this adapter writes through the `searchByText()` method and reads the
 * nested option back, listening for the `searchPanel` option change. It also
 * re-reads on `contentReady`, as the family default for method-based grid
 * adapters — not because a silent path is known. Both this listener and the
 * `?? ''` below survive having themselves deleted: against 26.1.3 every
 * mutator of `searchPanel.text`, the `[(dxGridState)]` restore included, goes
 * through the public option setter and raises `optionChanged`, and the
 * vendor's own default for the option is `''` rather than `undefined`, so the
 * widget never hands back an absent value.
 *
 * The `?? ''` is kept regardless, because it is the only thing that makes the
 * declared `string` model type true at runtime: `applyFromWidget` writes
 * whatever `read` returns straight into the signal — the skip-`undefined`
 * rule guards the pusher effect, not the reader — so an adapter returning
 * `undefined` would quietly put `undefined` in a `string` model.
 */
function searchPanelTextAdapter(): DxBindingAdapter<DxWidget & GridSearchLike, string> {
    return gridMethodAdapter<DxWidget & GridSearchLike, string>(
        'searchPanel',
        (instance) =>
            ((instance.option as (name: string) => unknown)('searchPanel.text') as
                | string
                | undefined) ?? '',
        (instance, value) => instance.searchByText(value),
    );
}

/**
 * `[(dxSearchPanelText)]` base shared by the grid-like widgets — two-way
 * binds the search panel's phrase to a signal, so the grid's own search box
 * can drive query state that lives outside the widget:
 *
 * ```html
 * <dx-data-grid [(dxSearchPanelText)]="search" [dxSearchPanelTextDebounce]="300">
 *   <dxo-search-panel [visible]="true" />
 * </dx-data-grid>
 * ```
 *
 * Pairing it with `dxRemoteStore({ deps: [search] })` turns the built-in
 * search box into a server-side search without an external input. Widget →
 * signal reads are debounced via `dxSearchPanelTextDebounce` (default 0);
 * that debounce is this binding's, and is independent of the widget's own
 * `searchPanel` timeout.
 */
@Directive()
export abstract class DxSearchPanelTextDirectiveBase<
    THost extends DxHostComponent<DxWidget & GridSearchLike>,
> extends DxBindingDirectiveBase {
    readonly dxSearchPanelText = model.required<string>();
    readonly dxSearchPanelTextDebounce = input(0);

    protected constructor(host: THost) {
        super();
        this.bindAdapter<THost, string>(
            host,
            this.dxSearchPanelText,
            searchPanelTextAdapter() as DxBindingAdapter<DxInstanceOf<THost>, string>,
            { debounceMs: () => this.dxSearchPanelTextDebounce() },
        );
    }
}

/** `[(dxSearchPanelText)]` for `dx-data-grid` — see {@link DxSearchPanelTextDirectiveBase}. */
@Directive({ selector: 'dx-data-grid[dxSearchPanelText]', exportAs: 'dxSearchPanelText' })
export class DxDataGridSearchPanelTextDirective<
    TRowData = unknown,
    TKey = unknown,
> extends DxSearchPanelTextDirectiveBase<DxDataGridComponent<TRowData, TKey>> {
    constructor() {
        super(injectDxHost<DxDataGridComponent>());
    }
}

/** `[(dxSearchPanelText)]` for `dx-tree-list` — see {@link DxSearchPanelTextDirectiveBase}. */
@Directive({ selector: 'dx-tree-list[dxSearchPanelText]', exportAs: 'dxSearchPanelText' })
export class DxTreeListSearchPanelTextDirective<
    TRowData = unknown,
    TKey = unknown,
> extends DxSearchPanelTextDirectiveBase<DxTreeListComponent<TRowData, TKey>> {
    constructor() {
        super(injectDxHost<DxTreeListComponent>());
    }
}

/**
 * A serialized grid layout state as produced by the `state()` method —
 * column order/width/sort, paging, selection, search text, ... The shape is
 * DevExtreme-internal but JSON-serializable by design (it is what
 * `stateStoring` persists).
 */
export type DxGridState = Record<string, unknown>;

function gridStateAdapter(): DxBindingAdapter<
    DxWidget & GridStateLike,
    DxGridState | null | undefined
> {
    // No option name: *any* option change may affect the persisted state, and
    // structural equality drops the reads that turn out not to. `contentReady`
    // matters here more than anywhere — a grid only *has* a layout state once
    // it has rendered, so at `initialized` time, when this binding attaches,
    // `state()` still reports `{}`.
    return gridMethodAdapter<DxWidget & GridStateLike, DxGridState | null | undefined>(
        undefined,
        (instance) => instance.state() as DxGridState,
        (instance, value) => {
            // That empty snapshot must never travel back into the widget:
            // `state({})` wipes the very layout the binding exists to restore.
            // Only a real state or an explicit `null` (reset) is written.
            if (value !== null && value !== undefined && Object.keys(value).length === 0) {
                return;
            }
            instance.state(value ?? null);
        },
    );
}

/**
 * `[(dxGridState)]` base shared by the grid-like widgets — two-way binds the
 * full layout state (`state()` / `stateStoring`) to a signal, e.g. for
 * persisting layouts:
 *
 *  - signal `undefined` ⇒ nothing is pushed; the widget's current state is
 *    pulled once ready (first run without a saved layout);
 *  - signal holding a saved {@link DxGridState} ⇒ the layout is restored;
 *  - signal set to `null` ⇒ the grid resets to its default layout.
 *
 * Widget → signal reads are debounced via `dxGridStateDebounce` (default
 * 100 ms) because user interactions can burst option changes.
 */
@Directive()
export abstract class DxGridStateDirectiveBase<
    THost extends DxHostComponent<DxWidget & GridStateLike>,
> extends DxBindingDirectiveBase {
    readonly dxGridState = model.required<DxGridState | null | undefined>();
    readonly dxGridStateDebounce = input(100);

    protected constructor(host: THost) {
        super();
        this.bindAdapter<THost, DxGridState | null | undefined>(
            host,
            this.dxGridState,
            gridStateAdapter() as DxBindingAdapter<DxInstanceOf<THost>, DxGridState | null | undefined>,
            { debounceMs: () => this.dxGridStateDebounce() },
        );
    }
}

/** `[(dxGridState)]` for `dx-data-grid` — see {@link DxGridStateDirectiveBase}. */
@Directive({ selector: 'dx-data-grid[dxGridState]', exportAs: 'dxGridState' })
export class DxDataGridStateDirective<
    TRowData = unknown,
    TKey = unknown,
> extends DxGridStateDirectiveBase<DxDataGridComponent<TRowData, TKey>> {
    constructor() {
        super(injectDxHost<DxDataGridComponent>());
    }
}

/** `[(dxGridState)]` for `dx-tree-list` — see {@link DxGridStateDirectiveBase}. */
@Directive({ selector: 'dx-tree-list[dxGridState]', exportAs: 'dxGridState' })
export class DxTreeListStateDirective<
    TRowData = unknown,
    TKey = unknown,
> extends DxGridStateDirectiveBase<DxTreeListComponent<TRowData, TKey>> {
    constructor() {
        super(injectDxHost<DxTreeListComponent>());
    }
}

/**
 * `[(dxExpandedRowKeys)]` for `dx-tree-list` — two-way binds the set of
 * expanded rows to a signal, so a hierarchy's expansion state can be restored,
 * persisted, or driven from outside the widget:
 *
 * ```html
 * <dx-tree-list [(dxExpandedRowKeys)]="expanded" keyExpr="id" parentIdExpr="parentId">
 * ```
 *
 * The signal holds the *complete* set of expanded keys, so writing `[]`
 * collapses everything and writing a new array both expands and collapses to
 * match it.
 *
 * Unlike the bindings above this one has no `dx-data-grid` counterpart, and
 * gets no shared base for it: `expandedRowKeys` is declared on `dxTreeList`
 * alone, while a data grid's *group* expansion is reachable only through
 * `expandRow`/`collapseAll` methods. A family of one is written once.
 *
 * It is also a plain option adapter with **no** `contentReady` re-read, which
 * is the exception the family default warrants a reason for: `expandedRowKeys`
 * is a top-level option, and every path that changes it — the user clicking an
 * expand arrow, `expandRow()`, `collapseRow()` — writes it through the public
 * option setter and raises an ordinary `optionChanged`. Both directions are
 * pinned by e2e rather than by assumption.
 */
@Directive({ selector: 'dx-tree-list[dxExpandedRowKeys]', exportAs: 'dxExpandedRowKeys' })
export class DxTreeListExpandedRowKeysDirective<
    TRowData = unknown,
    TKey = unknown,
> extends DxBindingDirectiveBase {
    readonly dxExpandedRowKeys = model.required<readonly TKey[]>();

    constructor() {
        super();
        this.bindOption<DxTreeListComponent<TRowData, TKey>, readonly TKey[]>(
            injectDxHost<DxTreeListComponent>(),
            'expandedRowKeys',
            this.dxExpandedRowKeys,
        );
    }
}

/* Structural view of the TreeView node API used for expansion state. */
interface TreeNodeLike<TKey> {
    readonly key?: TKey;
    readonly expanded?: boolean;
    readonly items?: readonly TreeNodeLike<TKey>[];
}

function collectExpandedKeys<TKey>(nodes: readonly TreeNodeLike<TKey>[], into: TKey[]): TKey[] {
    for (const node of nodes) {
        if (node.expanded === true && node.key !== undefined) {
            into.push(node.key);
        }
        if (node.items !== undefined && node.items.length > 0) {
            collectExpandedKeys(node.items, into);
        }
    }
    return into;
}

/**
 * `[(dxExpandedNodeKeys)]` for `dx-tree-view` — the set of expanded nodes on
 * a signal, so a navigation tree comes back opened the way the user left it
 * and can be driven from outside:
 *
 * ```html
 * <dx-tree-view [(dxExpandedNodeKeys)]="expanded" [items]="items" keyExpr="id" />
 * ```
 *
 * TreeView has no option holding this state (`expandedExpr` names a field on
 * the *items*), so the adapter is method-based: it reads the `expanded` flag
 * off `getNodes()` and writes via `collapseAll()` + `expandItem(key)` inside
 * a `beginUpdate()`/`endUpdate()` batch. The signal holds the *complete* set,
 * so a new array both expands and collapses to match and `[]` collapses all.
 * `expandItem` silently no-ops on a key the widget does not know, hence the
 * post-write re-read (same partial-rejection class as `[(dxSelectedNodeKeys)]`);
 * `contentReady` re-reads what a data source that arrives after the widget
 * marks expanded through `expandedExpr`, which fires no item event.
 */
@Directive({ selector: 'dx-tree-view[dxExpandedNodeKeys]', exportAs: 'dxExpandedNodeKeys' })
export class DxTreeViewExpandedNodeKeysDirective<
    TItem = unknown,
    TKey = unknown,
> extends DxBindingDirectiveBase {
    readonly dxExpandedNodeKeys = model.required<readonly TKey[]>();

    constructor() {
        super();
        type TInstance = DxInstanceOf<DxTreeViewComponent<TItem, TKey>>;
        const adapter: DxBindingAdapter<TInstance, readonly TKey[]> = {
            events: ['itemExpanded', 'itemCollapsed', 'contentReady'],
            reReadAfterWrite: true,
            read: (instance) =>
                collectExpandedKeys(instance.getNodes() as readonly TreeNodeLike<TKey>[], []),
            write: (instance, keys) => {
                instance.beginUpdate();
                try {
                    instance.collapseAll();
                    for (const key of keys) {
                        void instance.expandItem(key);
                    }
                } finally {
                    instance.endUpdate();
                }
            },
        };
        this.bindAdapter<DxTreeViewComponent<TItem, TKey>, readonly TKey[]>(
            injectDxHost<DxTreeViewComponent>(),
            this.dxExpandedNodeKeys,
            adapter,
        );
    }
}

/* ------------------------------------------------------------------------ *
 *  Editing state (4.0). DevExtreme designed `editing.changes` and
 *  `editing.editRowKey` for external ownership — they are how the React and
 *  Vue wrappers keep batch edits in application state — and both grids
 *  declare them on the shared `EditingBase`. Nested options, so both adapters
 *  are method-based through `option('editing.…')`, accept the `editing`
 *  root name and re-read on `contentReady` as the family default.
 * ------------------------------------------------------------------------ */

/** A pending edit as the grids' `editing.changes` declare it: `{ type, key, data }`. */
export type DxDataChange<TRowData = unknown, TKey = unknown> = DataChange<TRowData, TKey>;

function gridEditingChangesAdapter<TRowData, TKey>(): DxBindingAdapter<
    DxWidget,
    readonly DxDataChange<TRowData, TKey>[]
> {
    // Cloned both ways: the editing controller keeps its own array and
    // mutates the entries' `data` objects as the user types, so handing it
    // the signal's array would let both sides observe one mutation and hide
    // every change from the structural comparison — the `[(dxFormData)]`
    // defect, one level down.
    return gridMethodAdapter<DxWidget, readonly DxDataChange<TRowData, TKey>[]>(
        'editing',
        (instance) =>
            dxStructuralClone(
                ((instance.option as (name: string) => unknown)('editing.changes') as
                    | readonly DxDataChange<TRowData, TKey>[]
                    | undefined) ?? [],
            ),
        (instance, changes) => {
            (instance.option as (name: string, value: unknown) => void)(
                'editing.changes',
                dxStructuralClone(changes),
            );
        },
    );
}

function gridEditRowKeyAdapter<TKey>(): DxBindingAdapter<DxWidget, TKey | null> {
    return gridMethodAdapter<DxWidget, TKey | null>(
        'editing',
        (instance) =>
            ((instance.option as (name: string) => unknown)('editing.editRowKey') as
                | TKey
                | null
                | undefined) ?? null,
        (instance, key) => {
            (instance.option as (name: string, value: unknown) => void)('editing.editRowKey', key);
        },
    );
}

/**
 * `[(dxEditingChanges)]` base shared by the grid-like widgets — the pending
 * edits of batch/cell editing as a signal:
 *
 * ```html
 * <dx-data-grid [(dxEditingChanges)]="changes" [dataSource]="rows" keyExpr="id">
 *   <dxo-editing mode="batch" [allowUpdating]="true" />
 * </dx-data-grid>
 * ```
 *
 * Each entry is `{ type: 'insert' | 'update' | 'remove', key, data }`; writing
 * `[]` discards every pending edit, and a saved array restores them. The grid
 * never shares the signal's objects — see the adapter for why.
 */
@Directive()
export abstract class DxEditingChangesDirectiveBase<
    THost extends DxHostComponent,
    TRowData,
    TKey,
> extends DxBindingDirectiveBase {
    readonly dxEditingChanges = model.required<readonly DxDataChange<TRowData, TKey>[]>();

    protected constructor(host: THost) {
        super();
        this.bindAdapter<THost, readonly DxDataChange<TRowData, TKey>[]>(
            host,
            this.dxEditingChanges,
            gridEditingChangesAdapter<TRowData, TKey>() as DxBindingAdapter<
                DxInstanceOf<THost>,
                readonly DxDataChange<TRowData, TKey>[]
            >,
        );
    }
}

/** `[(dxEditingChanges)]` for `dx-data-grid` — see {@link DxEditingChangesDirectiveBase}. */
@Directive({ selector: 'dx-data-grid[dxEditingChanges]', exportAs: 'dxEditingChanges' })
export class DxDataGridEditingChangesDirective<
    TRowData = unknown,
    TKey = unknown,
> extends DxEditingChangesDirectiveBase<DxDataGridComponent<TRowData, TKey>, TRowData, TKey> {
    constructor() {
        super(injectDxHost<DxDataGridComponent>());
    }
}

/** `[(dxEditingChanges)]` for `dx-tree-list` — see {@link DxEditingChangesDirectiveBase}. */
@Directive({ selector: 'dx-tree-list[dxEditingChanges]', exportAs: 'dxEditingChanges' })
export class DxTreeListEditingChangesDirective<
    TRowData = unknown,
    TKey = unknown,
> extends DxEditingChangesDirectiveBase<DxTreeListComponent<TRowData, TKey>, TRowData, TKey> {
    constructor() {
        super(injectDxHost<DxTreeListComponent>());
    }
}

/**
 * `[(dxEditRowKey)]` base shared by the grid-like widgets — the row currently
 * in row/form/popup edit mode, `null` when none; writing a key opens that
 * row's editor, writing `null` closes it.
 */
@Directive()
export abstract class DxEditRowKeyDirectiveBase<
    THost extends DxHostComponent,
    TKey,
> extends DxBindingDirectiveBase {
    readonly dxEditRowKey = model.required<TKey | null>();

    protected constructor(host: THost) {
        super();
        this.bindAdapter<THost, TKey | null>(
            host,
            this.dxEditRowKey,
            gridEditRowKeyAdapter<TKey>() as DxBindingAdapter<DxInstanceOf<THost>, TKey | null>,
        );
    }
}

/** `[(dxEditRowKey)]` for `dx-data-grid` — see {@link DxEditRowKeyDirectiveBase}. */
@Directive({ selector: 'dx-data-grid[dxEditRowKey]', exportAs: 'dxEditRowKey' })
export class DxDataGridEditRowKeyDirective<
    TRowData = unknown,
    TKey = unknown,
> extends DxEditRowKeyDirectiveBase<DxDataGridComponent<TRowData, TKey>, TKey> {
    constructor() {
        super(injectDxHost<DxDataGridComponent>());
    }
}

/** `[(dxEditRowKey)]` for `dx-tree-list` — see {@link DxEditRowKeyDirectiveBase}. */
@Directive({ selector: 'dx-tree-list[dxEditRowKey]', exportAs: 'dxEditRowKey' })
export class DxTreeListEditRowKeyDirective<
    TRowData = unknown,
    TKey = unknown,
> extends DxEditRowKeyDirectiveBase<DxTreeListComponent<TRowData, TKey>, TKey> {
    constructor() {
        super(injectDxHost<DxTreeListComponent>());
    }
}

/**
 * `[(dxSelectionFilter)]` for `dx-data-grid` — deferred selection as a
 * signal. With `<dxo-selection mode="multiple" [deferred]="true" />` the grid
 * keeps no key array at all; it keeps a *filter expression* describing the
 * selected rows, which is what makes "select all" on a remote data source
 * scale, and what a server can apply directly. This is the remote-scale
 * counterpart of `[(dxSelectedRowKeys)]`; pair it with `dxRemoteStore`.
 * `dx-data-grid` only — TreeList declares neither `selectionFilter` nor
 * `selection.deferred` (26.1.4).
 */
@Directive({ selector: 'dx-data-grid[dxSelectionFilter]', exportAs: 'dxSelectionFilter' })
export class DxDataGridSelectionFilterDirective<
    TRowData = unknown,
    TKey = unknown,
> extends DxBindingDirectiveBase {
    readonly dxSelectionFilter = model.required<DxFilterExpression | null>();

    constructor() {
        super();
        this.bindOption<DxDataGridComponent<TRowData, TKey>, DxFilterExpression | null>(
            injectDxHost<DxDataGridComponent>(),
            'selectionFilter',
            this.dxSelectionFilter,
        );
    }
}

/* ------------------------------------------------------------------------ *
 *  Focused row by index (4.0). `focusedRowIndex` is a top-level option and
 *  the keyboard-navigation controller writes it through the setter on every
 *  click and arrow key — but it also pre-positions the focused cell silently
 *  during Ctrl+Home/End virtual-scroll navigation before the real focus
 *  commits, and paging reconciliation resets it to -1 through a data
 *  operation (verified against 26.1.4). Hence the family default: the option
 *  change plus a `contentReady` re-read. `focusedColumnIndex` is deliberately
 *  absent: the widget's change handler for it is a no-op marker, so an
 *  external write moves nothing — read it with `dxOptionSignal` instead.
 * ------------------------------------------------------------------------ */

function gridFocusedRowIndexAdapter(): DxBindingAdapter<DxWidget, number> {
    return gridMethodAdapter<DxWidget, number>(
        'focusedRowIndex',
        (instance) =>
            ((instance.option as (name: string) => unknown)('focusedRowIndex') as number | undefined) ?? -1,
        (instance, index) => {
            (instance.option as (name: string, value: unknown) => void)('focusedRowIndex', index);
        },
    );
}

/**
 * `[(dxFocusedRowIndex)]` base shared by the grid-like widgets — the focused
 * row's index on the current page, `-1` when none. Requires
 * `focusedRowEnabled`; a written index resolves to its key and focuses the
 * row, paging to it if needed. Prefer `[(dxFocusedRowKey)]` where identity
 * matters across reloads: the index is the render-relative value.
 */
@Directive()
export abstract class DxFocusedRowIndexDirectiveBase<
    THost extends DxHostComponent,
> extends DxBindingDirectiveBase {
    readonly dxFocusedRowIndex = model.required<number>();

    protected constructor(host: THost) {
        super();
        this.bindAdapter<THost, number>(
            host,
            this.dxFocusedRowIndex,
            gridFocusedRowIndexAdapter() as DxBindingAdapter<DxInstanceOf<THost>, number>,
        );
    }
}

/** `[(dxFocusedRowIndex)]` for `dx-data-grid` (requires `focusedRowEnabled`). */
@Directive({ selector: 'dx-data-grid[dxFocusedRowIndex]', exportAs: 'dxFocusedRowIndex' })
export class DxDataGridFocusedRowIndexDirective<
    TRowData = unknown,
    TKey = unknown,
> extends DxFocusedRowIndexDirectiveBase<DxDataGridComponent<TRowData, TKey>> {
    constructor() {
        super(injectDxHost<DxDataGridComponent>());
    }
}

/** `[(dxFocusedRowIndex)]` for `dx-tree-list` (requires `focusedRowEnabled`). */
@Directive({ selector: 'dx-tree-list[dxFocusedRowIndex]', exportAs: 'dxFocusedRowIndex' })
export class DxTreeListFocusedRowIndexDirective<
    TRowData = unknown,
    TKey = unknown,
> extends DxFocusedRowIndexDirectiveBase<DxTreeListComponent<TRowData, TKey>> {
    constructor() {
        super(injectDxHost<DxTreeListComponent>());
    }
}

/* ------------------------------------------------------------------------ *
 *  CardView (4.0). Not built on `grid_core`: a separate controller-based
 *  implementation in which every two-way state (`selectedCardKeys`,
 *  `paging.*`, `searchPanel.text`, `filterValue`) is an `OptionsController
 *  .twoWay()` whose setter is a real `option()` write, and `contentReady`
 *  fires after every load (verified against 26.1.4). It exposes the same
 *  `pageIndex()`/`pageSize()`/`searchByText()` methods as the grids, so the
 *  paging, search and filter bases apply unchanged.
 * ------------------------------------------------------------------------ */

/**
 * `[(dxSelectedCardKeys)]` for `dx-card-view`; `TKey` is inferred from your
 * signal. A written key set is applied after the widget has loaded the cards
 * for those keys, and keys that match no card are dropped through a later
 * `optionChanged` — an asynchronous correction the binding folds in as it
 * would any user change.
 */
@Directive({ selector: 'dx-card-view[dxSelectedCardKeys]', exportAs: 'dxSelectedCardKeys' })
export class DxCardViewSelectedCardKeysDirective<
    TCardData = unknown,
    TKey = unknown,
> extends DxBindingDirectiveBase {
    readonly dxSelectedCardKeys = model.required<readonly TKey[]>();

    constructor() {
        super();
        this.bindOption<DxCardViewComponent<TCardData, TKey>, readonly TKey[]>(
            injectDxHost<DxCardViewComponent>(),
            'selectedCardKeys',
            this.dxSelectedCardKeys,
        );
    }
}

/** `[(dxPageIndex)]` for `dx-card-view` (zero-based). */
@Directive({ selector: 'dx-card-view[dxPageIndex]', exportAs: 'dxPageIndex' })
export class DxCardViewPageIndexDirective<
    TCardData = unknown,
    TKey = unknown,
> extends DxPageIndexDirectiveBase<DxCardViewComponent<TCardData, TKey>> {
    constructor() {
        super(injectDxHost<DxCardViewComponent>());
    }
}

/** `[(dxPageSize)]` for `dx-card-view`. */
@Directive({ selector: 'dx-card-view[dxPageSize]', exportAs: 'dxPageSize' })
export class DxCardViewPageSizeDirective<
    TCardData = unknown,
    TKey = unknown,
> extends DxPageSizeDirectiveBase<DxCardViewComponent<TCardData, TKey>> {
    constructor() {
        super(injectDxHost<DxCardViewComponent>());
    }
}

/** `[(dxFilterValue)]` for `dx-card-view`. */
@Directive({ selector: 'dx-card-view[dxFilterValue]', exportAs: 'dxFilterValue' })
export class DxCardViewFilterValueDirective<
    TCardData = unknown,
    TKey = unknown,
> extends DxFilterValueDirectiveBase<DxCardViewComponent<TCardData, TKey>> {
    constructor() {
        super(injectDxHost<DxCardViewComponent>(), 'filterValue');
    }
}

/** `[(dxSearchPanelText)]` for `dx-card-view` — see {@link DxSearchPanelTextDirectiveBase}. */
@Directive({ selector: 'dx-card-view[dxSearchPanelText]', exportAs: 'dxSearchPanelText' })
export class DxCardViewSearchPanelTextDirective<
    TCardData = unknown,
    TKey = unknown,
> extends DxSearchPanelTextDirectiveBase<DxCardViewComponent<TCardData, TKey>> {
    constructor() {
        super(injectDxHost<DxCardViewComponent>());
    }
}

/* ------------------------------------------------------------------------ *
 *  FileManager (4.0). Navigation, selection and focus are top-level options
 *  the widget writes through its setter on every gesture, and a path that
 *  does not resolve is corrected back through the same setter once the
 *  directory load fails (verified against 26.1.4) — so all three are plain
 *  option bindings and the correction arrives as an ordinary change.
 * ------------------------------------------------------------------------ */

/**
 * `[(dxCurrentPathKeys)]` for `dx-file-manager` — the current directory as
 * the key path from the root (`['Documents', 'Documents/Reports']` with the
 * default path keys). Writing it navigates; the widget resolves the path
 * asynchronously and, if it does not exist, rewrites the option to where it
 * actually is.
 */
@Directive({ selector: 'dx-file-manager[dxCurrentPathKeys]', exportAs: 'dxCurrentPathKeys' })
export class DxFileManagerCurrentPathKeysDirective extends DxBindingDirectiveBase {
    readonly dxCurrentPathKeys = model.required<readonly string[]>();

    constructor() {
        super();
        this.bindOption<DxFileManagerComponent, readonly string[]>(
            injectDxHost<DxFileManagerComponent>(),
            'currentPathKeys',
            this.dxCurrentPathKeys,
        );
    }
}

/** `[(dxSelectedItemKeys)]` for `dx-file-manager` — the selected items' keys (paths by default). */
@Directive({ selector: 'dx-file-manager[dxSelectedItemKeys]', exportAs: 'dxSelectedItemKeys' })
export class DxFileManagerSelectedItemKeysDirective extends DxSelectedItemKeysDirectiveBase<
    DxFileManagerComponent,
    string
> {
    constructor() {
        super(injectDxHost<DxFileManagerComponent>(), 'selectedItemKeys');
    }
}

/**
 * `[(dxFocusedItemKey)]` for `dx-file-manager` — the focused item's key,
 * `null` when none. The widget reports "no focus" as `undefined`, which the
 * adapter normalizes to `null` so the model has one spelling for it.
 */
@Directive({ selector: 'dx-file-manager[dxFocusedItemKey]', exportAs: 'dxFocusedItemKey' })
export class DxFileManagerFocusedItemKeyDirective extends DxBindingDirectiveBase {
    readonly dxFocusedItemKey = model.required<string | null>();

    constructor() {
        super();
        this.bindAdapter<DxFileManagerComponent, string | null>(
            injectDxHost<DxFileManagerComponent>(),
            this.dxFocusedItemKey,
            {
                ...dxOptionAdapter<DxFileManagerComponent, 'focusedItemKey', string | null>('focusedItemKey'),
                read: (instance) => instance.option('focusedItemKey') ?? null,
            },
        );
    }
}

/** All data-component adapter directives, for convenient bulk import. */
export const DX_DATA_DIRECTIVES = [
    DxCardViewFilterValueDirective,
    DxCardViewPageIndexDirective,
    DxCardViewPageSizeDirective,
    DxCardViewSearchPanelTextDirective,
    DxCardViewSelectedCardKeysDirective,
    DxDataGridEditRowKeyDirective,
    DxDataGridEditingChangesDirective,
    DxDataGridFilterValueDirective,
    DxDataGridFocusedRowIndexDirective,
    DxDataGridFocusedRowKeyDirective,
    DxDataGridPageIndexDirective,
    DxDataGridPageSizeDirective,
    DxDataGridSearchPanelTextDirective,
    DxDataGridSelectedRowKeysDirective,
    DxDataGridSelectionFilterDirective,
    DxDataGridStateDirective,
    DxFileManagerCurrentPathKeysDirective,
    DxFileManagerFocusedItemKeyDirective,
    DxFileManagerSelectedItemKeysDirective,
    DxFormDataDirective,
    DxGanttSelectedRowKeyDirective,
    DxSchedulerCurrentDateDirective,
    DxSchedulerCurrentViewDirective,
    DxTreeListEditRowKeyDirective,
    DxTreeListEditingChangesDirective,
    DxTreeListExpandedRowKeysDirective,
    DxTreeListFilterValueDirective,
    DxTreeListFocusedRowIndexDirective,
    DxTreeListFocusedRowKeyDirective,
    DxTreeListPageIndexDirective,
    DxTreeListPageSizeDirective,
    DxTreeListSearchPanelTextDirective,
    DxTreeListSelectedRowKeysDirective,
    DxTreeListStateDirective,
    DxTreeViewExpandedNodeKeysDirective,
    DxTreeViewSelectedNodeKeysDirective,
] as const;
