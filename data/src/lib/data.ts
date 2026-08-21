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
    type DxAdapterEventName,
    type DxBindingAdapter,
    type DxDateValue,
    type DxFilterExpression,
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
 * DevExtreme mutates the bound `formData` object in place while the user
 * edits, so the adapter listens to `fieldDataChanged` and emits a *shallow
 * copy* on every change — the signal therefore always yields a fresh
 * reference, which keeps `computed()` consumers and `OnPush`/zoneless views
 * reliably up to date.
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
            read: (instance) => ({ ...(instance.option('formData') as TFormData) }),
            write: (instance, value) => {
                (instance.option as (name: string, value: unknown) => void)('formData', value);
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
 *  Grid state beyond selection: focused row, filter, paging, layout state
 * ------------------------------------------------------------------------ */

/** `[(dxFocusedRowKey)]` for `dx-data-grid` (requires `focusedRowEnabled`); `null` clears the focus. */
@Directive({ selector: 'dx-data-grid[dxFocusedRowKey]', exportAs: 'dxFocusedRowKey' })
export class DxDataGridFocusedRowKeyDirective<
    TRowData = unknown,
    TKey = unknown,
> extends DxBindingDirectiveBase {
    readonly dxFocusedRowKey = model.required<TKey | null>();

    constructor() {
        super();
        this.bindOption<DxDataGridComponent<TRowData, TKey>, TKey | null>(
            inject(DxDataGridComponent, { self: true }),
            'focusedRowKey',
            this.dxFocusedRowKey,
        );
    }
}

/** `[(dxFocusedRowKey)]` for `dx-tree-list` (requires `focusedRowEnabled`); `null` clears the focus. */
@Directive({ selector: 'dx-tree-list[dxFocusedRowKey]', exportAs: 'dxFocusedRowKey' })
export class DxTreeListFocusedRowKeyDirective<
    TRowData = unknown,
    TKey = unknown,
> extends DxBindingDirectiveBase {
    readonly dxFocusedRowKey = model.required<TKey | null>();

    constructor() {
        super();
        this.bindOption<DxTreeListComponent<TRowData, TKey>, TKey | null>(
            inject(DxTreeListComponent, { self: true }),
            'focusedRowKey',
            this.dxFocusedRowKey,
        );
    }
}

/** `[(dxFilterValue)]` for `dx-data-grid`; `null` clears the filter. */
@Directive({ selector: 'dx-data-grid[dxFilterValue]', exportAs: 'dxFilterValue' })
export class DxDataGridFilterValueDirective<
    TRowData = unknown,
    TKey = unknown,
> extends DxBindingDirectiveBase {
    readonly dxFilterValue = model.required<DxFilterExpression | null>();

    constructor() {
        super();
        this.bindOption<DxDataGridComponent<TRowData, TKey>, DxFilterExpression | null>(
            inject(DxDataGridComponent, { self: true }),
            'filterValue',
            this.dxFilterValue,
        );
    }
}

/** `[(dxFilterValue)]` for `dx-tree-list`; `null` clears the filter. */
@Directive({ selector: 'dx-tree-list[dxFilterValue]', exportAs: 'dxFilterValue' })
export class DxTreeListFilterValueDirective<
    TRowData = unknown,
    TKey = unknown,
> extends DxBindingDirectiveBase {
    readonly dxFilterValue = model.required<DxFilterExpression | null>();

    constructor() {
        super();
        this.bindOption<DxTreeListComponent<TRowData, TKey>, DxFilterExpression | null>(
            inject(DxTreeListComponent, { self: true }),
            'filterValue',
            this.dxFilterValue,
        );
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
 * option-name typing deliberately does not cover — these adapters go through
 * the `pageIndex()` / `pageSize()` methods instead and listen for the nested
 * option change. They additionally re-read on `contentReady`: paging can
 * change beneath the `paging` option, without any `optionChanged`, when the
 * bound `DataSource` is manipulated directly (`dataSource.pageIndex(0)` +
 * reload — e.g. a `dxRemoteStore` dependency-driven page reset), and
 * `contentReady` is the event the grid fires after rendering any such change.
 */
function pageIndexAdapter<TInstance extends DxWidget & GridPagingLike>(): DxBindingAdapter<
    TInstance,
    number
> {
    return {
        // `optionChanged`/`contentReady` exist on every widget; the cast is
        // only needed because `TInstance` is an unresolved type parameter here.
        events: ['optionChanged', 'contentReady'] as unknown as readonly DxAdapterEventName<TInstance>[],
        read: (instance) => instance.pageIndex(),
        write: (instance, value) => void instance.pageIndex(value),
        accept: (eventName, eventArgs) =>
            (eventName as string) === 'contentReady' ||
            (eventArgs as DxOptionChangedArgs).name === 'paging',
    };
}

function pageSizeAdapter<TInstance extends DxWidget & GridPagingLike>(): DxBindingAdapter<
    TInstance,
    number
> {
    return {
        events: ['optionChanged', 'contentReady'] as unknown as readonly DxAdapterEventName<TInstance>[],
        read: (instance) => instance.pageSize(),
        write: (instance, value) => void instance.pageSize(value),
        accept: (eventName, eventArgs) =>
            (eventName as string) === 'contentReady' ||
            (eventArgs as DxOptionChangedArgs).name === 'paging',
    };
}

/** `[(dxPageIndex)]` for `dx-data-grid` (zero-based). */
@Directive({ selector: 'dx-data-grid[dxPageIndex]', exportAs: 'dxPageIndex' })
export class DxDataGridPageIndexDirective<
    TRowData = unknown,
    TKey = unknown,
> extends DxBindingDirectiveBase {
    readonly dxPageIndex = model.required<number>();

    constructor() {
        super();
        this.bindAdapter<DxDataGridComponent<TRowData, TKey>, number>(
            inject(DxDataGridComponent, { self: true }),
            this.dxPageIndex,
            pageIndexAdapter<DxInstanceOf<DxDataGridComponent<TRowData, TKey>>>(),
        );
    }
}

/** `[(dxPageIndex)]` for `dx-tree-list` (zero-based). */
@Directive({ selector: 'dx-tree-list[dxPageIndex]', exportAs: 'dxPageIndex' })
export class DxTreeListPageIndexDirective<
    TRowData = unknown,
    TKey = unknown,
> extends DxBindingDirectiveBase {
    readonly dxPageIndex = model.required<number>();

    constructor() {
        super();
        this.bindAdapter<DxTreeListComponent<TRowData, TKey>, number>(
            inject(DxTreeListComponent, { self: true }),
            this.dxPageIndex,
            pageIndexAdapter<DxInstanceOf<DxTreeListComponent<TRowData, TKey>>>(),
        );
    }
}

/** `[(dxPageSize)]` for `dx-data-grid`. */
@Directive({ selector: 'dx-data-grid[dxPageSize]', exportAs: 'dxPageSize' })
export class DxDataGridPageSizeDirective<
    TRowData = unknown,
    TKey = unknown,
> extends DxBindingDirectiveBase {
    readonly dxPageSize = model.required<number>();

    constructor() {
        super();
        this.bindAdapter<DxDataGridComponent<TRowData, TKey>, number>(
            inject(DxDataGridComponent, { self: true }),
            this.dxPageSize,
            pageSizeAdapter<DxInstanceOf<DxDataGridComponent<TRowData, TKey>>>(),
        );
    }
}

/** `[(dxPageSize)]` for `dx-tree-list`. */
@Directive({ selector: 'dx-tree-list[dxPageSize]', exportAs: 'dxPageSize' })
export class DxTreeListPageSizeDirective<
    TRowData = unknown,
    TKey = unknown,
> extends DxBindingDirectiveBase {
    readonly dxPageSize = model.required<number>();

    constructor() {
        super();
        this.bindAdapter<DxTreeListComponent<TRowData, TKey>, number>(
            inject(DxTreeListComponent, { self: true }),
            this.dxPageSize,
            pageSizeAdapter<DxInstanceOf<DxTreeListComponent<TRowData, TKey>>>(),
        );
    }
}

/**
 * A serialized grid layout state as produced by the `state()` method —
 * column order/width/sort, paging, selection, search text, ... The shape is
 * DevExtreme-internal but JSON-serializable by design (it is what
 * `stateStoring` persists).
 */
export type DxGridState = Record<string, unknown>;

function gridStateAdapter<TInstance extends DxWidget & GridStateLike>(): DxBindingAdapter<
    TInstance,
    DxGridState | null | undefined
> {
    return {
        // Any option change may affect the persisted state; structural
        // equality drops the reads that turn out not to.
        events: ['optionChanged'] as unknown as readonly DxAdapterEventName<TInstance>[],
        read: (instance) => instance.state() as DxGridState,
        write: (instance, value) => instance.state(value ?? null),
    };
}

/**
 * `[(dxGridState)]` — two-way binds the full layout state (`state()` /
 * `stateStoring`) of `dx-data-grid` to a signal, e.g. for persisting layouts:
 *
 *  - signal `undefined` ⇒ nothing is pushed; the widget's current state is
 *    pulled once ready (first run without a saved layout);
 *  - signal holding a saved {@link DxGridState} ⇒ the layout is restored;
 *  - signal set to `null` ⇒ the grid resets to its default layout.
 *
 * Widget → signal reads are debounced via `dxGridStateDebounce` (default
 * 100 ms) because user interactions can burst option changes.
 */
@Directive({ selector: 'dx-data-grid[dxGridState]', exportAs: 'dxGridState' })
export class DxDataGridStateDirective<
    TRowData = unknown,
    TKey = unknown,
> extends DxBindingDirectiveBase {
    readonly dxGridState = model.required<DxGridState | null | undefined>();
    readonly dxGridStateDebounce = input(100);

    constructor() {
        super();
        this.bindAdapter<DxDataGridComponent<TRowData, TKey>, DxGridState | null | undefined>(
            inject(DxDataGridComponent, { self: true }),
            this.dxGridState,
            gridStateAdapter<DxInstanceOf<DxDataGridComponent<TRowData, TKey>>>(),
            { debounceMs: () => this.dxGridStateDebounce() },
        );
    }
}

/** `[(dxGridState)]` for `dx-tree-list` — see {@link DxDataGridStateDirective}. */
@Directive({ selector: 'dx-tree-list[dxGridState]', exportAs: 'dxGridState' })
export class DxTreeListStateDirective<
    TRowData = unknown,
    TKey = unknown,
> extends DxBindingDirectiveBase {
    readonly dxGridState = model.required<DxGridState | null | undefined>();
    readonly dxGridStateDebounce = input(100);

    constructor() {
        super();
        this.bindAdapter<DxTreeListComponent<TRowData, TKey>, DxGridState | null | undefined>(
            inject(DxTreeListComponent, { self: true }),
            this.dxGridState,
            gridStateAdapter<DxInstanceOf<DxTreeListComponent<TRowData, TKey>>>(),
            { debounceMs: () => this.dxGridStateDebounce() },
        );
    }
}

/** All data-component adapter directives, for convenient bulk import. */
export const DX_DATA_DIRECTIVES = [
    DxDataGridFilterValueDirective,
    DxDataGridFocusedRowKeyDirective,
    DxDataGridPageIndexDirective,
    DxDataGridPageSizeDirective,
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
    DxTreeListSelectedRowKeysDirective,
    DxTreeListStateDirective,
    DxTreeViewSelectedNodeKeysDirective,
] as const;
