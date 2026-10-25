/**
 * Compile-time contract tests for the public type surface. This file is only
 * type-checked (never executed): `npm run typecheck:examples` fails when a
 * positive assertion stops compiling or a `@ts-expect-error` line starts
 * compiling — either indicates a breaking change in the type system.
 */
import { signal } from '@angular/core';
import { DxCalendarComponent } from 'devextreme-angular/ui/calendar';
import { DxCardViewComponent } from 'devextreme-angular/ui/card-view';
import { DxChartComponent } from 'devextreme-angular/ui/chart';
import { DxChatComponent } from 'devextreme-angular/ui/chat';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxFileManagerComponent } from 'devextreme-angular/ui/file-manager';
import { DxFileUploaderComponent } from 'devextreme-angular/ui/file-uploader';
import { DxFormComponent } from 'devextreme-angular/ui/form';
import { DxPopupComponent } from 'devextreme-angular/ui/popup';
import { DxResizableComponent } from 'devextreme-angular/ui/resizable';
import { DxSchedulerComponent } from 'devextreme-angular/ui/scheduler';
import { DxSplitterComponent } from 'devextreme-angular/ui/splitter';
import { DxFilterBuilderComponent } from 'devextreme-angular/ui/filter-builder';
import { DxLookupComponent } from 'devextreme-angular/ui/lookup';
import { DxTextBoxComponent } from 'devextreme-angular/ui/text-box';
import { DxTreeListComponent } from 'devextreme-angular/ui/tree-list';
import type {
    DxBindingAdapter,
    DxDateRange,
    DxDateValue,
    DxHostComponent,
    DxHostEventArg,
    DxHostEventName,
    DxHostOptionName,
    DxHostOptionValue,
    DxHostValue,
    DxInstanceOf,
    DxNumberRange,
    DxValueDirectiveBase,
    DxChartVisualRange,
    DxChartValueAxisVisualRange,
    DxCalendarZoomLevel,
    DxDataChange,
    DxResizableSize,
    DxGridAxes,
} from 'ngx-devextreme-zoneless';
import type DataSource from 'devextreme/data/data_source';
import {
    bindDxOption,
    dxArrayStoreSource,
    dxEventSignal,
    dxGridColumns,
    dxGridRows,
    dxInstanceSignal,
    dxLoadOptionsParams,
    dxOptionSignal,
    dxReloadOn,
    dxRemoteStore,
    injectDxHost,
    onDxWidgetReady,
    DxOpenedDirectiveBase,
} from 'ngx-devextreme-zoneless';
import type { LoadOptions } from 'devextreme/common/data';
import type { Field, FieldTree } from '@angular/forms/signals';
import type {
    DxAutocompleteFieldStateDirective,
    DxCalendarFieldStateDirective,
    DxCheckBoxFieldStateDirective,
    DxColorBoxFieldStateDirective,
    DxDateBoxFieldStateDirective,
    DxDateRangeBoxFieldStateDirective,
    DxDropDownBoxFieldStateDirective,
    DxFieldStateDirectiveBase,
    DxFileUploaderFieldStateDirective,
    DxHtmlEditorFieldStateDirective,
    DxLookupFieldStateDirective,
    DxNumberBoxFieldStateDirective,
    DxRadioGroupFieldStateDirective,
    DxRangeSliderFieldStateDirective,
    DxSelectBoxFieldStateDirective,
    DxSliderFieldStateDirective,
    DxSwitchFieldStateDirective,
    DxTagBoxFieldStateDirective,
    DxTextAreaFieldStateDirective,
    DxTextBoxFieldStateDirective,
} from 'ngx-devextreme-zoneless/forms';
import type {
    DxAutocompleteValueDirective,
    DxCalendarValueDirective,
    DxCheckBoxValueDirective,
    DxColorBoxValueDirective,
    DxDateBoxValueDirective,
    DxDateRangeBoxValueDirective,
    DxDropDownBoxValueDirective,
    DxFileUploaderValueDirective,
    DxHtmlEditorValueDirective,
    DxLookupValueDirective,
    DxNumberBoxValueDirective,
    DxRadioGroupValueDirective,
    DxRangeSliderValueDirective,
    DxSelectBoxValueDirective,
    DxSliderValueDirective,
    DxSwitchValueDirective,
    DxTagBoxValueDirective,
    DxTextAreaValueDirective,
    DxTextBoxValueDirective,
} from 'ngx-devextreme-zoneless/editors';

