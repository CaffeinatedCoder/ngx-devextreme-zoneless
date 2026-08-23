import { Component, computed, signal, untracked } from '@angular/core';
import { DxDataGridModule } from 'devextreme-angular/ui/data-grid';
import { DxTreeListModule } from 'devextreme-angular/ui/tree-list';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import {
    DX_SIGNAL_DIRECTIVES,
    dxLoadOptionsParams,
    dxRemoteStore,
    type DxFilterExpression,
} from 'ngx-devextreme-zoneless';
import type { LoadOptions, LoadResult } from 'devextreme/common/data';

/*
 * Reference consumer for the remote-data API, served at `/remote` and driven
 * by e2e/remote.spec.ts against the loadOptions stub (e2e/stub-server.mjs,
 * proxied under /api). These screens are deliberately the hard cases the API
 * must make trivial: external filter signals over a remote grid, dependent
 * master-detail, a lookup that forces `byKey`, and widget re-creation over a
 * surviving DataSource. The README's remote-data section is written from
 * this file — if it stops compiling, the docs are wrong.
 */

interface Order {
    readonly id: number;
    readonly customerId: number;
    readonly customer: string;
    readonly status: string;
    readonly amount: number;
}

interface TreeNode {
    readonly id: number;
    readonly parentId: number;
    readonly name: string;
    readonly kind: string;
    readonly hasItems: boolean;
}

interface Customer {
    readonly id: number;
    readonly name: string;
}

/** Minimal fetch wrapper a real consumer would own (auth headers etc. go here). */
async function fetchJson<T>(url: string, signal: AbortSignal | undefined): Promise<T> {
    const response = await fetch(url, { signal });
    if (!response.ok) {
        const body: { message?: string } | undefined = await response.json().catch(() => undefined);
        throw new Error(body?.message ?? `${response.status} ${response.statusText}`);
    }
    return response.json() as Promise<T>;
}

/** ANDs the widget-produced filter with external filter clauses. */
function combineFilters(
    ...filters: readonly (DxFilterExpression | undefined)[]
): DxFilterExpression | undefined {
    const present = filters.filter((filter) => filter !== undefined);
    if (present.length === 0) {
        return undefined;
    }
    return present.length === 1
        ? present[0]
        : present.flatMap((filter, index) => (index === 0 ? [filter] : ['and', filter]));
}

@Component({
    selector: 'app-remote',
    imports: [DxDataGridModule, DxSelectBoxModule, DxTreeListModule, DX_SIGNAL_DIRECTIVES],
    template: `
        <h3>Remote grid (dxRemoteStore + external filter signals)</h3>
        <div class="row">
            <input
                data-testid="orders-search"
                placeholder="search customer"
                (input)="search.set($any($event.target).value)" />
            <select data-testid="orders-status" (change)="status.set($any($event.target).value || null)">
                <option value="">all statuses</option>
                <option>Pending</option>
                <option>Shipped</option>
                <option>Delivered</option>
            </select>
            <span class="readout" data-testid="orders-loading">{{ orders.isLoading() ? 'loading' : 'idle' }}</span>
            <span class="readout" data-testid="orders-error">{{ ordersError() }}</span>
            <button data-testid="orders-reload" (click)="orders.reload()">reload</button>
            <button data-testid="orders-break" (click)="breakLoader.set(true)">break loader</button>
            <button data-testid="orders-ignore-abort" (click)="ignoreAbort.set(true)">ignore abort</button>
            <span class="readout" data-testid="orders-page">{{ ordersPage() }}</span>
        </div>
        @if (showOrdersGrid()) {
            <dx-data-grid
                id="grid-remote-orders"
                [dataSource]="orders.dataSource"
                [remoteOperations]="true"
                [(dxPageIndex)]="ordersPage"
                style="max-width: 640px">
                <dxo-paging [pageSize]="10" />
                <dxo-pager [visible]="true" [showInfo]="true" />
                <dxi-column dataField="id" [width]="70" />
                <dxi-column dataField="customer" />
                <dxi-column dataField="status" />
                <dxi-column dataField="amount" />
            </dx-data-grid>
        }
        <div class="row">
            <button data-testid="orders-toggle" (click)="showOrdersGrid.set(!showOrdersGrid())">
                toggle orders grid
            </button>
        </div>

        <h3>Master–detail (selection signal drives the detail query)</h3>
        <div class="masters">
            <dx-data-grid
                id="grid-customers"
                [dataSource]="customers.dataSource"
                [remoteOperations]="true"
                [(dxSelectedRowKeys)]="selectedCustomerIds"
                style="max-width: 300px">
                <dxo-selection mode="single" />
                <dxo-paging [pageSize]="6" />
                <dxo-pager [visible]="true" />
                <dxi-column dataField="id" [width]="70" />
                <dxi-column dataField="name" />
            </dx-data-grid>
            <dx-data-grid
                id="grid-detail-orders"
                [dataSource]="detailOrders.dataSource"
                [remoteOperations]="true"
                style="max-width: 480px">
                <dxo-paging [pageSize]="6" />
                <dxo-pager [visible]="true" />
                <dxi-column dataField="id" [width]="70" />
                <dxi-column dataField="status" />
                <dxi-column dataField="amount" />
            </dx-data-grid>
        </div>
        <p>
            <span class="readout" data-testid="detail-customer">{{ selectedCustomerId() ?? 'none' }}</span>
        </p>

        <h3>Grouped + summarized grid (remote grouping half)</h3>
        <dx-data-grid
            id="grid-grouped"
            [dataSource]="groupedOrders.dataSource"
            [remoteOperations]="true"
            style="max-width:560px">
            <dxo-group-panel [visible]="false" />
            <dxo-paging [pageSize]="5" />
            <dxi-column dataField="status" [groupIndex]="0" />
            <dxi-column dataField="id" [width]="70" />
            <dxi-column dataField="amount" />
            <dxo-summary>
                <dxi-total-item column="amount" summaryType="sum" />
                <dxi-group-item column="amount" summaryType="sum" [showInGroupFooter]="false" />
            </dxo-summary>
        </dx-data-grid>

        <h3>TreeList with remote hierarchy (parentIds)</h3>
        <dx-tree-list
            id="tree-nodes"
            [dataSource]="nodes.dataSource"
            [remoteOperations]="{ filtering: true }"
            keyExpr="id"
            parentIdExpr="parentId"
            hasItemsExpr="hasItems"
            [showBorders]="true"
            style="max-width:420px">
            <dxi-column dataField="name" />
            <dxi-column dataField="kind" />
        </dx-tree-list>

        <h3>Lookup editor (debounced search + byKey)</h3>
        <div class="row">
            <dx-select-box
                id="lookup-customer"
                [dataSource]="customerLookup.dataSource"
                valueExpr="id"
                displayExpr="name"
                [searchEnabled]="true"
                [(dxValue)]="lookupId"
                placeholder="pick a customer"
                style="width: 260px" />
            <span class="readout" data-testid="lookup-readout">{{ lookupId() ?? 'null' }}</span>
            <button data-testid="lookup-set" (click)="lookupId.set(9)">set customer 9</button>
            <button data-testid="lookup-reload" (click)="customerLookup.reload()">reload lookup</button>
        </div>
    `,
    styles: `
        .masters { display: flex; gap: 24px; align-items: flex-start; }
    `,
})
export class RemoteComponent {
    // --- screen (a): remote grid with external filter signals ---------------
    readonly search = signal('');
    readonly status = signal<string | null>(null);
    readonly ordersPage = signal(0);
    readonly showOrdersGrid = signal(true);
    readonly breakLoader = signal(false);
    /** Probe switch: a loader that never forwards its AbortSignal to fetch. */
    readonly ignoreAbort = signal(false);

