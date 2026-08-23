import { Component, computed, effect, signal, untracked, viewChild } from '@angular/core';
import { JsonPipe } from '@angular/common';
import CustomStore from 'devextreme/data/custom_store';
import DataSource from 'devextreme/data/data_source';
import { DxChartModule } from 'devextreme-angular/ui/chart';
import { DxCheckBoxModule } from 'devextreme-angular/ui/check-box';
import { DxDataGridModule } from 'devextreme-angular/ui/data-grid';
import { DxFormModule } from 'devextreme-angular/ui/form';
import { DxPopupModule } from 'devextreme-angular/ui/popup';
import { DxSelectBoxComponent, DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import { DxSliderModule } from 'devextreme-angular/ui/slider';
import { DxTabsModule } from 'devextreme-angular/ui/tabs';
import { DxTextBoxComponent, DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import { DxTreeListModule } from 'devextreme-angular/ui/tree-list';
import { DxTreeViewModule } from 'devextreme-angular/ui/tree-view';
import {
    bindDxOption,
    DX_SIGNAL_DIRECTIVES,
    dxArrayStoreSource,
    dxEventSignal,
    dxInstanceSignal,
    dxOptionSignal,
    dxReloadOn,
    type DxChartSelectedPoint,
} from 'ngx-devextreme-zoneless';

type Status = 'Pending' | 'Shipped' | 'Delivered';

interface Person {
    firstName: string;
    lastName: string;
    /** Edited through a nested `dataField`, which is what makes clone *depth* observable. */
    address: { city: string; zip: string };
    /**
     * Carried through the binding but never edited. `dxStructuralClone` has to
     * re-create a `Date` as a `Date` and an array as an array — a JSON-based
     * clone would hand back a string here. `form-shape` asserts on that.
     */
    hiredOn: Date;
    tags: readonly string[];
}

interface Order {
    readonly id: number;
    readonly customer: string;
}

@Component({
    selector: 'app-smoke',
    imports: [
        JsonPipe,
        DxChartModule,
        DxCheckBoxModule,
        DxDataGridModule,
        DxFormModule,
        DxPopupModule,
        DxSelectBoxModule,
        DxSliderModule,
        DxTabsModule,
        DxTextBoxModule,
        DxTreeListModule,
        DxTreeViewModule,
        DX_SIGNAL_DIRECTIVES,
    ],
    template: `
        <h3>Editors</h3>
        <div class="row">
            <dx-text-box
                id="text-main"
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

        <h3>Grid selection (dxArrayStoreSource)</h3>
        <dx-data-grid
            id="grid-selection"
            [(dxSelectedRowKeys)]="selectedIds"
            [dataSource]="ordersSource"
            style="max-width:480px">
            <dxo-selection mode="multiple" />
            <dxi-column dataField="id" />
            <dxi-column dataField="customer" />
        </dx-data-grid>
        <p>
            <span class="readout" data-testid="grid-readout">{{ selectedIds() | json }}</span>
            <button data-testid="grid-set" (click)="selectedIds.set([1, 3])">select 1 &amp; 3</button>
            <button data-testid="grid-clear" (click)="selectedIds.set([])">clear selection</button>
            <button data-testid="orders-add" (click)="addOrder()">add order</button>
        </p>

        <h3>Grid paging &amp; focused row</h3>
        <dx-data-grid
            id="grid-paging"
            [(dxPageIndex)]="pageIndex"
            [(dxFocusedRowKey)]="focusedId"
            [dataSource]="orders()"
            keyExpr="id"
            [focusedRowEnabled]="true"
            style="max-width:480px">
            <dxo-paging [pageSize]="2" />
            <dxo-pager [visible]="true" />
            <dxi-column dataField="id" />
            <dxi-column dataField="customer" />
        </dx-data-grid>
        <p>
            <span class="readout" data-testid="page-readout">{{ pageIndex() }}</span>
            <button data-testid="page-set" (click)="pageIndex.set(1)">go page 2</button>
            <span class="readout" data-testid="focus-readout">{{ focusedId() ?? 'null' }}</span>
            <button data-testid="focus-set" (click)="focusedId.set(2)">focus row 2</button>
        </p>

        <h3>Form data</h3>
        <dx-form id="form-main" [(dxFormData)]="person" style="max-width:480px">
            <dxi-item dataField="firstName" [editorOptions]="{ valueChangeEvent: 'input' }" />
            <dxi-item dataField="lastName" [editorOptions]="{ valueChangeEvent: 'input' }" />
            <dxi-item dataField="address.city" [editorOptions]="{ valueChangeEvent: 'input' }" />
        </dx-form>
        <p>
            <span class="readout" data-testid="form-readout">{{ person() | json }}</span>
            <span class="readout" data-testid="form-emits">emits: {{ personEmits() }}</span>
            <span class="readout" data-testid="form-shape">{{ personShape() }}</span>
            <button data-testid="form-set" (click)="setPerson()">set signal</button>
        </p>

        <h3>Grid search panel</h3>
        <dx-data-grid
            id="grid-search"
            [(dxSearchPanelText)]="gridSearch"
            [dataSource]="orders()"
            keyExpr="id"
            style="max-width:480px">
            <dxo-search-panel [visible]="true" />
            <dxi-column dataField="id" />
            <dxi-column dataField="customer" />
        </dx-data-grid>
        <p>
            <span class="readout" data-testid="search-readout">{{ gridSearch() }}</span>
            <span class="readout" data-testid="search-kind">{{ gridSearchKind() }}</span>
            <button data-testid="search-set" (click)="gridSearch.set('Globex')">search Globex</button>
            <button data-testid="search-clear" (click)="gridSearch.set('')">clear</button>
        </p>

        <h3>Grid state</h3>
        <dx-data-grid
            id="grid-state"
            [(dxGridState)]="gridState"
            [dxGridStateDebounce]="50"
            [(dxSearchPanelText)]="stateSearch"
            [dataSource]="orders()"
            keyExpr="id"
            style="max-width:480px">
            <dxo-search-panel [visible]="true" />
            <dxo-paging [pageSize]="2" />
            <dxi-column dataField="id" />
            <dxi-column dataField="customer" />
        </dx-data-grid>
        <p>
            <span class="readout" data-testid="state-page">{{ gridState() === undefined ? 'undefined' : (gridState() | json) }}</span>
            <span class="readout" data-testid="state-emits">emits: {{ gridStateEmits() }}</span>
            <span class="readout" data-testid="state-search-readout">{{ stateSearch() }}</span>
            <span class="readout" data-testid="state-search-kind">{{ stateSearchKind() }}</span>
            <button data-testid="state-restore" (click)="restoreState()">restore page 2</button>
            <button data-testid="state-reset" (click)="gridState.set(null)">reset layout</button>
            <button data-testid="state-save" (click)="saveState()">save layout</button>
            <button data-testid="state-restore-saved" (click)="restoreSavedState()">
                restore saved layout
            </button>
            <button data-testid="state-empty" (click)="gridState.set({})">push empty state</button>
        </p>

        <h3>TreeView selection</h3>
        <div class="row">
            <dx-tree-view
                id="tree-select"
                [items]="treeItems"
                keyExpr="id"
                selectionMode="multiple"
                showCheckBoxesMode="normal"
                [selectByClick]="true"
                [(dxSelectedNodeKeys)]="treeKeys"
                style="max-width:240px" />
            <span class="readout" data-testid="tree-readout">{{ treeKeys() | json }}</span>
            <button data-testid="tree-set" (click)="treeKeys.set([3])">select banana</button>
            <button data-testid="tree-set-bogus" (click)="treeKeys.set([3, 999])">
                select banana + bogus key
            </button>
        </div>

        <h3>TreeList expansion</h3>
        <dx-tree-list
            id="tree-list-expand"
            [dataSource]="treeListRows"
            keyExpr="id"
            parentIdExpr="parentId"
            [autoExpandAll]="false"
            [(dxExpandedRowKeys)]="expandedKeys"
            [showBorders]="true"
            style="max-width:420px">
            <dxi-column dataField="name" />
        </dx-tree-list>
        <p>
            <span class="readout" data-testid="expand-readout">{{ expandedKeys() | json }}</span>
            <button data-testid="expand-set" (click)="expandedKeys.set([4])">expand Vegetables</button>
            <button data-testid="expand-clear" (click)="expandedKeys.set([])">collapse all</button>
        </p>

        <h3>TreeView selection across re-creation (async items)</h3>
        <div class="row">
            <button data-testid="async-tree-toggle" (click)="showAsyncTree.set(!showAsyncTree())">
                toggle tree
            </button>
            <span class="readout" data-testid="async-tree-readout">{{ asyncTreeKeys() | json }}</span>
        </div>
        @if (showAsyncTree()) {
            <dx-tree-view
                id="tree-async"
                [dataSource]="asyncTreeSource"
                dataStructure="plain"
                keyExpr="id"
                parentIdExpr="parentId"
                displayExpr="text"
                selectionMode="multiple"
                showCheckBoxesMode="normal"
                [selectByClick]="true"
                [(dxSelectedNodeKeys)]="asyncTreeKeys"
                style="max-width:240px" />
        }

        <h3>Popup</h3>
        <div class="row">
            <button data-testid="popup-open" (click)="popupVisible.set(true)">open popup</button>
            <span class="readout" data-testid="popup-readout">{{ popupVisible() }}</span>
        </div>
        <!-- Animations are disabled so scripted tests can interact with the
             popup deterministically; the visibility binding is unaffected. -->
        <dx-popup
            [(dxVisible)]="popupVisible"
            title="Smoke popup"
            [showCloseButton]="true"
            [hideOnOutsideClick]="true"
            [animation]="{ show: { duration: 0 }, hide: { duration: 0 } }"
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
            <button data-testid="chart-set-bogus" (click)="selectFebAndBogus()">
                select Feb + a point that does not exist
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

        <h3>Signal-driven remote loading</h3>
        <div class="row">
            <input
                data-testid="remote-filter-input"
                placeholder="filter customers"
                (input)="customerFilter.set($any($event.target).value)" />
            <span class="readout" data-testid="remote-load-count">loads: {{ remoteLoadCount() }}</span>
        </div>
        <dx-data-grid id="grid-remote" [dataSource]="remoteSource" style="max-width:480px">
            <dxi-column dataField="id" />
            <dxi-column dataField="customer" />
        </dx-data-grid>

        <h3>Widget re-creation</h3>
        <div class="row">
            <button data-testid="recreate-toggle" (click)="showRecreate.set(!showRecreate())">
                toggle widget
            </button>
            <button data-testid="recreate-set" (click)="recreateText.set('pushed-into-new-widget')">
                set signal
            </button>
            <span class="readout" data-testid="recreate-instance-readout">{{
                recreateInstance() ? 'live' : 'gone'
            }}</span>
            <span class="readout" data-testid="recreate-readout">{{ recreateText() ?? '' }}</span>
        </div>
        @if (showRecreate()) {
            <dx-text-box
                id="text-recreate"
                #recreateBox
                valueChangeEvent="input"
                placeholder="recreated widget"
                style="max-width: 240px" />
        }
    `,
})
export class SmokeComponent {
    readonly text = signal('');
    readonly status = signal<Status | null>(null);
    readonly checked = signal<boolean | null>(false);
    readonly amount = signal(25);
    readonly tab = signal(0);
    readonly selectedIds = signal<readonly number[]>([]);
    readonly pageIndex = signal(0);
    readonly focusedId = signal<number | null>(null);
    readonly popupVisible = signal(false);
    readonly person = signal<Person>({
        firstName: 'Ada',
        lastName: 'Lovelace',
        address: { city: 'London', zip: 'NW1' },
        hiredOn: new Date('1843-01-01T00:00:00.000Z'),
        tags: ['founder'],
    });
    readonly personEmits = signal(0);
    /**
     * The runtime shape of the two fields the form never edits. The binding
     * writes a clone in and reads a clone back, so both have to survive the
     * round trip as themselves.
     */
    readonly personShape = computed(() => {
        const person = this.person();
        const when = person.hiredOn instanceof Date ? 'Date' : typeof person.hiredOn;
        const tags = Array.isArray(person.tags) ? 'array' : typeof person.tags;
        return `${when}/${tags}`;
    });
    readonly gridState = signal<Record<string, unknown> | null | undefined>(undefined);
    readonly gridStateEmits = signal(0);
    readonly gridSearch = signal('');
    /**
     * `[(dxSearchPanelText)]`'s model type is `string`, so an `undefined`
     * arriving from the widget is invisible to both the type system and a
     * plain `{{ }}` readout — Angular renders it exactly like `''`. Reporting
     * the runtime type is what lets a test tell "cleared" from "absent".
     */
    readonly gridSearchKind = computed(() => typeof this.gridSearch());
    /** The same grid that carries `[(dxGridState)]`, so a restore drives both. */
    readonly stateSearch = signal('');
    readonly stateSearchKind = computed(() => typeof this.stateSearch());
    private readonly savedState = signal<Record<string, unknown> | undefined>(undefined);
    readonly points = signal<readonly DxChartSelectedPoint[]>([]);
    readonly treeKeys = signal<readonly number[]>([]);
    /**
     * Same binding, but the items arrive *after* the widget initializes — the
     * shape a remote-backed tree inside an `@if` or a tab panel actually has.
     * On re-creation the binding re-attaches and pushes the surviving
     * selection into a widget that does not know its nodes yet.
     */
    /**
     * The signal holds the complete set of expanded keys, so writing a new
     * array both expands and collapses to match it, and `[]` collapses all.
     */
    readonly expandedKeys = signal<readonly number[]>([]);
    readonly treeListRows = [
        { id: 1, parentId: 0, name: 'Fruit' },
        { id: 2, parentId: 1, name: 'Apple' },
        { id: 3, parentId: 1, name: 'Banana' },
        { id: 4, parentId: 0, name: 'Vegetables' },
        { id: 5, parentId: 4, name: 'Carrot' },
    ];

    readonly showAsyncTree = signal(true);
    readonly asyncTreeKeys = signal<readonly number[]>([]);
    readonly asyncTreeSource = new DataSource<{ id: number }, number>({
        store: new CustomStore<{ id: number }, number>({
            key: 'id',
            loadMode: 'raw',
            load: async () => {
                await new Promise((resolve) => setTimeout(resolve, 60));
                return [
                    { id: 1, text: 'Fruit', parentId: 0, expanded: true },
                    { id: 2, text: 'Apple', parentId: 1 },
                    { id: 3, text: 'Banana', parentId: 1 },
                    { id: 4, text: 'Vegetables', parentId: 0 },
                ];
            },
        }),
    });

    readonly treeItems = [
        {
            id: 1,
            text: 'Fruit',
            expanded: true,
            items: [
                { id: 2, text: 'Apple' },
                { id: 3, text: 'Banana' },
            ],
        },
        { id: 4, text: 'Vegetables' },
    ];

    readonly statuses: Status[] = ['Pending', 'Shipped', 'Delivered'];
    readonly tabs = ['One', 'Two', 'Three'];

    // Data-in: the orders live in a signal; dxArrayStoreSource turns it into
    // a DataSource that reloads whenever the signal changes.
    readonly orders = signal<readonly Order[]>([
        { id: 1, customer: 'Acme' },
        { id: 2, customer: 'Globex' },
        { id: 3, customer: 'Initech' },
    ]);
    readonly ordersSource = dxArrayStoreSource(this.orders, { key: 'id' });

    // Data-in, remote style: a CustomStore standing in for a remote endpoint;
    // the external filter signal drives reloads via dxReloadOn — the
    // component contains no hand-written refresh() plumbing.
    readonly customerFilter = signal('');
    readonly remoteLoadCount = signal(0);
    readonly remoteSource = this.createRemoteSource();

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

    // Widget re-creation — composition API bindings on an `@if`-wrapped
    // widget must re-attach when the widget is destroyed and re-created,
    // and the surviving signal state must be restored into the new widget.
    readonly showRecreate = signal(true);
    private readonly recreateBox = viewChild('recreateBox', { read: DxTextBoxComponent });
    readonly recreateText = signal<string | undefined>('persisted');
    readonly recreateInstance = dxInstanceSignal(this.recreateBox);

    constructor() {
        // Count focusIn events — demonstrates deriving state from dxEventSignal.
        effect(() => {
            if (this.focusIn() !== undefined) {
                this.focusInCount.update((count) => count + 1);
            }
        });
        // Counts how often the form-data signal actually notifies.
        effect(() => {
            this.person();
            untracked(() => this.personEmits.update((n) => n + 1));
        });
        effect(() => {
            this.gridState();
            untracked(() => this.gridStateEmits.update((n) => n + 1));
        });
        bindDxOption(this.recreateBox, 'value', this.recreateText);
    }

    restoreState(): void {
        const current = this.gridState();
        if (current) {
            this.gridState.set({ ...current, pageIndex: 1 });
        }
    }

    saveState(): void {
        const current = this.gridState();
        if (current) {
            // Persisting a layout means serializing it — localStorage, a
            // profile endpoint, wherever. Round-tripping here keeps the smoke
            // screen honest about that, and it is also what makes the restored
            // object a distinct reference: handing the signal back the very
            // object it already holds is an `Object.is` no-op that would never
            // reach the widget.
            this.savedState.set(JSON.parse(JSON.stringify(current)) as Record<string, unknown>);
        }
    }

    restoreSavedState(): void {
        const saved = this.savedState();
        if (saved !== undefined) {
            this.gridState.set(saved);
        }
    }

    /**
     * Same partial-rejection shape as the TreeView bogus-key button: the
     * chart's `write` silently skips a descriptor matching no point, so the
     * signal can hold a selection the chart never made.
     */
    selectFebAndBogus(): void {
        this.points.set([
            { argument: 'Feb', value: 15, seriesName: undefined },
            { argument: 'Nope', value: 99, seriesName: undefined },
        ]);
    }

    setPerson(): void {
        this.person.set({
            firstName: 'Set',
            lastName: 'FromSignal',
            address: { city: 'Cambridge', zip: 'CB1' },
            hiredOn: new Date('1843-01-01T00:00:00.000Z'),
            tags: ['founder'],
        });
    }

    addOrder(): void {
        this.orders.update((list) => [...list, { id: list.length + 1, customer: 'Umbrella' }]);
    }

    private createRemoteSource(): DataSource<Order, number> {
        const source = new DataSource<Order, number>({
            store: new CustomStore<Order, number>({
                key: 'id',
                loadMode: 'raw',
                load: async () => {
                    this.remoteLoadCount.update((count) => count + 1);
                    const filter = untracked(this.customerFilter).toLowerCase();
                    return untracked(this.orders).filter((order) =>
                        order.customer.toLowerCase().includes(filter),
                    ) as Order[];
                },
            }),
        });
        dxReloadOn(source, [this.customerFilter]);
        return source;
    }
}
