import { Component, computed, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { DxAccordionModule } from 'devextreme-angular/ui/accordion';
import { DxActionSheetModule } from 'devextreme-angular/ui/action-sheet';
import { DxAutocompleteModule } from 'devextreme-angular/ui/autocomplete';
import { DxButtonGroupModule } from 'devextreme-angular/ui/button-group';
import { DxCardViewModule } from 'devextreme-angular/ui/card-view';
import { DxChartModule } from 'devextreme-angular/ui/chart';
import { DxChatModule } from 'devextreme-angular/ui/chat';
import { DxContextMenuModule } from 'devextreme-angular/ui/context-menu';
import { DxDataGridModule } from 'devextreme-angular/ui/data-grid';
import { DxDateBoxModule } from 'devextreme-angular/ui/date-box';
import { DxDropDownButtonModule } from 'devextreme-angular/ui/drop-down-button';
import { DxCalendarModule } from 'devextreme-angular/ui/calendar';
import { DxColorBoxModule } from 'devextreme-angular/ui/color-box';
import { DxDateRangeBoxModule } from 'devextreme-angular/ui/date-range-box';
import { DxDrawerModule } from 'devextreme-angular/ui/drawer';
import { DxDropDownBoxModule } from 'devextreme-angular/ui/drop-down-box';
import { DxFileManagerModule } from 'devextreme-angular/ui/file-manager';
import { DxFileUploaderModule } from 'devextreme-angular/ui/file-uploader';
import { DxFilterBuilderModule } from 'devextreme-angular/ui/filter-builder';
import { DxGalleryModule } from 'devextreme-angular/ui/gallery';
import { DxGanttModule } from 'devextreme-angular/ui/gantt';
import { DxHtmlEditorModule } from 'devextreme-angular/ui/html-editor';
import { DxListModule } from 'devextreme-angular/ui/list';
import { DxLoadPanelModule } from 'devextreme-angular/ui/load-panel';
import { DxLookupModule } from 'devextreme-angular/ui/lookup';
import { DxMultiViewModule } from 'devextreme-angular/ui/multi-view';
import { DxPaginationModule } from 'devextreme-angular/ui/pagination';
import { DxPieChartModule } from 'devextreme-angular/ui/pie-chart';
import { DxPolarChartModule } from 'devextreme-angular/ui/polar-chart';
import { DxPopoverModule } from 'devextreme-angular/ui/popover';
import { DxRadioGroupModule } from 'devextreme-angular/ui/radio-group';
import { DxRangeSelectorModule } from 'devextreme-angular/ui/range-selector';
import { DxRangeSliderModule } from 'devextreme-angular/ui/range-slider';
import { DxResizableModule } from 'devextreme-angular/ui/resizable';
import { DxSchedulerModule } from 'devextreme-angular/ui/scheduler';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import { DxSplitterModule } from 'devextreme-angular/ui/splitter';
import { DxStepperModule } from 'devextreme-angular/ui/stepper';
import { DxSwitchModule } from 'devextreme-angular/ui/switch';
import { DxTabsModule } from 'devextreme-angular/ui/tabs';
import { DxTagBoxModule } from 'devextreme-angular/ui/tag-box';
import { DxTabPanelModule } from 'devextreme-angular/ui/tab-panel';
import { DxTextAreaModule } from 'devextreme-angular/ui/text-area';
import { DxTreeListModule } from 'devextreme-angular/ui/tree-list';
import { DxTreeViewModule } from 'devextreme-angular/ui/tree-view';
import { DxToastModule } from 'devextreme-angular/ui/toast';
import { DxTooltipModule } from 'devextreme-angular/ui/tooltip';
import {
    DX_SIGNAL_DIRECTIVES,
    type DxCalendarZoomLevel,
    type DxChartSelectedPoint,
    type DxChartValueAxisVisualRange,
    type DxChartVisualRange,
    type DxDataChange,
    type DxDateRange,
    type DxDateValue,
    type DxFilterExpression,
    type DxNumberRange,
    type DxRangeSelectorValue,
    type DxResizableSize,
    type DxSchedulerView,
} from 'ngx-devextreme-zoneless';

type Status = 'Pending' | 'Shipped' | 'Delivered';

/** Local calendar date, so the readout does not shift with the time zone. */
function showDate(value: DxDateValue | readonly DxDateValue[] | null | undefined): string {
    if (value === null || value === undefined) {
        return 'null';
    }
    if (Array.isArray(value)) {
        return value.map((entry) => showDate(entry as DxDateValue)).join(',');
    }
    const date = value instanceof Date ? value : new Date(value as DxDateValue);
    const pad = (n: number): string => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/*
 * Coverage screen, served at `/coverage` and driven by e2e/coverage.spec.ts.
 * Every directive that `smoke.component.ts` does not place is placed here, one
 * widget per row, each with a readout rendered from the signal and a button
 * that writes it — the two directions every binding has to prove. The
 * widgets are configured the way a consumer would configure them (animations
 * off only where a scripted test needs determinism); nothing here is a
 * fixture, so a row that stops compiling means the docs are wrong.
 */
@Component({
    selector: 'app-coverage',
    imports: [
        JsonPipe,
        DxAccordionModule,
        DxActionSheetModule,
        DxAutocompleteModule,
        DxButtonGroupModule,
        DxCalendarModule,
        DxCardViewModule,
        DxChartModule,
        DxChatModule,
        DxContextMenuModule,
        DxDataGridModule,
        DxDateBoxModule,
        DxDropDownButtonModule,
        DxColorBoxModule,
        DxDateRangeBoxModule,
        DxDrawerModule,
        DxDropDownBoxModule,
        DxFileManagerModule,
        DxFileUploaderModule,
        DxFilterBuilderModule,
        DxGalleryModule,
        DxGanttModule,
        DxHtmlEditorModule,
        DxListModule,
        DxLoadPanelModule,
        DxLookupModule,
        DxMultiViewModule,
        DxPaginationModule,
        DxPieChartModule,
        DxPolarChartModule,
        DxPopoverModule,
        DxRadioGroupModule,
        DxRangeSelectorModule,
        DxRangeSliderModule,
        DxResizableModule,
        DxSchedulerModule,
        DxSelectBoxModule,
        DxSplitterModule,
        DxStepperModule,
        DxSwitchModule,
        DxTabPanelModule,
        DxTabsModule,
        DxTagBoxModule,
        DxTextAreaModule,
        DxTreeListModule,
        DxTreeViewModule,
        DxToastModule,
        DxTooltipModule,
        DX_SIGNAL_DIRECTIVES,
    ],
    template: `
        <h3>Editors</h3>
        <div class="row">
            <dx-text-area id="cov-textarea" [(dxValue)]="area" valueChangeEvent="input" [height]="60" />
            <span class="readout" data-testid="cov-textarea-readout">{{ area() }}</span>
            <button data-testid="cov-textarea-set" (click)="area.set('set-area')">set</button>
        </div>
        <div class="row">
            <dx-autocomplete id="cov-autocomplete" [(dxValue)]="auto" [items]="['alpha', 'beta']" valueChangeEvent="input" />
            <span class="readout" data-testid="cov-autocomplete-readout">{{ auto() ?? 'null' }}</span>
            <button data-testid="cov-autocomplete-set" (click)="auto.set('set-auto')">set</button>
        </div>
        <div class="row">
            <dx-switch id="cov-switch" [(dxValue)]="on" />
            <span class="readout" data-testid="cov-switch-readout">{{ on() }}</span>
            <button data-testid="cov-switch-set" (click)="on.set(true)">set on</button>
        </div>
        <div class="row">
            <dx-radio-group id="cov-radio" [(dxValue)]="radio" [items]="statuses" layout="horizontal" />
            <span class="readout" data-testid="cov-radio-readout">{{ radio() ?? 'null' }}</span>
            <button data-testid="cov-radio-set" (click)="radio.set('Delivered')">set Delivered</button>
        </div>
        <div class="row">
            <dx-range-slider id="cov-rangeslider" [(dxValue)]="sliderRange" [min]="0" [max]="100" style="width:240px" />
            <span class="readout" data-testid="cov-rangeslider-readout">{{ sliderRange() | json }}</span>
            <button data-testid="cov-rangeslider-set" (click)="sliderRange.set([10, 90])">set 10–90</button>
        </div>
        <div class="row">
            <dx-color-box id="cov-color" [(dxValue)]="color" />
            <span class="readout" data-testid="cov-color-readout">{{ color() ?? 'null' }}</span>
            <button data-testid="cov-color-set" (click)="color.set('#0000ff')">set blue</button>
        </div>
        <div class="row">
            <dx-lookup id="cov-lookup" [(dxValue)]="lookupValue" [items]="statuses" />
            <span class="readout" data-testid="cov-lookup-readout">{{ lookupValue() ?? 'null' }}</span>
            <button data-testid="cov-lookup-set" (click)="lookupValue.set('Delivered')">set Delivered</button>
        </div>
        <div class="row">
            <dx-drop-down-box
                id="cov-ddbox"
                [(dxValue)]="ddValue"
                [items]="ddItems"
                displayExpr="name"
                valueExpr="id"
                [showClearButton]="true"
                [dropDownOptions]="{ hideOnOutsideClick: true }">
                <div *dxTemplate="let data of 'content'">
                    <dx-list
                        id="cov-ddbox-list"
                        [items]="ddItems"
                        displayExpr="name"
                        keyExpr="id"
                        (onItemClick)="ddValue.set($event.itemData.id)" />
                </div>
            </dx-drop-down-box>
            <span class="readout" data-testid="cov-ddbox-readout">{{ ddValue() ?? 'null' }}</span>
            <button data-testid="cov-ddbox-set" (click)="ddValue.set(2)">set Two</button>
        </div>
        <div class="row">
            <dx-html-editor id="cov-html" [(dxValue)]="html" valueChangeEvent="keyup" [height]="90" />
            <span class="readout" data-testid="cov-html-readout">{{ html() }}</span>
            <button data-testid="cov-html-set" (click)="html.set('<p>set-html</p>')">set</button>
        </div>
        <div class="row">
            <dx-calendar id="cov-calendar" [(dxValue)]="calendarValue" [min]="january(1)" [max]="january(31)" />
            <span class="readout" data-testid="cov-calendar-readout">{{ showDate(calendarValue()) }}</span>
            <button data-testid="cov-calendar-set" (click)="calendarValue.set(january(20))">set Jan 20</button>
        </div>
        <div class="row">
            <dx-date-range-box
                id="cov-daterange"
                [(dxValue)]="dateRange"
                displayFormat="yyyy-MM-dd"
                [dropDownOptions]="{ hideOnOutsideClick: true }" />
            <span class="readout" data-testid="cov-daterange-readout">{{ showDate(dateRange()[0]) }}..{{ showDate(dateRange()[1]) }}</span>
            <button data-testid="cov-daterange-set" (click)="dateRange.set([january(20), january(25)])">set Jan 20–25</button>
        </div>
        <div class="row">
            <dx-filter-builder id="cov-filter" [(dxValue)]="filter" [fields]="filterFields" />
            <span class="readout" data-testid="cov-filter-readout">{{ filter() | json }}</span>
            <button data-testid="cov-filter-set" (click)="filter.set(['amount', '>', 42])">set amount &gt; 42</button>
        </div>

        <h3>Navigation</h3>
        <div class="row">
            <dx-accordion id="cov-accordion" [(dxSelectedIndex)]="accordionIndex" [items]="accordionItems" [animationDuration]="0" style="width:320px" />
            <span class="readout" data-testid="cov-accordion-readout">{{ accordionIndex() }}</span>
            <button data-testid="cov-accordion-set" (click)="accordionIndex.set(2)">open Third</button>
        </div>
        <div class="row">
            <dx-tab-panel id="cov-tabpanel" [(dxSelectedIndex)]="tabPanelIndex" [items]="tabPanelItems" [animationEnabled]="false" style="width:320px" />
            <span class="readout" data-testid="cov-tabpanel-readout">{{ tabPanelIndex() }}</span>
            <button data-testid="cov-tabpanel-set" (click)="tabPanelIndex.set(2)">go Third</button>
        </div>
        <div class="row">
            <dx-gallery id="cov-gallery" [(dxSelectedIndex)]="galleryIndex" [items]="galleryItems" [showNavButtons]="true" [showIndicator]="true" [loop]="false" [height]="60" [width]="240" [animationDuration]="0" />
            <span class="readout" data-testid="cov-gallery-readout">{{ galleryIndex() }}</span>
            <button data-testid="cov-gallery-set" (click)="galleryIndex.set(2)">go 3rd</button>
        </div>
        <div class="row">
            <dx-list id="cov-list" [(dxSelectedItemKeys)]="listKeys" [items]="ddItems" keyExpr="id" displayExpr="name" selectionMode="multiple" style="width:200px" />
            <span class="readout" data-testid="cov-list-readout">{{ listKeys() | json }}</span>
            <button data-testid="cov-list-set" (click)="listKeys.set([1, 3])">select One &amp; Three</button>
        </div>
        <div class="row">
            <span class="readout" data-testid="cov-drawer-readout">{{ drawerOpen() }}</span>
            <button data-testid="cov-drawer-set" (click)="drawerOpen.set(true)">open drawer</button>
        </div>
        <dx-drawer
            id="cov-drawer"
            [(dxOpened)]="drawerOpen"
            openedStateMode="overlap"
            revealMode="slide"
            [closeOnOutsideClick]="true"
            [animationEnabled]="false"
            template="panel"
            [height]="120"
            style="width:400px">
            <div *dxTemplate="let data of 'panel'" data-testid="cov-drawer-panel" style="width:160px;height:100%;background:#eee">panel</div>
            <div id="cov-drawer-content" style="padding:8px">drawer content</div>
        </dx-drawer>

        <h3>Overlays</h3>
        <div class="row">
            <span class="readout" data-testid="cov-actionsheet-readout">{{ sheetVisible() }}</span>
            <button data-testid="cov-actionsheet-set" (click)="sheetVisible.set(true)">open action sheet</button>
            <span class="readout" data-testid="cov-loadpanel-readout">{{ loadVisible() }}</span>
            <button data-testid="cov-loadpanel-set" (click)="loadVisible.set(true)">show load panel</button>
            <span class="readout" data-testid="cov-toast-readout">{{ toastVisible() }}</span>
            <button data-testid="cov-toast-set" (click)="toastVisible.set(true)">show toast</button>
        </div>
        <div class="row">
            <button id="cov-popover-target" data-testid="cov-popover-set" (click)="popoverVisible.set(true)">show popover</button>
            <span class="readout" data-testid="cov-popover-readout">{{ popoverVisible() }}</span>
            <button id="cov-tooltip-target" data-testid="cov-tooltip-set" (click)="tooltipVisible.set(true)">show tooltip</button>
            <span class="readout" data-testid="cov-tooltip-readout">{{ tooltipVisible() }}</span>
        </div>
        <dx-action-sheet id="cov-actionsheet" [(dxVisible)]="sheetVisible" [items]="[{ text: 'Do it' }]" [showCancelButton]="true" [usePopover]="false" title="Sheet" />
        <dx-load-panel id="cov-loadpanel" [(dxVisible)]="loadVisible" [shading]="true" [hideOnOutsideClick]="true" message="Loading…" />
        <dx-toast id="cov-toast" [(dxVisible)]="toastVisible" message="Toasty" type="info" [displayTime]="400" />
        <dx-popover id="cov-popover" [(dxVisible)]="popoverVisible" target="#cov-popover-target" [hideOnOutsideClick]="true">
            <div data-testid="cov-popover-content">popover body</div>
        </dx-popover>
        <dx-tooltip id="cov-tooltip" [(dxVisible)]="tooltipVisible" target="#cov-tooltip-target" [hideOnOutsideClick]="true">
            <div data-testid="cov-tooltip-content">tooltip body</div>
        </dx-tooltip>

        <h3>Data</h3>
        <div class="row">
            <span class="readout" data-testid="cov-gantt-readout">{{ ganttKey() ?? 'null' }}</span>
            <button data-testid="cov-gantt-set" (click)="ganttKey.set(1)">select Plan</button>
        </div>
        <dx-gantt id="cov-gantt" [(dxSelectedRowKey)]="ganttKey" [height]="200" [taskListWidth]="220" scaleType="days" style="max-width:640px">
            <dxo-tasks [dataSource]="ganttTasks" />
            <dxi-column dataField="title" caption="Task" />
        </dx-gantt>
        <div class="row">
            <span class="readout" data-testid="cov-scheduler-date-readout">{{ showDate(schedulerDate()) }}</span>
            <button data-testid="cov-scheduler-date-set" (click)="schedulerDate.set(march(20))">go Mar 20</button>
            <span class="readout" data-testid="cov-scheduler-view-readout">{{ schedulerView() }}</span>
            <button data-testid="cov-scheduler-view-set" (click)="schedulerView.set('week')">week view</button>
        </div>
        <dx-scheduler
            id="cov-scheduler"
            [(dxCurrentDate)]="schedulerDate"
            [(dxCurrentView)]="schedulerView"
            [views]="['day', 'week']"
            [dataSource]="[]"
            [height]="240"
            [startDayHour]="9"
            [endDayHour]="11"
            style="max-width:640px" />

        <h3>Visualization</h3>
        <div class="row">
            <span class="readout" data-testid="cov-pie-readout">{{ piePoints() | json }}</span>
            <button data-testid="cov-pie-set" (click)="piePoints.set([{ argument: 'B', value: 10 }])">select B</button>
        </div>
        <dx-pie-chart id="cov-pie" [(dxSelectedPoints)]="piePoints" [dataSource]="pieData" pointSelectionMode="multiple" style="height:220px; max-width:320px">
            <dxi-series argumentField="slice" valueField="share" />
        </dx-pie-chart>
        <div class="row">
            <span class="readout" data-testid="cov-rangesel-readout">{{ selectorRange() | json }}</span>
            <button data-testid="cov-rangesel-set" (click)="selectorRange.set([10, 50])">set 10–50</button>
        </div>
        <dx-range-selector id="cov-rangesel" [(dxValue)]="selectorRange" style="height:120px; max-width:400px">
            <dxo-scale [startValue]="0" [endValue]="100" />
        </dx-range-selector>

        <h3>Drop-down open state</h3>
        <div class="row">
            <dx-select-box id="nb-selectbox" [(dxOpened)]="selectBoxOpened" [items]="statuses" />
            <span class="readout" data-testid="nb-selectbox-opened">{{ selectBoxOpened() }}</span>
            <button data-testid="nb-selectbox-open" (click)="selectBoxOpened.set(true)">open</button>
            <dx-lookup id="nb-lookup" [(dxOpened)]="lookupOpened" [items]="statuses" />
            <span class="readout" data-testid="nb-lookup-opened">{{ lookupOpened() }}</span>
            <button data-testid="nb-lookup-open" (click)="lookupOpened.set(true)">open</button>
            <dx-date-box id="nb-datebox" [(dxOpened)]="dateBoxOpened" />
            <span class="readout" data-testid="nb-datebox-opened">{{ dateBoxOpened() }}</span>
            <button data-testid="nb-datebox-open" (click)="dateBoxOpened.set(true)">open</button>
        </div>
        <div class="row">
            <dx-date-range-box id="nb-daterangebox" [(dxOpened)]="dateRangeBoxOpened" />
            <span class="readout" data-testid="nb-daterangebox-opened">{{ dateRangeBoxOpened() }}</span>
            <button data-testid="nb-daterangebox-open" (click)="dateRangeBoxOpened.set(true)">open</button>
            <dx-tag-box id="nb-tagbox" [(dxOpened)]="tagBoxOpened" [items]="statuses" />
            <span class="readout" data-testid="nb-tagbox-opened">{{ tagBoxOpened() }}</span>
            <button data-testid="nb-tagbox-open" (click)="tagBoxOpened.set(true)">open</button>
            <dx-autocomplete id="nb-autocomplete" [(dxOpened)]="autocompleteOpened" [items]="statuses" [minSearchLength]="0" />
            <span class="readout" data-testid="nb-autocomplete-opened">{{ autocompleteOpened() }}</span>
            <button data-testid="nb-autocomplete-open" (click)="autocompleteOpened.set(true)">open</button>
        </div>
        <div class="row">
            <dx-drop-down-box id="nb-ddbox" [(dxOpened)]="dropDownBoxOpened" [items]="ddItems" displayExpr="name" valueExpr="id">
                <div *dxTemplate="let data of 'content'" data-testid="nb-ddbox-content">box content</div>
            </dx-drop-down-box>
            <span class="readout" data-testid="nb-ddbox-opened">{{ dropDownBoxOpened() }}</span>
            <button data-testid="nb-ddbox-open" (click)="dropDownBoxOpened.set(true)">open</button>
            <dx-color-box id="nb-colorbox" [(dxOpened)]="colorBoxOpened" />
            <span class="readout" data-testid="nb-colorbox-opened">{{ colorBoxOpened() }}</span>
            <button data-testid="nb-colorbox-open" (click)="colorBoxOpened.set(true)">open</button>
            <dx-drop-down-button id="nb-ddbutton" [(dxOpened)]="dropDownButtonOpened" text="Menu" [items]="['Cut', 'Copy']" />
            <span class="readout" data-testid="nb-ddbutton-opened">{{ dropDownButtonOpened() }}</span>
            <button data-testid="nb-ddbutton-open" (click)="dropDownButtonOpened.set(true)">open</button>
        </div>

        <h3>TreeView expansion</h3>
        <div class="row">
            <dx-tree-view id="nb-tree" [(dxExpandedNodeKeys)]="expandedNodeKeys" [items]="treeItems" keyExpr="id" style="max-width:240px" />
            <span class="readout" data-testid="nb-tree-readout">{{ expandedNodeKeys() | json }}</span>
            <button data-testid="nb-tree-set" (click)="expandedNodeKeys.set([4])">expand Vegetables</button>
            <button data-testid="nb-tree-clear" (click)="expandedNodeKeys.set([])">collapse all</button>
        </div>

        <h3>Grid editing state</h3>
        <div class="row">
            <span class="readout" data-testid="nb-grid-batch-readout">{{ gridChanges() | json }}</span>
            <button data-testid="nb-grid-batch-set" (click)="gridChanges.set([{ type: 'update', key: 2, data: { customer: 'Changed' } }])">change Globex</button>
            <button data-testid="nb-grid-batch-clear" (click)="gridChanges.set([])">discard</button>
        </div>
        <dx-data-grid id="nb-grid-batch" [(dxEditingChanges)]="gridChanges" [dataSource]="rows" keyExpr="id" [showBorders]="true" style="max-width:420px">
            <dxo-editing mode="batch" [allowUpdating]="true" />
            <dxi-column dataField="id" [allowEditing]="false" [width]="60" />
            <dxi-column dataField="customer" />
        </dx-data-grid>
        <div class="row">
            <span class="readout" data-testid="nb-treelist-batch-readout">{{ treeChanges() | json }}</span>
            <button data-testid="nb-treelist-batch-set" (click)="treeChanges.set([{ type: 'update', key: 2, data: { name: 'Changed' } }])">change Apple</button>
            <button data-testid="nb-treelist-batch-clear" (click)="treeChanges.set([])">discard</button>
        </div>
        <dx-tree-list id="nb-treelist-batch" [(dxEditingChanges)]="treeChanges" [dataSource]="treeRows" keyExpr="id" parentIdExpr="parentId" [autoExpandAll]="true" [showBorders]="true" style="max-width:420px">
            <dxo-editing mode="batch" [allowUpdating]="true" />
            <dxi-column dataField="name" />
        </dx-tree-list>
        <div class="row">
            <span class="readout" data-testid="nb-grid-row-readout">{{ gridEditKey() ?? 'null' }}</span>
            <button data-testid="nb-grid-row-set" (click)="gridEditKey.set(1)">edit Acme</button>
            <button data-testid="nb-grid-row-cancel" (click)="gridEditKey.set(null)">cancel</button>
        </div>
        <dx-data-grid id="nb-grid-row" [(dxEditRowKey)]="gridEditKey" [dataSource]="rows" keyExpr="id" [showBorders]="true" style="max-width:420px">
            <dxo-editing mode="row" [allowUpdating]="true" />
            <dxi-column dataField="customer" />
        </dx-data-grid>
        <div class="row">
            <span class="readout" data-testid="nb-treelist-row-readout">{{ treeEditKey() ?? 'null' }}</span>
            <button data-testid="nb-treelist-row-set" (click)="treeEditKey.set(1)">edit Fruit</button>
            <button data-testid="nb-treelist-row-cancel" (click)="treeEditKey.set(null)">cancel</button>
        </div>
        <dx-tree-list id="nb-treelist-row" [(dxEditRowKey)]="treeEditKey" [dataSource]="treeRows" keyExpr="id" parentIdExpr="parentId" [autoExpandAll]="true" [showBorders]="true" style="max-width:420px">
            <dxo-editing mode="row" [allowUpdating]="true" />
            <dxi-column dataField="name" />
        </dx-tree-list>

        <h3>Deferred selection</h3>
        <div class="row">
            <span class="readout" data-testid="nb-grid-deferred-readout">{{ selectionFilter() | json }}</span>
            <button data-testid="nb-grid-deferred-set" (click)="selectionFilter.set(['id', '=', 2])">select Globex by filter</button>
        </div>
        <dx-data-grid id="nb-grid-deferred" [(dxSelectionFilter)]="selectionFilter" [dataSource]="rows" keyExpr="id" [showBorders]="true" style="max-width:420px">
            <dxo-selection mode="multiple" [deferred]="true" showCheckBoxesMode="always" />
            <dxi-column dataField="customer" />
        </dx-data-grid>

        <h3>Chart visual range</h3>
        <div class="row">
            <span class="readout" data-testid="nb-chart-readout">{{ visualRange() === undefined ? 'undefined' : (visualRange() | json) }}</span>
            <button data-testid="nb-chart-set" (click)="visualRange.set({ startValue: 3, endValue: 6 })">zoom to 3–6</button>
        </div>
        <dx-chart id="nb-chart" [(dxVisualRange)]="visualRange" [dataSource]="lineData" style="height:200px; max-width:480px">
            <dxi-series argumentField="x" valueField="y" type="line" />
            <dxo-zoom-and-pan argumentAxis="both" [allowMouseWheel]="true" />
        </dx-chart>

        <h3>Selection breadth</h3>
        <div class="row">
            <dx-tabs id="nb-tabs" [(dxSelectedItemKeys)]="tabKeys" [items]="tabItems" keyExpr="id" selectionMode="multiple" style="width:320px" />
            <span class="readout" data-testid="nb-tabs-readout">{{ tabKeys() | json }}</span>
            <button data-testid="nb-tabs-set" (click)="tabKeys.set([1, 3])">select One &amp; Three</button>
        </div>
        <div class="row">
            <dx-accordion id="nb-accordion" [(dxSelectedItemKeys)]="accordionKeys" [items]="keyedPanes" keyExpr="id" [multiple]="true" [collapsible]="true" [animationDuration]="0" style="width:320px" />
            <span class="readout" data-testid="nb-accordion-readout">{{ accordionKeys() | json }}</span>
            <button data-testid="nb-accordion-set" (click)="accordionKeys.set([1, 3])">open First &amp; Third</button>
        </div>
        <div class="row">
            <dx-button-group id="nb-buttongroup" [(dxSelectedItemKeys)]="buttonGroupKeys" [items]="buttonItems" keyExpr="id" selectionMode="multiple" />
            <span class="readout" data-testid="nb-buttongroup-readout">{{ buttonGroupKeys() | json }}</span>
            <button data-testid="nb-buttongroup-set" (click)="buttonGroupKeys.set(['b', 'i'])">bold + italic</button>
        </div>
        <div class="row">
            <dx-multi-view id="nb-multiview" [(dxSelectedIndex)]="multiViewIndex" [items]="tabPanelItems" [animationEnabled]="false" [height]="50" style="width:320px" />
            <span class="readout" data-testid="nb-multiview-readout">{{ multiViewIndex() }}</span>
            <button data-testid="nb-multiview-set" (click)="multiViewIndex.set(2)">go third</button>
        </div>
        <div class="row">
            <dx-stepper id="nb-stepper" [(dxSelectedIndex)]="stepperIndex" [items]="stepItems" [linear]="false" style="width:420px" />
            <span class="readout" data-testid="nb-stepper-readout">{{ stepperIndex() }}</span>
            <button data-testid="nb-stepper-set" (click)="stepperIndex.set(2)">go Done</button>
        </div>
        <div class="row">
            <dx-pagination id="nb-pagination" [(dxPageIndex)]="pageIndex1" [(dxPageSize)]="pageSize" [itemCount]="50" [allowedPageSizes]="[5, 10, 20]" [showPageSizeSelector]="true" />
            <span class="readout" data-testid="nb-pagination-index">{{ pageIndex1() }}</span>
            <span class="readout" data-testid="nb-pagination-size">{{ pageSize() }}</span>
            <button data-testid="nb-pagination-set-index" (click)="pageIndex1.set(2)">page 2</button>
            <button data-testid="nb-pagination-set-size" (click)="pageSize.set(5)">size 5</button>
        </div>
        <div class="row">
            <div id="nb-contextmenu-target" data-testid="nb-contextmenu-target" style="padding:8px;border:1px dashed #999">right-click me</div>
            <span class="readout" data-testid="nb-contextmenu-readout">{{ contextMenuVisible() }}</span>
            <button data-testid="nb-contextmenu-open" (click)="contextMenuVisible.set(true)">open menu</button>
        </div>
        <dx-context-menu id="nb-contextmenu" [(dxVisible)]="contextMenuVisible" [items]="[{ text: 'Cut' }, { text: 'Copy' }]" target="#nb-contextmenu-target" />
        <div class="row">
            <span class="readout" data-testid="nb-polar-readout">{{ polarPoints() | json }}</span>
            <button data-testid="nb-polar-set" (click)="polarPoints.set([{ argument: 'E', value: 8 }])">select E</button>
        </div>
        <dx-polar-chart id="nb-polar" [(dxSelectedPoints)]="polarPoints" [dataSource]="polarData" pointSelectionMode="multiple" style="height:220px; max-width:320px">
            <dxi-series argumentField="arg" valueField="val" type="line" />
        </dx-polar-chart>

        <h3>Editor state beyond value</h3>
        <div class="row">
            <dx-file-uploader id="nb-uploader" [(dxValue)]="files" uploadMode="useForm" [multiple]="true" selectButtonText="pick" style="width:360px" />
            <span class="readout" data-testid="nb-uploader-readout">{{ fileNames() }}</span>
            <button data-testid="nb-uploader-set" (click)="files.set([madeUpFile()])">set one</button>
            <button data-testid="nb-uploader-clear" (click)="files.set([])">clear</button>
        </div>
        <div class="row">
            <dx-calendar id="nb-calendar-zoom" [(dxZoomLevel)]="zoomLevel" minZoomLevel="year" [value]="january(10)" />
            <span class="readout" data-testid="nb-calendar-zoom-readout">{{ zoomLevel() }}</span>
            <button data-testid="nb-calendar-zoom-set" (click)="zoomLevel.set('year')">year view</button>
            <button data-testid="nb-calendar-zoom-clamp" (click)="zoomLevel.set('century')">century (clamped to year)</button>
        </div>
        <div class="row">
            <dx-chat id="nb-chat" [(dxInputFieldText)]="draft" [items]="[]" [user]="chatUser" [height]="160" style="width:360px" />
            <span class="readout" data-testid="nb-chat-readout">{{ draft() }}</span>
            <button data-testid="nb-chat-set" (click)="draft.set('set-draft')">set</button>
        </div>

        <h3>Layout state</h3>
        <div class="row">
            <dx-resizable id="nb-resizable" [(dxWidth)]="resizableWidth" [(dxHeight)]="resizableHeight" handles="right bottom" [minWidth]="60" [minHeight]="30" style="display:block">
                <div style="background:#dde;height:100%;padding:4px;box-sizing:border-box">resize me</div>
            </dx-resizable>
            <span class="readout" data-testid="nb-resizable-readout">{{ resizableWidth() }}x{{ resizableHeight() }}</span>
            <button data-testid="nb-resizable-set" (click)="resizableWidth.set(220); resizableHeight.set(70)">220x70</button>
        </div>
        <div class="row">
            <span class="readout" data-testid="nb-splitter-sizes">{{ paneSizes() === undefined ? 'undefined' : (paneSizes() | json) }}</span>
            <span class="readout" data-testid="nb-splitter-collapsed">{{ collapsedPanes() | json }}</span>
            <button data-testid="nb-splitter-set-sizes" (click)="paneSizes.set([50, 342])">50 / rest (clamped to 80)</button>
            <button data-testid="nb-splitter-collapse" (click)="collapsedPanes.set([0])">collapse first</button>
            <button data-testid="nb-splitter-expand" (click)="collapsedPanes.set([])">expand all</button>
        </div>
        <dx-splitter id="nb-splitter" [(dxItemSizes)]="paneSizes" [(dxCollapsedItems)]="collapsedPanes" [items]="panes" [width]="400" [height]="80" />

        <h3>Focused row by index</h3>
        <div class="row">
            <span class="readout" data-testid="nb-grid-focusidx-readout">{{ gridFocusedIndex() }}</span>
            <button data-testid="nb-grid-focusidx-set" (click)="gridFocusedIndex.set(2)">focus third</button>
        </div>
        <dx-data-grid id="nb-grid-focusidx" [(dxFocusedRowIndex)]="gridFocusedIndex" [dataSource]="rows" keyExpr="id" [focusedRowEnabled]="true" [showBorders]="true" style="max-width:420px">
            <dxi-column dataField="customer" />
        </dx-data-grid>
        <div class="row">
            <span class="readout" data-testid="nb-treelist-focusidx-readout">{{ treeFocusedIndex() }}</span>
            <button data-testid="nb-treelist-focusidx-set" (click)="treeFocusedIndex.set(2)">focus third</button>
        </div>
        <dx-tree-list id="nb-treelist-focusidx" [(dxFocusedRowIndex)]="treeFocusedIndex" [dataSource]="treeRows" keyExpr="id" parentIdExpr="parentId" [autoExpandAll]="true" [focusedRowEnabled]="true" [showBorders]="true" style="max-width:420px">
            <dxi-column dataField="name" />
        </dx-tree-list>

        <h3>Card view</h3>
        <div class="row">
            <span class="readout" data-testid="nb-cardview-keys">{{ cardKeys() | json }}</span>
            <span class="readout" data-testid="nb-cardview-page">{{ cardPage() }}</span>
            <span class="readout" data-testid="nb-cardview-size">{{ cardPageSize() }}</span>
            <span class="readout" data-testid="nb-cardview-search">{{ cardSearch() }}</span>
            <span class="readout" data-testid="nb-cardview-filter">{{ cardFilter() | json }}</span>
        </div>
        <div class="row">
            <button data-testid="nb-cardview-set-keys" (click)="cardKeys.set([2])">select Globex</button>
            <button data-testid="nb-cardview-set-page" (click)="cardPage.set(1)">page 2</button>
            <button data-testid="nb-cardview-set-size" (click)="cardPageSize.set(3)">size 3</button>
            <button data-testid="nb-cardview-set-search" (click)="cardSearch.set('Ini')">search Ini</button>
            <button data-testid="nb-cardview-set-filter" (click)="cardFilter.set(['customer', 'contains', 'x'])">filter x</button>
            <button data-testid="nb-cardview-clear-filter" (click)="cardFilter.set(null)">clear filter</button>
        </div>
        <dx-card-view
            id="nb-cardview"
            [(dxSelectedCardKeys)]="cardKeys"
            [(dxPageIndex)]="cardPage"
            [(dxPageSize)]="cardPageSize"
            [(dxSearchPanelText)]="cardSearch"
            [(dxFilterValue)]="cardFilter"
            [dataSource]="rows"
            keyExpr="id"
            [selection]="cardSelection"
            [paging]="cardPaging"
            [searchPanel]="cardSearchPanel"
            [height]="300"
            style="max-width:640px" />

        <h3>File manager</h3>
        <div class="row">
            <span class="readout" data-testid="nb-fm-path">{{ fmPath() | json }}</span>
            <span class="readout" data-testid="nb-fm-selected">{{ fmSelected() | json }}</span>
            <span class="readout" data-testid="nb-fm-focused">{{ fmFocused() ?? 'null' }}</span>
            <button data-testid="nb-fm-set-path" (click)="fmPath.set(['Docs'])">open Docs</button>
            <button data-testid="nb-fm-set-selected" (click)="fmSelected.set(['Docs/b.txt'])">select b.txt</button>
            <button data-testid="nb-fm-set-focused" (click)="fmFocused.set('Docs/a.txt')">focus a.txt</button>
        </div>
        <dx-file-manager
            id="nb-fm"
            [(dxCurrentPathKeys)]="fmPath"
            [(dxSelectedItemKeys)]="fmSelected"
            [(dxFocusedItemKey)]="fmFocused"
            [fileSystemProvider]="fmItems"
            [height]="280"
            style="max-width:640px" />

        <h3>Chart value axis</h3>
        <div class="row">
            <span class="readout" data-testid="nb-chart-value-readout">{{ valueRange() === undefined ? 'undefined' : (valueRange() | json) }}</span>
            <button data-testid="nb-chart-value-set" (click)="valueRange.set([2, 6])">zoom values to 2–6</button>
        </div>
        <dx-chart id="nb-chart-value" [(dxValueAxisVisualRange)]="valueRange" [dataSource]="lineData" style="height:200px; max-width:480px">
            <dxi-series argumentField="x" valueField="y" type="line" />
            <dxo-zoom-and-pan valueAxis="both" [allowMouseWheel]="true" />
        </dx-chart>

        <h3>Templates under zoneless</h3>
        <!-- A signal read *inside* a widget-rendered template: the list owns
             the DOM, Angular owns the embedded view, and the counter has to
             reach it with no zone to trigger a tick. -->
        <div class="row">
            <button data-testid="cov-counter-inc" (click)="counter.set(counter() + 1)">increment</button>
            <span class="readout" data-testid="cov-counter-readout">{{ counter() }}</span>
        </div>
        <dx-list id="cov-template-list" [items]="ddItems" style="width:200px">
            <div *dxTemplate="let item of 'item'">{{ item.name }} × {{ counter() }}</div>
        </dx-list>
    `,
    styles: `
        .row { display: flex; align-items: center; gap: 12px; margin: 6px 0; flex-wrap: wrap; }
        .readout { font-family: monospace; padding: 2px 6px; background: #f3f3f3; }
    `,
})
export class CoverageComponent {
    readonly statuses: Status[] = ['Pending', 'Shipped', 'Delivered'];
    readonly ddItems = [
        { id: 1, name: 'One' },
        { id: 2, name: 'Two' },
        { id: 3, name: 'Three' },
    ];

    // Editors
    readonly area = signal('');
    readonly auto = signal<string | null>(null);
    readonly on = signal(false);
    readonly radio = signal<Status | null>(null);
    readonly sliderRange = signal<DxNumberRange>([20, 60]);
    readonly color = signal<string | null>('#ff0000');
    readonly lookupValue = signal<Status | null>(null);
    readonly ddValue = signal<number | null>(1);
    readonly html = signal('');
    readonly calendarValue = signal<DxDateValue | readonly DxDateValue[] | null>(this.january(10));
    readonly dateRange = signal<DxDateRange>([this.january(5), this.january(9)]);
    readonly filter = signal<DxFilterExpression | null>(null);
    readonly filterFields = [
        { dataField: 'amount', dataType: 'number' as const },
        { dataField: 'customer', dataType: 'string' as const },
    ];

    // Navigation
    readonly accordionIndex = signal(0);
    readonly accordionItems = [
        { title: 'First', text: 'first body' },
        { title: 'Second', text: 'second body' },
        { title: 'Third', text: 'third body' },
    ];
    readonly tabPanelIndex = signal(0);
    readonly tabPanelItems = [
        { title: 'First', text: 'first pane' },
        { title: 'Second', text: 'second pane' },
        { title: 'Third', text: 'third pane' },
    ];
    readonly galleryIndex = signal(0);
    readonly galleryItems = ['one', 'two', 'three'];
    readonly listKeys = signal<readonly number[]>([]);
    readonly drawerOpen = signal(false);

    // Overlays
    readonly sheetVisible = signal(false);
    readonly loadVisible = signal(false);
    readonly toastVisible = signal(false);
    readonly popoverVisible = signal(false);
    readonly tooltipVisible = signal(false);

    // Data
    readonly ganttKey = signal<number | null>(null);
    readonly ganttTasks = [
        { id: 1, parentId: 0, title: 'Plan', start: this.january(5), end: this.january(9), progress: 50 },
        { id: 2, parentId: 0, title: 'Design', start: this.january(12), end: this.january(16), progress: 0 },
    ];
    readonly schedulerDate = signal<DxDateValue>(this.march(10));
    readonly schedulerView = signal<DxSchedulerView>('day');

    // Visualization
    readonly piePoints = signal<readonly DxChartSelectedPoint[]>([]);
    /** One dominant slice, so the pie's centre is a deterministic click target for it. */
    readonly pieData = [
        { slice: 'A', share: 80 },
        { slice: 'B', share: 10 },
        { slice: 'C', share: 10 },
    ];
    readonly selectorRange = signal<DxRangeSelectorValue>([20, 60]);

    // 4.0 bindings — drop-down open state
    readonly selectBoxOpened = signal(false);
    readonly lookupOpened = signal(false);
    readonly dateBoxOpened = signal(false);
    readonly dateRangeBoxOpened = signal(false);
    readonly tagBoxOpened = signal(false);
    readonly autocompleteOpened = signal(false);
    readonly dropDownBoxOpened = signal(false);
    readonly colorBoxOpened = signal(false);
    readonly dropDownButtonOpened = signal(false);

    // 4.0 bindings — TreeView expansion
    readonly expandedNodeKeys = signal<readonly number[]>([]);
    readonly treeItems = [
        { id: 1, text: 'Fruit', items: [{ id: 2, text: 'Apple' }, { id: 3, text: 'Banana' }] },
        { id: 4, text: 'Vegetables', items: [{ id: 5, text: 'Carrot' }] },
    ];

    // 4.0 bindings — grid editing state and deferred selection
    readonly rows = [
        { id: 1, customer: 'Acme' },
        { id: 2, customer: 'Globex' },
        { id: 3, customer: 'Initech' },
    ];
    readonly treeRows = [
        { id: 1, parentId: 0, name: 'Fruit' },
        { id: 2, parentId: 1, name: 'Apple' },
        { id: 3, parentId: 0, name: 'Vegetables' },
    ];
    readonly gridChanges = signal<readonly DxDataChange<{ id: number; customer: string }, number>[]>([]);
    readonly treeChanges = signal<readonly DxDataChange<{ id: number; name: string }, number>[]>([]);
    readonly gridEditKey = signal<number | null>(null);
    readonly treeEditKey = signal<number | null>(null);
    readonly selectionFilter = signal<DxFilterExpression | null>([]);

    // 4.0 bindings — chart visual range
    readonly visualRange = signal<DxChartVisualRange | undefined>(undefined);
    readonly lineData = Array.from({ length: 10 }, (_, i) => ({ x: i + 1, y: (i * 7) % 10 }));

    // 4.0 bindings — selection breadth
    readonly tabKeys = signal<readonly number[]>([]);
    readonly tabItems = [
        { id: 1, text: 'One' },
        { id: 2, text: 'Two' },
        { id: 3, text: 'Three' },
    ];
    readonly keyedPanes = [
        { id: 1, title: 'First', text: 'first pane' },
        { id: 2, title: 'Second', text: 'second pane' },
        { id: 3, title: 'Third', text: 'third pane' },
    ];
    readonly accordionKeys = signal<readonly number[]>([]);
    readonly buttonItems = [
        { id: 'b', text: 'Bold' },
        { id: 'i', text: 'Italic' },
    ];
    readonly buttonGroupKeys = signal<readonly string[]>([]);
    readonly multiViewIndex = signal(0);
    readonly stepItems = [{ text: 'Cart' }, { text: 'Pay' }, { text: 'Done' }];
    readonly stepperIndex = signal(0);
    readonly pageIndex1 = signal(1);
    readonly pageSize = signal(10);
    readonly contextMenuVisible = signal(false);
    readonly polarPoints = signal<readonly DxChartSelectedPoint[]>([]);
    readonly polarData = [
        { arg: 'N', val: 5 },
        { arg: 'E', val: 8 },
        { arg: 'S', val: 3 },
        { arg: 'W', val: 6 },
    ];

    // 4.0 demand-driven bindings — editor state beyond value
    readonly files = signal<readonly File[]>([]);
    readonly fileNames = computed(() => this.files().map((file) => file.name).join(',') || 'none');
    readonly zoomLevel = signal<DxCalendarZoomLevel>('month');
    readonly draft = signal('');
    readonly chatUser = { id: 1, name: 'me' };

    // 4.0 demand-driven bindings — layout state
    readonly resizableWidth = signal<DxResizableSize>(150);
    readonly resizableHeight = signal<DxResizableSize>(50);
    readonly paneSizes = signal<readonly number[] | undefined>(undefined);
    readonly collapsedPanes = signal<readonly number[]>([]);
    /** `minSize` on the first pane, so a written size below it is measurably clamped. */
    readonly panes = [
        { text: 'left', collapsible: true, minSize: 80 },
        { text: 'right' },
    ];

    // 4.0 demand-driven bindings — focused row by index, card view, file manager
    readonly gridFocusedIndex = signal(-1);
    readonly treeFocusedIndex = signal(-1);
    readonly cardKeys = signal<readonly number[]>([]);
    readonly cardPage = signal(0);
    readonly cardPageSize = signal(2);
    readonly cardSearch = signal('');
    readonly cardFilter = signal<DxFilterExpression | null>(null);
    /** Stable references: a template literal would be a new object per check and re-push the option. */
    readonly cardSelection = { mode: 'multiple' as const };
    readonly cardPaging = { pageSize: 2 };
    readonly cardSearchPanel = { visible: true };
    readonly fmPath = signal<readonly string[]>([]);
    readonly fmSelected = signal<readonly string[]>([]);
    readonly fmFocused = signal<string | null>(null);
    readonly fmItems = [
        { name: 'Docs', isDirectory: true, items: [{ name: 'a.txt', size: 10 }, { name: 'b.txt', size: 20 }] },
        { name: 'root.txt', size: 5 },
    ];

    // 4.0 demand-driven bindings — chart value axis
    readonly valueRange = signal<DxChartValueAxisVisualRange | undefined>(undefined);

    // Templates
    readonly counter = signal(0);

    readonly showDate = showDate;

    january(day: number): Date {
        return new Date(2026, 0, day);
    }
    madeUpFile(): File {
        return new File(['set'], 'set.txt', { type: 'text/plain' });
    }
    march(day: number): Date {
        return new Date(2026, 2, day);
    }
}
