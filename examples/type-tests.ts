/**
 * Compile-time contract tests for the public type surface. This file is only
 * type-checked (never executed): `npm run typecheck:examples` fails when a
 * positive assertion stops compiling or a `@ts-expect-error` line starts
 * compiling — either indicates a breaking change in the type system.
 */
import { signal } from '@angular/core';
import { DxChartComponent } from 'devextreme-angular/ui/chart';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxFormComponent } from 'devextreme-angular/ui/form';
import { DxPopupComponent } from 'devextreme-angular/ui/popup';
import { DxTextBoxComponent } from 'devextreme-angular/ui/text-box';
import type {
    DxBindingAdapter,
    DxHostEventArg,
    DxHostEventName,
    DxHostOptionName,
    DxHostOptionValue,
    DxHostValue,
    DxInstanceOf,
} from 'ngx-devextreme-zoneless';
import type DataSource from 'devextreme/data/data_source';
import {
    bindDxOption,
    dxArrayStoreSource,
    dxEventSignal,
    dxInstanceSignal,
    dxLoadOptionsParams,
    dxOptionSignal,
    dxReloadOn,
    dxRemoteStore,
    onDxWidgetReady,
} from 'ngx-devextreme-zoneless';
import type { LoadOptions } from 'devextreme/common/data';

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

/* `contentReady` is the post-layout re-read every method-based grid adapter
 * (paging, grid state, search-panel text) depends on, and `searchByText` is
 * the method `[(dxSearchPanelText)]` writes through — neither is checked at
 * its declaration site, so both are pinned here. */
const gridContentReadyEvent: DxHostEventName<Grid> = 'contentReady';
declare const gridInstance_: DxInstanceOf<Grid>;
expectType<(text: string) => void>(gridInstance_.searchByText);
expectType<number>(gridInstance_.pageIndex());

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