declare function expectType<T>(value: T): void;
declare const textBox: DxTextBoxComponent;
declare const popup: DxPopupComponent;
declare const grid: DxDataGridComponent<{ id: number }, number>;

/* ------------------------------------------------------------------------ *
 * Option names are string-literal unions derived from DevExtreme Properties
 * ------------------------------------------------------------------------ */
type TextBoxOption = DxHostOptionName<DxTextBoxComponent>;
const validOption: TextBoxOption = 'placeholder';
// @ts-expect-error — event handler options are excluded from option names
const handlerIsNotAnOption: TextBoxOption = 'onValueChanged';
// @ts-expect-error — unknown options are rejected
const unknownOption: TextBoxOption = 'definitelyNotAnOption';

/* Option value types resolve from the Properties bag. */
expectType<string | undefined>(undefined as DxHostOptionValue<DxTextBoxComponent, 'value'>);
expectType<boolean | undefined>(undefined as DxHostOptionValue<DxPopupComponent, 'visible'>);

/* The editor value helper strips the optionality-`undefined`. */
expectType<string>('' as DxHostValue<DxTextBoxComponent>);

/* ------------------------------------------------------------------------ *
 * Event names / payloads derive from the `onXxx` handler options
 * ------------------------------------------------------------------------ */
type TextBoxEvent = DxHostEventName<DxTextBoxComponent>;
const validEvent: TextBoxEvent = 'valueChanged';
// @ts-expect-error — `onValueChanged` is the handler name, not the event name
const handlerIsNotAnEvent: TextBoxEvent = 'onValueChanged';

type ValueChangedArg = DxHostEventArg<DxTextBoxComponent, 'valueChanged'>;
declare const valueChangedArg: ValueChangedArg;
expectType<unknown>(valueChangedArg.value);
expectType<import('devextreme/ui/text_box').default | undefined>(valueChangedArg.component);

/* ------------------------------------------------------------------------ *
 * Adapter event names are checked against the widget's Properties
 * ------------------------------------------------------------------------ */
type FormInstance = DxInstanceOf<DxFormComponent>;

const formAdapter: DxBindingAdapter<FormInstance, object> = {
    events: ['fieldDataChanged', 'optionChanged'],
    read: () => ({}),
    write: () => void 0,
};

const misspelledAdapter: DxBindingAdapter<FormInstance, object> = {
    // @ts-expect-error — misspelled/renamed event names are rejected
    events: ['feildDataChanged'],
    read: () => ({}),
    write: () => void 0,
};

/* Adapters may opt into the post-write convergence re-read (3.0). */
const convergingAdapter: DxBindingAdapter<FormInstance, object> = {
    events: ['optionChanged'],
    reReadAfterWrite: true,
    read: () => ({}),
    write: () => void 0,
};

/* Positive controls pinning the event names used by generic internal
 * adapters (which cannot be checked at their declaration site): a DevExtreme
 * rename of these names must fail this file. */
const chartSelectionEvent: DxHostEventName<DxChartComponent> = 'pointSelectionChanged';
const chartClickEvent: DxHostEventName<DxChartComponent> = 'pointClick';
const optionChangedEvent: DxHostEventName<DxTextBoxComponent> = 'optionChanged';

/* Grid state options used by the F7 directives stay derivable and typed. */
type Grid = DxDataGridComponent<{ id: number }, number>;
const gridFilterOption: DxHostOptionName<Grid> = 'filterValue';
const gridFocusOption: DxHostOptionName<Grid> = 'focusedRowKey';
expectType<number | undefined>(undefined as DxHostOptionValue<Grid, 'focusedRowKey'>);

/* The summary recompute `[(dxEditingChanges)]` performs after a signal-side
 * write is gated on the widget's own `summary.recalculateWhileEditing`: with it
 * off the grid deliberately keeps pending edits out of its aggregates, so the
 * binding has to stay inert there. Both names are pinned because a vendor
 * rename would not break the gate — it would make it silently always-false,
 * which is the one failure mode a type system can catch here and a test on the
 * default screen cannot. */
