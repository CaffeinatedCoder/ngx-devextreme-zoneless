import { Directive, inject, model } from '@angular/core';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxFormComponent } from 'devextreme-angular/ui/form';
import { DxGanttComponent } from 'devextreme-angular/ui/gantt';
import { DxSchedulerComponent } from 'devextreme-angular/ui/scheduler';
import { DxTreeListComponent } from 'devextreme-angular/ui/tree-list';
import { DxTreeViewComponent } from 'devextreme-angular/ui/tree-view';
import type { DxBindingAdapter } from '../core/binding';
import type {
    DxHostOptionValue,
    DxInstanceOf,
    DxOptionChangedArgs,
} from '../core/types';
import {
    DxBindingDirectiveBase,
    DxSelectedRowKeysDirectiveBase,
} from './bases';
import type { DxDateValue } from './editors';

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

/** All data-component adapter directives, for convenient bulk import. */
export const DX_DATA_DIRECTIVES = [
    DxDataGridSelectedRowKeysDirective,
    DxFormDataDirective,
    DxGanttSelectedRowKeyDirective,
    DxSchedulerCurrentDateDirective,
    DxSchedulerCurrentViewDirective,
    DxTreeListSelectedRowKeysDirective,
    DxTreeViewSelectedNodeKeysDirective,
] as const;
