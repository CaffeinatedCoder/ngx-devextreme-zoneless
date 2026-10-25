/**
 * Example: a fully signal-driven dashboard on a zoneless Angular 22 app,
 * exercising editors, grid selection, chart selection, tabs, overlays and
 * the composition API. This file is compiled with strict template type
 * checking as part of `npm run typecheck:examples` and serves as living
 * documentation of the public API.
 */
import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { CurrencyPipe, JsonPipe } from '@angular/common';
import { DxButtonModule } from 'devextreme-angular/ui/button';
import { DxChartModule } from 'devextreme-angular/ui/chart';
import { DxCheckBoxModule } from 'devextreme-angular/ui/check-box';
import { DxDataGridComponent, DxDataGridModule } from 'devextreme-angular/ui/data-grid';
import { DxDateRangeBoxModule } from 'devextreme-angular/ui/date-range-box';
import { DxPopupModule } from 'devextreme-angular/ui/popup';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import { DxSliderModule } from 'devextreme-angular/ui/slider';
import { DxTabsModule } from 'devextreme-angular/ui/tabs';
import { DxTextBoxComponent, DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import {
    DX_SIGNAL_DIRECTIVES,
    dxEventSignal,
    dxOptionSignal,
    type DxChartSelectedPoint,
    type DxDateRange,
} from 'ngx-devextreme-zoneless';

interface Order {
    readonly id: number;
    readonly customer: string;
    readonly amount: number;
    readonly status: OrderStatus;
}

type OrderStatus = 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';

@Component({
    selector: 'app-order-dashboard',
    imports: [
        CurrencyPipe,
        JsonPipe,
        DxButtonModule,
        DxChartModule,
        DxCheckBoxModule,
        DxDataGridModule,
        DxDateRangeBoxModule,
        DxPopupModule,
        DxSelectBoxModule,
        DxSliderModule,
        DxTabsModule,
        DxTextBoxModule,
        DX_SIGNAL_DIRECTIVES,
    ],
    template: `
        <dx-tabs [(dxSelectedIndex)]="activeTab" [items]="tabs" />

        <div class="filters">
            <dx-text-box
                [(dxValue)]="searchTerm"
                [dxValueDebounce]="300"
                placeholder="Search orders..." />

            <dx-select-box
                [(dxValue)]="statusFilter"
                [items]="statuses"
                [showClearButton]="true"
                placeholder="Filter by status" />

            <dx-date-range-box [(dxValue)]="dateRange" />

            <dx-check-box [(dxValue)]="showCancelled" text="Include cancelled" />

            <dx-slider [(dxValue)]="minAmount" [min]="0" [max]="10000" [step]="100" />
            <span>Min amount: {{ minAmount() | currency }}</span>
        </div>

        <div class="summary">
            <p>Active filters: {{ activeFilterCount() }}</p>
            <p>Matching orders: {{ filteredOrders().length }}</p>
        </div>

        <dx-data-grid
            [(dxSelectedRowKeys)]="selectedOrderIds"
            [dataSource]="filteredOrders()"
            keyExpr="id">
            <dxo-data-grid-selection mode="multiple" />
            <dxi-data-grid-column dataField="id" />
            <dxi-data-grid-column dataField="customer" />
            <dxi-data-grid-column dataField="amount" format="currency" />
            <dxi-data-grid-column dataField="status" />
        </dx-data-grid>

        <p>Selected: {{ selectedOrderIds() | json }}</p>

        <dx-chart
            pointSelectionMode="multiple"
            [(dxSelectedPoints)]="chartSelection"
            [dataSource]="chartData">
            <dxi-chart-series valueField="amount" argumentField="month" />
        </dx-chart>

        <p>Chart selection: {{ chartSelection() | json }}</p>

        <dx-button text="Show details" (onClick)="detailsVisible.set(true)" />
        <dx-popup [(dxVisible)]="detailsVisible" title="Details" [width]="400" [height]="300">
            <p>{{ selectedOrderIds().length }} orders selected.</p>
        </dx-popup>
    `,
})
export class OrderDashboardComponent {
    // --- state: plain signals, two-way bound into DevExtreme -----------------
    readonly activeTab = signal(0);
    readonly searchTerm = signal('');
    readonly statusFilter = signal<OrderStatus | null>(null);
    readonly dateRange = signal<DxDateRange>([null, null]);
    readonly showCancelled = signal<boolean | null>(false);
    readonly minAmount = signal(0);
    readonly selectedOrderIds = signal<readonly number[]>([]);
    readonly chartSelection = signal<readonly DxChartSelectedPoint[]>([]);
    readonly detailsVisible = signal(false);

    readonly tabs = ['All Orders', 'Analytics', 'Settings'];
    readonly statuses: OrderStatus[] = ['Pending', 'Shipped', 'Delivered', 'Cancelled'];

    readonly orders: readonly Order[] = [
        { id: 1, customer: 'Acme Corp', amount: 5200, status: 'Shipped' },
        { id: 2, customer: 'Globex', amount: 3100, status: 'Pending' },
        { id: 3, customer: 'Initech', amount: 890, status: 'Cancelled' },
    ];

    readonly chartData = [
        { month: 'Jan', amount: 12000 },
        { month: 'Feb', amount: 15000 },
        { month: 'Mar', amount: 11000 },
    ];

    // --- composition API: bind additional widget state without a directive ---
    private readonly grid = viewChild(DxDataGridComponent<Order, number>);
    /** Two-way bound to the grid's `filterValue` option, typed from DevExtreme. */
    readonly gridFilter = dxOptionSignal(this.grid, 'filterValue');

    private readonly searchBox = viewChild(DxTextBoxComponent);
    /** Latest focusOut event of the search box (undefined until it fires). */
    readonly searchBlurred = dxEventSignal(this.searchBox, 'focusOut');

    // --- derived state: fully reactive, zero boilerplate ---------------------
    readonly activeFilterCount = computed(() => {
        let count = 0;
        if (this.searchTerm()) count++;
        if (this.statusFilter() !== null) count++;
        if (this.dateRange().some((edge) => edge !== null)) count++;
        if (this.showCancelled()) count++;
        if (this.minAmount() > 0) count++;
        return count;
    });

    readonly filteredOrders = computed(() =>
        this.orders.filter((order) => {
            const term = this.searchTerm().toLowerCase();
            if (term && !order.customer.toLowerCase().includes(term)) return false;
            if (this.statusFilter() !== null && order.status !== this.statusFilter()) return false;
            if (!this.showCancelled() && order.status === 'Cancelled') return false;
            return order.amount >= this.minAmount();
        }),
    );
}