const gridSummaryOption: DxHostOptionName<Grid> = 'summary';
expectType<boolean | undefined>(
    (undefined as unknown as NonNullable<DxHostOptionValue<Grid, 'summary'>>)
        .recalculateWhileEditing,
);

/* `[(dxExpandedRowKeys)]` is a plain option binding, so its option name and
 * element type must stay derivable from the TreeList's Properties. It is also
 * the one grid-state binding with no dx-data-grid counterpart: the grid has no
 * such option, which is why the directive is TreeList-only. */
type TreeList = DxTreeListComponent<{ id: number }, number>;
const treeListExpandedOption: DxHostOptionName<TreeList> = 'expandedRowKeys';
expectType<number[] | undefined>(undefined as DxHostOptionValue<TreeList, 'expandedRowKeys'>);
// @ts-expect-error — dx-data-grid has no expandedRowKeys option
const gridExpandedOption: DxHostOptionName<Grid> = 'expandedRowKeys';

/* `contentReady` is the post-layout re-read every method-based grid adapter
 * (paging, grid state, search-panel text) depends on, and `searchByText` is
 * the method `[(dxSearchPanelText)]` writes through — neither is checked at
 * its declaration site, so both are pinned here. */
const gridContentReadyEvent: DxHostEventName<Grid> = 'contentReady';
declare const gridInstance_: DxInstanceOf<Grid>;
expectType<(text: string) => void>(gridInstance_.searchByText);
expectType<number>(gridInstance_.pageIndex());

/* `dxGridRows`/`dxGridColumns` are structural over both grids, so each widget's
 * own Row and Column types are inferred from its own declarations rather than
 * named here — and `dx-card-view` must *not* match: it has `getVisibleCards()`,
 * is not built on grid_core, and has no row or column virtualization. */
declare function acceptsGridAxes<TRow, TColumn>(instance: DxGridAxes<TRow, TColumn>): void;
declare const treeListInstance_: DxInstanceOf<TreeList>;
acceptsGridAxes(gridInstance_);
acceptsGridAxes(treeListInstance_);
// @ts-expect-error — dx-card-view exposes getVisibleCards(), not getVisibleRows()
acceptsGridAxes(cardViewInstance_);
expectType<string | undefined>(dxGridRows(gridInstance_)[0]?.rowType);
expectType<number | undefined>(dxGridRows(gridInstance_)[0]?.key);
expectType<string | undefined>(dxGridColumns(gridInstance_)[0]?.dataField);


/* ------------------------------------------------------------------------ *
 * bindDxOption links option name and signal type
 * ------------------------------------------------------------------------ */
declare function inInjectionContext(fn: () => void): void;

