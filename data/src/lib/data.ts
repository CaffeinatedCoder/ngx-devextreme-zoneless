import { Directive, inject, input, model } from '@angular/core';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxFormComponent } from 'devextreme-angular/ui/form';
import { DxGanttComponent } from 'devextreme-angular/ui/gantt';
import { DxSchedulerComponent } from 'devextreme-angular/ui/scheduler';
import { DxTreeListComponent } from 'devextreme-angular/ui/tree-list';
import { DxTreeViewComponent } from 'devextreme-angular/ui/tree-view';
import {
    DxBindingDirectiveBase,
    DxSelectedRowKeysDirectiveBase,
    dxStructuralClone,
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
        super(inject(DxDataGridComponent, { self: true }), 'selectedRowKeys');
    }
}

/** `[(dxSelectedRowKeys)]` for `dx-tree-list`. */
@Directive({ selector: 'dx-tree-list[dxSelectedRowKeys]', exportAs: 'dxSelectedRowKeys' })
export class DxTreeListSelectedRowKeysDirective<
    TRowData = unknown,
    TKey = unknown,
> extends DxSelectedRowKeysDirectiveBase<DxTreeListComponent<TRowData, TKey>, TKey> {
    constructor() {
        super(inject(DxTreeListComponent, { self: true }), 'selectedRowKeys');
    }
}

/** `[(dxSelectedRowKey)]` for `dx-gantt` (single selection; `null` clears it). */
@Directive({ selector: 'dx-gantt[dxSelectedRowKey]', exportAs: 'dxSelectedRowKey' })
export class DxGanttSelectedRowKeyDirective<TKey = unknown> extends DxBindingDirectiveBase {
    readonly dxSelectedRowKey = model.required<TKey | null>();