    readonly orders = dxRemoteStore<Order, number>({
        key: 'id',
        deps: [this.search, this.status],
        debounce: 300,
        load: (options, signal) => {
            if (untracked(this.breakLoader)) {
                throw new Error('sync loader failure');
            }
            return this.loadOrders(options, signal);
        },
    });

    readonly ordersError = computed(() => {
        const error = this.orders.error();
        return error === undefined ? '' : error instanceof Error ? error.message : String(error);
    });

    // --- screen (b): master-detail ------------------------------------------
    readonly customers = dxRemoteStore<Customer, number>({
        key: 'id',
        load: async (options, signal) =>
            fetchJson<LoadResult<Customer>>(`/api/customers?${dxLoadOptionsParams(options)}`, signal),
    });

    readonly selectedCustomerIds = signal<readonly number[]>([]);
    readonly selectedCustomerId = computed(() => this.selectedCustomerIds()[0]);

    readonly detailOrders = dxRemoteStore<Order, number>({
        key: 'id',
        deps: [this.selectedCustomerId],
        load: async (options, signal) => {
            const customerId = untracked(this.selectedCustomerId);
            if (customerId === undefined) {
                return { data: [], totalCount: 0 };
            }
            const filter = combineFilters(
                options.filter as DxFilterExpression | undefined,
                ['customerId', '=', customerId],
            );
            const params = dxLoadOptionsParams({ ...options, filter });
            return fetchJson<LoadResult<Order>>(`/api/orders?${params}`, signal);
        },
    });

    // --- screen (d): remote grouping, summaries ------------------------------
    readonly groupedOrders = dxRemoteStore<Order, number>({
        key: 'id',
        load: async (options, signal) =>
            fetchJson<LoadResult<Order>>(
                `/api/grouped-orders?${dxLoadOptionsParams(options)}`,
                signal,
            ),
    });

    // --- screen (e): remote hierarchy through `parentIds` --------------------
    readonly nodes = dxRemoteStore<TreeNode, number>({
        key: 'id',
        load: async (options, signal) =>
            fetchJson<LoadResult<TreeNode>>(`/api/nodes?${dxLoadOptionsParams(options)}`, signal),
    });

    // --- screen (c): lookup with byKey --------------------------------------
    readonly lookupId = signal<number | null>(null);

    readonly customerLookup = dxRemoteStore<Customer, number>({
        key: 'id',
        load: async (options, signal) =>
            fetchJson<LoadResult<Customer>>(`/api/customers?${dxLoadOptionsParams(options)}`, signal),
        byKey: async (key, signal) => {
            const params = dxLoadOptionsParams({ filter: ['id', '=', key], take: 1 });
            const result = await fetchJson<{ data: Customer[] }>(`/api/customers?${params}`, signal);
            const item = result.data[0];
            if (item === undefined) {
                throw new Error(`customer ${key} not found`);
            }
            return item;
        },
    });

    private async loadOrders(
        options: LoadOptions<Order>,
        signal: AbortSignal,
    ): Promise<LoadResult<Order>> {
        const searchText = untracked(this.search).trim();
        const statusValue = untracked(this.status);
        const filter = combineFilters(
            options.filter as DxFilterExpression | undefined,
            searchText === '' ? undefined : ['customer', 'contains', searchText],
            statusValue === null ? undefined : ['status', '=', statusValue],
        );
        const params = dxLoadOptionsParams({ ...options, filter });
        return fetchJson<LoadResult<Order>>(
            `/api/orders?${params}`,
            untracked(this.ignoreAbort) ? undefined : signal,
        );
    }
}