inInjectionContext(() => {
    bindDxOption(textBox, 'value', signal<string | undefined>(''));
    bindDxOption(grid, 'selectedRowKeys', signal<number[] | undefined>([]));

    // @ts-expect-error — 'value' is not an option of dx-popup's widget
    bindDxOption(popup, 'value', signal<string | undefined>(''));

    // @ts-expect-error — a number[] signal cannot bind to the string `value` option
    bindDxOption(textBox, 'value', signal<number[]>([]));

    /* dxOptionSignal returns the option's declared type (+ undefined). */
    expectType<ReturnType<typeof signal<string | undefined>>>(
        dxOptionSignal(textBox, 'placeholder'),
    );

    /* dxEventSignal payloads are typed per event. */
    const focusOut = dxEventSignal(textBox, 'focusOut');
    expectType<FocusEvent | undefined>(focusOut()?.event as FocusEvent | undefined);

    // @ts-expect-error — unknown event names are rejected
    dxEventSignal(textBox, 'notAnEvent');

    /* onDxWidgetReady resolves the concrete widget type and accepts an
     * optional cleanup (fires per widget instance since 2.0). */
    onDxWidgetReady(textBox, (instance) => {
        expectType<import('devextreme/ui/text_box').default>(instance);
        return () => void 0;
    });
    onDxWidgetReady(textBox, () => void 0);

    /* dxInstanceSignal follows getter refs and yields the widget type. */
    const gridInstance = dxInstanceSignal(() => grid);
    expectType<
        import('devextreme/ui/data_grid').default<{ id: number }, number> | undefined
    >(gridInstance());

    /* Data-in helpers: item type flows through; reload targets are flexible. */
    const ordersSource = dxArrayStoreSource(signal<readonly { id: number }[]>([]), {
        key: 'id',
    });
    expectType<DataSource<{ id: number }, unknown>>(ordersSource);
    dxReloadOn(ordersSource, [signal(0), signal('query')]);
    dxReloadOn(() => void 0, [signal(0)]);

    /* Remote store: item and key types flow through load, byKey and the handle. */
    const remote = dxRemoteStore<{ id: number; name: string }, number>({
        key: 'id',
        deps: [signal('search'), signal(0)],
        debounce: 300,
        load: async (options, abortSignal) => {
            expectType<LoadOptions<{ id: number; name: string }>>(options);
            expectType<AbortSignal>(abortSignal);
            return { data: [{ id: 1, name: 'a' }], totalCount: 1 };
        },
        byKey: async (key, abortSignal) => {
            expectType<number>(key);
            expectType<AbortSignal>(abortSignal);
            return { id: key, name: 'a' };
        },
    });
    expectType<DataSource<{ id: number; name: string }, number>>(remote.dataSource);
    expectType<boolean>(remote.isLoading());
    expectType<unknown>(remote.error());
    expectType<Promise<void>>(remote.reload());

    // @ts-expect-error — byKey must resolve the item type
    dxRemoteStore<{ id: number }, number>({ load: async () => [], byKey: async () => 'nope' });
    // @ts-expect-error — deps must be signals
    dxRemoteStore<{ id: number }, number>({ load: async () => [], deps: ['not-a-signal'] });

    /* The loadOptions serializer accepts LoadOptions and yields URLSearchParams. */
    expectType<URLSearchParams>(dxLoadOptionsParams({ skip: 0, take: 10 }));
});

/* ------------------------------------------------------------------------ *
 * Signal Forms seam (`ngx-devextreme-zoneless/forms`)
 * ------------------------------------------------------------------------ */

/* 4.0 bindings. `[(dxOpened)]` is a plain option binding, so the option name
 * is what the type system checks: a widget without `opened` cannot get the
 * directive. Editing state and the chart's visual range are the vendor's own
 * declared shapes, re-exported so a consumer's signal is typed end-to-end. */
class TextBoxOpenedProbe extends DxOpenedDirectiveBase<DxTextBoxComponent> {
    constructor() {
        // @ts-expect-error — a text box declares no `opened` option
        super(textBox, 'opened');
    }
}
declare const change: DxDataChange<{ id: number; customer: string }, number>;
expectType<'insert' | 'update' | 'remove'>(change.type);
expectType<number>(change.key);
expectType<string | undefined>(change.data.customer);
const rangeAsObject: DxChartVisualRange = { startValue: 3, endValue: 6 };
const rangeAsPair: DxChartVisualRange = [3, 6];
// `selectionFilter` is a top-level grid option, so `[(dxSelectionFilter)]` is
// type-checked by name; a filter expression is what it takes.
const selectionFilter: DxHostOptionValue<Grid, 'selectionFilter'> = ['id', '=', 1];

/* 4.0 demand-driven bindings. Each option a shipped directive names is pinned
 * against its widget's `Properties` here, because most of these adapters reach
 * the option through a string or a type parameter and nothing checks the name
 * at the write site — a vendor rename must fail this file, not a consumer. */
type CardView = DxCardViewComponent<{ id: number }, number>;
const cardViewSelectionOption: DxHostOptionName<CardView> = 'selectedCardKeys';
const cardViewFilterOption: DxHostOptionName<CardView> = 'filterValue';
/* The widget class declares `extends Widget<Properties>` without forwarding
 * its own `<TCardData, TKey>` (26.1.4), so the option bag resolves with the
 * defaults and the key type is `unknown` here; `[(dxSelectedCardKeys)]` is
 * generic over the consumer's signal instead, like the grids' selection. */
