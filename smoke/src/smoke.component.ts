import { Component, effect, signal, viewChild } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { DxChartModule } from 'devextreme-angular/ui/chart';
import { DxCheckBoxModule } from 'devextreme-angular/ui/check-box';
import { DxDataGridModule } from 'devextreme-angular/ui/data-grid';
import { DxPopupModule } from 'devextreme-angular/ui/popup';
import { DxSelectBoxComponent, DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import { DxSliderModule } from 'devextreme-angular/ui/slider';
import { DxTabsModule } from 'devextreme-angular/ui/tabs';
import { DxTextBoxComponent, DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import {
    DX_SIGNAL_DIRECTIVES,
    dxEventSignal,
    dxOptionSignal,
    type DxChartSelectedPoint,
} from 'ngx-devextreme-zoneless';

type Status = 'Pending' | 'Shipped' | 'Delivered';

@Component({
    selector: 'app-smoke',
    imports: [
        JsonPipe,
        DxChartModule,
        DxCheckBoxModule,
        DxDataGridModule,
        DxPopupModule,
        DxSelectBoxModule,
        DxSliderModule,
        DxTabsModule,
        DxTextBoxModule,
        DX_SIGNAL_DIRECTIVES,
    ],
    template: `
        <h3>Editors</h3>
        <div class="row">
            <dx-text-box
                [(dxValue)]="text"
                valueChangeEvent="input"
                placeholder="type here" />
            <span class="readout" data-testid="text-readout">{{ text() }}</span>
            <button data-testid="text-set" (click)="text.set('set-from-signal')">set signal</button>
        </div>
        <div class="row">
            <dx-select-box [(dxValue)]="status" [items]="statuses" [showClearButton]="true" />
            <span class="readout" data-testid="status-readout">{{ status() ?? 'null' }}</span>
            <button data-testid="status-set" (click)="status.set('Delivered')">set signal</button>
            <span class="readout" data-testid="selectbox-opened-readout">{{ selectBoxOpened() ?? false }}</span>
        </div>
        <div class="row">
            <dx-check-box [(dxValue)]="checked" text="check me" />
            <span class="readout" data-testid="check-readout">{{ checked() }}</span>
            <dx-slider [(dxValue)]="amount" [min]="0" [max]="100" [step]="1" style="width:200px" />
            <span class="readout" data-testid="amount-readout">{{ amount() }}</span>
            <button data-testid="amount-set" (click)="amount.set(75)">set 75</button>
        </div>

        <h3>Navigation</h3>
        <div class="row">
            <dx-tabs [(dxSelectedIndex)]="tab" [items]="tabs" style="width:320px" />
            <span class="readout" data-testid="tab-readout">{{ tab() }}</span>
            <button data-testid="tab-set" (click)="tab.set(2)">go tab 2</button>
        </div>

        <h3>Grid selection</h3>
        <dx-data-grid
            [(dxSelectedRowKeys)]="selectedIds"
            [dataSource]="orders"
            keyExpr="id"
            style="max-width:480px">
            <dxo-selection mode="multiple" />
            <dxi-column dataField="id" />
            <dxi-column dataField="customer" />
        </dx-data-grid>
        <p>
            <span class="readout" data-testid="grid-readout">{{ selectedIds() | json }}</span>
            <button data-testid="grid-set" (click)="selectedIds.set([1, 3])">select 1 &amp; 3</button>
        </p>

        <h3>Popup</h3>
        <div class="row">
            <button data-testid="popup-open" (click)="popupVisible.set(true)">open popup</button>
            <span class="readout" data-testid="popup-readout">{{ popupVisible() }}</span>
        </div>
        <dx-popup
            [(dxVisible)]="popupVisible"
            title="Smoke popup"
            [showCloseButton]="true"
            [width]="320"
            [height]="180">
            <p data-testid="popup-content">popup is open</p>
        </dx-popup>

        <h3>Chart selection</h3>
        <dx-chart
            pointSelectionMode="multiple"
            [(dxSelectedPoints)]="points"
            [dataSource]="chartData"
            style="height:220px; max-width:480px">
            <dxi-series valueField="amount" argumentField="month" type="bar" />
        </dx-chart>
        <p>
            <span class="readout" data-testid="chart-readout">{{ points() | json }}</span>
            <button data-testid="chart-set" (click)="points.set([{ argument: 'Feb', value: 15, seriesName: undefined }])">
                select Feb
            </button>
        </p>

        <h3>Composition API</h3>
        <div class="row">
            <span class="readout" data-testid="focus-count-readout">focusIn events: {{ focusInCount() }}</span>
            <button data-testid="placeholder-set" (click)="textPlaceholder.set('via option signal')">
                set placeholder via dxOptionSignal
            </button>
            <span class="readout" data-testid="placeholder-readout">{{ textPlaceholder() ?? '' }}</span>
        </div>
    `,
})
export class SmokeComponent {
    readonly text = signal('');
    readonly status = signal<Status | null>(null);
    readonly checked = signal<boolean | null>(false);
    readonly amount = signal(25);
    readonly tab = signal(0);
    readonly selectedIds = signal<readonly number[]>([]);
    readonly popupVisible = signal(false);
    readonly points = signal<readonly DxChartSelectedPoint[]>([]);

    readonly statuses: Status[] = ['Pending', 'Shipped', 'Delivered'];
    readonly tabs = ['One', 'Two', 'Three'];
    readonly orders = [
        { id: 1, customer: 'Acme' },
        { id: 2, customer: 'Globex' },
        { id: 3, customer: 'Initech' },
    ];
    readonly chartData = [
        { month: 'Jan', amount: 12 },
        { month: 'Feb', amount: 15 },
        { month: 'Mar', amount: 11 },
    ];

    // Composition API — two-way option signal and event signal on view children.
    private readonly textBox = viewChild(DxTextBoxComponent);
    private readonly selectBox = viewChild(DxSelectBoxComponent);
    readonly textPlaceholder = dxOptionSignal(this.textBox, 'placeholder');
    readonly selectBoxOpened = dxOptionSignal(this.selectBox, 'opened');
    private readonly focusIn = dxEventSignal(this.textBox, 'focusIn');
    readonly focusInCount = signal(0);

    constructor() {
        // Count focusIn events — demonstrates deriving state from dxEventSignal.
        effect(() => {
            if (this.focusIn() !== undefined) {
                this.focusInCount.update((count) => count + 1);
            }
        });
    }
}
