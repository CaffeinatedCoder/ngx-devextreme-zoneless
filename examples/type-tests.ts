/**
 * Compile-time contract tests for the public type surface. This file is only
 * type-checked (never executed): `npm run typecheck:examples` fails when a
 * positive assertion stops compiling or a `@ts-expect-error` line starts
 * compiling — either indicates a breaking change in the type system.
 */
import { signal } from '@angular/core';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxPopupComponent } from 'devextreme-angular/ui/popup';
import { DxTextBoxComponent } from 'devextreme-angular/ui/text-box';
import type {
    DxHostEventArg,
    DxHostEventName,
    DxHostOptionName,
    DxHostOptionValue,
    DxHostValue,
} from 'ngx-devextreme-zoneless';
import { bindDxOption, dxEventSignal, dxOptionSignal } from 'ngx-devextreme-zoneless';

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
});