expectType<unknown[] | undefined>(undefined as DxHostOptionValue<CardView, 'selectedCardKeys'>);
declare const cardViewInstance_: DxInstanceOf<CardView>;
expectType<number>(cardViewInstance_.pageIndex());
expectType<number>(cardViewInstance_.pageSize());
expectType<(text: string) => void>(cardViewInstance_.searchByText);
const cardViewContentReadyEvent: DxHostEventName<CardView> = 'contentReady';
// @ts-expect-error — the card view has no focused-card option; `onFocusedCardChanged` is its only focus surface
const cardViewFocusOption: DxHostOptionName<CardView> = 'focusedCardKey';

const gridFocusedRowIndexOption: DxHostOptionName<Grid> = 'focusedRowIndex';
expectType<number | undefined>(undefined as DxHostOptionValue<Grid, 'focusedRowIndex'>);
const treeListFocusedRowIndexOption: DxHostOptionName<TreeList> = 'focusedRowIndex';
/* `focusedColumnIndex` exists on the widget and is deliberately left to
 * `dxOptionSignal`: its change handler is a no-op marker, so a two-way
 * directive could not honour writes. The pin records that it is a choice. */
const gridFocusedColumnIndexOption: DxHostOptionName<Grid> = 'focusedColumnIndex';

const fileManagerPathOption: DxHostOptionName<DxFileManagerComponent> = 'currentPathKeys';
const fileManagerSelectionOption: DxHostOptionName<DxFileManagerComponent> = 'selectedItemKeys';
const fileManagerFocusOption: DxHostOptionName<DxFileManagerComponent> = 'focusedItemKey';
expectType<string[] | undefined>(undefined as DxHostOptionValue<DxFileManagerComponent, 'currentPathKeys'>);
expectType<string | undefined>(undefined as DxHostOptionValue<DxFileManagerComponent, 'focusedItemKey'>);

expectType<File[] | undefined>(undefined as DxHostOptionValue<DxFileUploaderComponent, 'value'>);
const uploaderIsValidOption: DxHostOptionName<DxFileUploaderComponent> = 'isValid';
const uploaderReadOnlyOption: DxHostOptionName<DxFileUploaderComponent> = 'readOnly';

const calendarZoomOption: DxHostOptionName<DxCalendarComponent> = 'zoomLevel';
const calendarZoom: DxCalendarZoomLevel = 'year';
// @ts-expect-error — the zoom level is a closed union
const calendarZoomBogus: DxCalendarZoomLevel = 'week';

const chatDraftOption: DxHostOptionName<DxChatComponent> = 'inputFieldText';
expectType<string | undefined>(undefined as DxHostOptionValue<DxChatComponent, 'inputFieldText'>);

const resizableWidthOption: DxHostOptionName<DxResizableComponent> = 'width';
const resizableHeightOption: DxHostOptionName<DxResizableComponent> = 'height';
const resizableSize: DxResizableSize = 300;
const resizableCssSize: DxResizableSize = '50%';

/* The splitter adapter's events are checked at its declaration site (the
 * host type is concrete), but the pane shape it reads back is structural, so
 * the item members it depends on are pinned against the vendor's item type. */
type Splitter = DxSplitterComponent<{ text: string }, number>;
const splitterResizeEndEvent: DxHostEventName<Splitter> = 'resizeEnd';
const splitterCollapsedEvent: DxHostEventName<Splitter> = 'itemCollapsed';
declare const splitterItem: import('devextreme/ui/splitter').Item;
expectType<number | string | undefined>(splitterItem.size);
expectType<boolean | undefined>(splitterItem.collapsed);

const valueAxisRange: DxChartValueAxisVisualRange = { startValue: 0, endValue: 5 };
const valueAxisPair: DxChartValueAxisVisualRange = [0, 5];

/* The scheduler's `selectedCellData` is an option the widget writes but
 * ignores on the way in (its workspace's change handler is a no-op), so it
 * has no two-way directive; the composition API is the route, and this pin
 * keeps that route typed. */
const schedulerSelectedCellsOption: DxHostOptionName<DxSchedulerComponent> = 'selectedCellData';

declare const uploaderValueDirective: DxFileUploaderValueDirective;
expectType<readonly File[]>(uploaderValueDirective.dxValue());