    constructor() {
        super();
        this.bindOption<DxGanttComponent, TKey | null>(
            inject(DxGanttComponent, { self: true }),
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
            inject(DxSchedulerComponent, { self: true }),
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
            inject(DxSchedulerComponent, { self: true }),
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
        this.bindAdapter(inject(DxFormComponent, { self: true }), this.dxFormData, adapter);
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
            inject(DxTreeViewComponent, { self: true }),
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
        super(inject(DxDataGridComponent, { self: true }), 'focusedRowKey');
    }
}

/** `[(dxFocusedRowKey)]` for `dx-tree-list` (requires `focusedRowEnabled`). */
@Directive({ selector: 'dx-tree-list[dxFocusedRowKey]', exportAs: 'dxFocusedRowKey' })
export class DxTreeListFocusedRowKeyDirective<
    TRowData = unknown,
    TKey = unknown,
> extends DxFocusedRowKeyDirectiveBase<DxTreeListComponent<TRowData, TKey>, TKey> {
    constructor() {
        super(inject(DxTreeListComponent, { self: true }), 'focusedRowKey');
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
        super(inject(DxDataGridComponent, { self: true }), 'filterValue');
    }
}

/** `[(dxFilterValue)]` for `dx-tree-list`. */
@Directive({ selector: 'dx-tree-list[dxFilterValue]', exportAs: 'dxFilterValue' })
export class DxTreeListFilterValueDirective<
    TRowData = unknown,
    TKey = unknown,
> extends DxFilterValueDirectiveBase<DxTreeListComponent<TRowData, TKey>> {
    constructor() {
        super(inject(DxTreeListComponent, { self: true }), 'filterValue');
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
    return {
        // `optionChanged`/`contentReady` exist on every widget; the cast is
        // only needed because the structural instance type carries no
        // `Properties` bag to derive them from.
        events: ['optionChanged', 'contentReady'] as unknown as readonly DxAdapterEventName<
            DxWidget & GridPagingLike
        >[],
        read: (instance) => instance[method](),
        write: (instance, value) => void instance[method](value),
        accept: (eventName, eventArgs) =>
            (eventName as string) === 'contentReady' ||
            (eventArgs as DxOptionChangedArgs).name === 'paging',
    };
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
        super(inject(DxDataGridComponent, { self: true }));
    }
}

/** `[(dxPageIndex)]` for `dx-tree-list` (zero-based). */
@Directive({ selector: 'dx-tree-list[dxPageIndex]', exportAs: 'dxPageIndex' })
export class DxTreeListPageIndexDirective<
    TRowData = unknown,
    TKey = unknown,
> extends DxPageIndexDirectiveBase<DxTreeListComponent<TRowData, TKey>> {
    constructor() {
        super(inject(DxTreeListComponent, { self: true }));
    }
}

/** `[(dxPageSize)]` for `dx-data-grid`. */
@Directive({ selector: 'dx-data-grid[dxPageSize]', exportAs: 'dxPageSize' })
export class DxDataGridPageSizeDirective<
    TRowData = unknown,
    TKey = unknown,
> extends DxPageSizeDirectiveBase<DxDataGridComponent<TRowData, TKey>> {
    constructor() {
        super(inject(DxDataGridComponent, { self: true }));
    }
}

/** `[(dxPageSize)]` for `dx-tree-list`. */
@Directive({ selector: 'dx-tree-list[dxPageSize]', exportAs: 'dxPageSize' })
export class DxTreeListPageSizeDirective<
    TRowData = unknown,
    TKey = unknown,
> extends DxPageSizeDirectiveBase<DxTreeListComponent<TRowData, TKey>> {
    constructor() {
        super(inject(DxTreeListComponent, { self: true }));
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
 * nested option back, listening for the `searchPanel` option change. Like the
 * paging adapters it also re-reads on `contentReady`, because the search text
 * is part of the layout state: a `[(dxGridState)]` restore applies it through
 * the state machinery rather than through a `searchPanel` `optionChanged`.
 *
 * A widget with no search text reports `undefined`; the binding normalizes
 * that to `''` so the model type stays a plain `string` and "cleared" has one
 * representation instead of two.
 */
function searchPanelTextAdapter(): DxBindingAdapter<DxWidget & GridSearchLike, string> {
    return {
        events: ['optionChanged', 'contentReady'] as unknown as readonly DxAdapterEventName<
            DxWidget & GridSearchLike
        >[],
        read: (instance) =>
            ((instance.option as (name: string) => unknown)('searchPanel.text') as
                | string
                | undefined) ?? '',
        write: (instance, value) => instance.searchByText(value),
        accept: (eventName, eventArgs) =>
            (eventName as string) === 'contentReady' ||
            (eventArgs as DxOptionChangedArgs).name === 'searchPanel',
    };
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
        super(inject(DxDataGridComponent, { self: true }));
    }
}

/** `[(dxSearchPanelText)]` for `dx-tree-list` — see {@link DxSearchPanelTextDirectiveBase}. */
@Directive({ selector: 'dx-tree-list[dxSearchPanelText]', exportAs: 'dxSearchPanelText' })
export class DxTreeListSearchPanelTextDirective<
    TRowData = unknown,
    TKey = unknown,
> extends DxSearchPanelTextDirectiveBase<DxTreeListComponent<TRowData, TKey>> {
    constructor() {
        super(inject(DxTreeListComponent, { self: true }));
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
    return {
        // Any option change may affect the persisted state; structural
        // equality drops the reads that turn out not to. `contentReady` is
        // listened to as well because a grid only *has* a layout state once
        // it has rendered: at `initialized` time — when this binding attaches
        // — `state()` still reports `{}`, and without a post-layout re-read
        // the signal would keep that empty snapshot forever.
        events: ['optionChanged', 'contentReady'] as unknown as readonly DxAdapterEventName<
            DxWidget & GridStateLike
        >[],
        read: (instance) => instance.state() as DxGridState,
        write: (instance, value) => {
            // The empty snapshot above must never travel back into the
            // widget: `state({})` wipes the very layout the binding exists to
            // restore. Only a real state or an explicit `null` (reset) is
            // written.
            if (value !== null && value !== undefined && Object.keys(value).length === 0) {
                return;
            }
            instance.state(value ?? null);
        },
    };
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
        super(inject(DxDataGridComponent, { self: true }));
    }
}

/** `[(dxGridState)]` for `dx-tree-list` — see {@link DxGridStateDirectiveBase}. */
@Directive({ selector: 'dx-tree-list[dxGridState]', exportAs: 'dxGridState' })
export class DxTreeListStateDirective<
    TRowData = unknown,
    TKey = unknown,
> extends DxGridStateDirectiveBase<DxTreeListComponent<TRowData, TKey>> {
    constructor() {
        super(inject(DxTreeListComponent, { self: true }));
    }
}

/** All data-component adapter directives, for convenient bulk import. */
export const DX_DATA_DIRECTIVES = [
    DxDataGridFilterValueDirective,
    DxDataGridFocusedRowKeyDirective,
    DxDataGridPageIndexDirective,
    DxDataGridPageSizeDirective,
    DxDataGridSearchPanelTextDirective,
    DxDataGridSelectedRowKeysDirective,
    DxDataGridStateDirective,
    DxFormDataDirective,
    DxGanttSelectedRowKeyDirective,
    DxSchedulerCurrentDateDirective,
    DxSchedulerCurrentViewDirective,
    DxTreeListFilterValueDirective,
    DxTreeListFocusedRowKeyDirective,
    DxTreeListPageIndexDirective,
    DxTreeListPageSizeDirective,
    DxTreeListSearchPanelTextDirective,
    DxTreeListSelectedRowKeysDirective,
    DxTreeListStateDirective,
    DxTreeViewSelectedNodeKeysDirective,
] as const;