/* `injectDxHost` hands the current element's host back as whatever host type
 * the caller names — the directive's selector is the guarantee, not the type
 * system — and rejects a type that is not a devextreme-angular host at all. It
 * exists so the shipped directives can keep their wrapper classes as type-only
 * imports; the value import is what `npm run probe` forbids. */
const hostByType: DxTextBoxComponent = injectDxHost<DxTextBoxComponent>();
const hostWidget: DxInstanceOf<DxTextBoxComponent> = hostByType.instance;
// @ts-expect-error — `string` is not a host component
injectDxHost<string>();

/* `DxFieldStateDirectiveBase` reaches these five options through a type
 * parameter, so the write site casts and nothing checks the names there. A
 * vendor rename of any of them must fail this file instead of shipping. */
const editorReadOnlyOption: DxHostOptionName<DxTextBoxComponent> = 'readOnly';
const editorVisibleOption: DxHostOptionName<DxTextBoxComponent> = 'visible';
const editorIsValidOption: DxHostOptionName<DxTextBoxComponent> = 'isValid';
const editorValidationStatusOption: DxHostOptionName<DxTextBoxComponent> = 'validationStatus';
const editorValidationErrorsOption: DxHostOptionName<DxTextBoxComponent> = 'validationErrors';

/* The directive writes widget options rather than the wrapper's `@Input()`s
 * because `DxLookupComponent`'s generated wrapper omits `readOnly` while the
 * widget itself inherits it from `EditorOptions`. This pin is what keeps that
 * route honest: it asserts the option exists on the *widget*, which is what the
 * write actually targets. */
const lookupReadOnlyOption: DxHostOptionName<DxLookupComponent> = 'readOnly';

/* dx-filter-builder is excluded from the family because it extends
 * `WidgetOptions`, not `EditorOptions`, and carries none of this surface. If a
 * vendor release gives it one, this line starts compiling and the family should
 * grow to include it. */
// @ts-expect-error — dx-filter-builder is not an Editor and has no isValid
const filterBuilderIsValidOption: DxHostOptionName<DxFilterBuilderComponent> = 'isValid';

/* No editor declares a `required` option — the gap is documented, not silently
 * unimplemented. This line failing to error means DevExtreme grew one and the
 * directive should start writing it. */
// @ts-expect-error — no DevExtreme editor has a `required` option
const editorRequiredOption: DxHostOptionName<DxTextBoxComponent> = 'required';

/* The point of the seam: the field type is checked here even though
 * `[formField]` had to be cast with `$any()` on this family. */
declare const textBoxFieldState: DxTextBoxFieldStateDirective;
expectType<Field<string>>(textBoxFieldState.dxFieldState());
expectType<'touched' | 'always'>(textBoxFieldState.dxFieldStateShowErrors());

declare const numberBoxFieldState: DxNumberBoxFieldStateDirective;
expectType<Field<number | null>>(numberBoxFieldState.dxFieldState());

declare const stringField: Field<string>;
// @ts-expect-error — a string field cannot drive a number box
expectType<Field<number | null>>(stringField);

/* ------------------------------------------------------------------------ *
 * Field variance (measured against TS 6.0 / Angular 22.1)
 * ------------------------------------------------------------------------ */

/* `Field<T>` is `() => FieldState<T>` and `FieldState` holds a
 * `WritableSignal<T>`, which would make it invariant — except `set` is
 * declared method-style, and methods are checked bivariantly. That bivariance
 * is what lets a consumer's realistic field types bind to the directives'
 * declared value types at all: a `Date | null` field into the date box's
 * `DxDateValue | null`, a mutable `number[]` into the tag box's readonly
 * array, a mutable tuple into the range slider's readonly one. No smoke
 * screen compiles any of these combinations, so they are pinned here: a
 * TypeScript or Angular change that tightens the variance would break every
 * date/tag/range consumer, and must break this file first. */
declare const consumerDateField: FieldTree<Date | null>;
expectType<Field<DxDateValue | null>>(consumerDateField);
declare const consumerCalendarField: FieldTree<Date | null>;
expectType<Field<DxDateValue | readonly DxDateValue[] | null>>(consumerCalendarField);
declare const consumerTagsField: FieldTree<number[]>;
expectType<Field<readonly number[]>>(consumerTagsField);
declare const consumerRangeField: FieldTree<[number, number]>;
expectType<Field<DxNumberRange>>(consumerRangeField);
declare const consumerDateRangeField: FieldTree<[Date | null, Date | null]>;
expectType<Field<DxDateRange>>(consumerDateRangeField);
/* The ISO-string model shape: `dateSerializationFormat` keeps the widget's
 * value option a string, so a NodaTime-style `string | null` field is a
 * first-class citizen of the date box. The forms smoke screen compiles this
 * combination too; the pin keeps it independent of that screen surviving. */
declare const consumerIsoDateField: FieldTree<string | null>;
expectType<Field<DxDateValue | null>>(consumerIsoDateField);

/* ------------------------------------------------------------------------ *
 * [(dxValue)] and [dxFieldState] declare the same value type per family
 * ------------------------------------------------------------------------ */

/* Both families promise "the family's real value type", and each states it in
 * its own file — nothing but a comment kept them in step. These lines are the
 * enforcement: each pair stops compiling when the two drift. `Equals` is the
 * exact-type check; mutual assignability would wave through `any` and unions
 * absorbing each other. */
type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type DxValueTypeOf<D> = D extends DxValueDirectiveBase<DxHostComponent, infer V> ? V : never;
type DxFieldValueTypeOf<D> =
    D extends DxFieldStateDirectiveBase<DxHostComponent, infer V> ? V : never;
type SameValueType<TFieldState, TValueDirective> = Equals<
    DxFieldValueTypeOf<TFieldState>,
    DxValueTypeOf<TValueDirective>
>;

const autocompleteAgrees: SameValueType<
    DxAutocompleteFieldStateDirective,
    DxAutocompleteValueDirective
> = true;
const calendarAgrees: SameValueType<DxCalendarFieldStateDirective, DxCalendarValueDirective> = true;
const checkBoxAgrees: SameValueType<DxCheckBoxFieldStateDirective, DxCheckBoxValueDirective> = true;
const colorBoxAgrees: SameValueType<DxColorBoxFieldStateDirective, DxColorBoxValueDirective> = true;
const dateBoxAgrees: SameValueType<DxDateBoxFieldStateDirective, DxDateBoxValueDirective> = true;
const dateRangeBoxAgrees: SameValueType<
    DxDateRangeBoxFieldStateDirective,
    DxDateRangeBoxValueDirective
> = true;
const dropDownBoxAgrees: SameValueType<
    DxDropDownBoxFieldStateDirective,
    DxDropDownBoxValueDirective
> = true;
const fileUploaderAgrees: SameValueType<
    DxFileUploaderFieldStateDirective,
    DxFileUploaderValueDirective
> = true;
const htmlEditorAgrees: SameValueType<
    DxHtmlEditorFieldStateDirective,
    DxHtmlEditorValueDirective
> = true;
const lookupAgrees: SameValueType<DxLookupFieldStateDirective, DxLookupValueDirective> = true;
const numberBoxAgrees: SameValueType<
    DxNumberBoxFieldStateDirective,
    DxNumberBoxValueDirective
> = true;
const radioGroupAgrees: SameValueType<
    DxRadioGroupFieldStateDirective,
    DxRadioGroupValueDirective
> = true;
const rangeSliderAgrees: SameValueType<
    DxRangeSliderFieldStateDirective,
    DxRangeSliderValueDirective
> = true;
const selectBoxAgrees: SameValueType<
    DxSelectBoxFieldStateDirective,
    DxSelectBoxValueDirective
> = true;
const sliderAgrees: SameValueType<DxSliderFieldStateDirective, DxSliderValueDirective> = true;
const switchAgrees: SameValueType<DxSwitchFieldStateDirective, DxSwitchValueDirective> = true;
const tagBoxAgrees: SameValueType<DxTagBoxFieldStateDirective, DxTagBoxValueDirective> = true;
const textAreaAgrees: SameValueType<DxTextAreaFieldStateDirective, DxTextAreaValueDirective> = true;
const textBoxAgrees: SameValueType<DxTextBoxFieldStateDirective, DxTextBoxValueDirective> = true;
