import { Component, signal } from '@angular/core';
import { DxAutocompleteModule } from 'devextreme-angular/ui/autocomplete';
import { DxCalendarModule } from 'devextreme-angular/ui/calendar';
import { DxCheckBoxModule } from 'devextreme-angular/ui/check-box';
import { DxColorBoxModule } from 'devextreme-angular/ui/color-box';
import { DxDateBoxModule } from 'devextreme-angular/ui/date-box';
import { DxDateRangeBoxModule } from 'devextreme-angular/ui/date-range-box';
import { DxDropDownBoxModule } from 'devextreme-angular/ui/drop-down-box';
import { DxFileUploaderModule } from 'devextreme-angular/ui/file-uploader';
import { DxHtmlEditorModule } from 'devextreme-angular/ui/html-editor';
import { DxLookupModule } from 'devextreme-angular/ui/lookup';
import { DxNumberBoxModule } from 'devextreme-angular/ui/number-box';
import { DxRadioGroupModule } from 'devextreme-angular/ui/radio-group';
import { DxRangeSliderModule } from 'devextreme-angular/ui/range-slider';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import { DxSliderModule } from 'devextreme-angular/ui/slider';
import { DxSwitchModule } from 'devextreme-angular/ui/switch';
import { DxTagBoxModule } from 'devextreme-angular/ui/tag-box';
import { DxTextAreaModule } from 'devextreme-angular/ui/text-area';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import { form, readonly as readonlyRule, validate } from '@angular/forms/signals';
import { DX_FIELD_STATE_DIRECTIVES } from 'ngx-devextreme-zoneless/forms';

interface Everything {
    text: string;
    area: string;
    num: number | null;
    check: boolean | null;
    on: boolean;
    date: Date | null;
    dateRange: [Date | null, Date | null];
    calendar: Date | null;
    color: string | null;
    auto: string | null;
    slider: number;
    range: [number, number];
    select: string | null;
    lookup: string | null;
    ddbox: number | null;
    radio: string | null;
    tags: number[];
    html: string;
    files: File[];
}

/*
 * `[dxFieldState]` coverage, served at `/forms-coverage` and driven by
 * e2e/forms-coverage.spec.ts: every editor family the directive supports,
 * each presenting a field that is always invalid, with a switch that turns
 * every field read-only. The directive is one-way by design — field state
 * into the widget's own validation UI — so each widget proves the two
 * states that have a visible DOM outcome: `invalid` and `readonly`. The
 * value binding (`[formField]`) is deliberately absent; forms.component.ts
 * certifies that path, and this screen isolates what the directive adds.
 */
@Component({
    selector: 'app-forms-coverage',
    imports: [
        DxAutocompleteModule,
        DxCalendarModule,
        DxCheckBoxModule,
        DxColorBoxModule,
        DxDateBoxModule,
        DxDateRangeBoxModule,
        DxDropDownBoxModule,
        DxFileUploaderModule,
        DxHtmlEditorModule,
        DxLookupModule,
        DxNumberBoxModule,
        DxRadioGroupModule,
        DxRangeSliderModule,
        DxSelectBoxModule,
        DxSliderModule,
        DxSwitchModule,
        DxTagBoxModule,
        DxTextAreaModule,
        DxTextBoxModule,
        DX_FIELD_STATE_DIRECTIVES,
    ],
    template: `
        <div class="row">
            <button data-testid="fc-readonly-toggle" (click)="readonlyAll.set(!readonlyAll())">toggle read-only</button>
            <span class="readout" data-testid="fc-readonly-readout">{{ readonlyAll() }}</span>
        </div>
        <div class="grid">
            <dx-text-box id="fc-text-box" [dxFieldState]="everything.text" dxFieldStateShowErrors="always" />
            <dx-text-area id="fc-text-area" [dxFieldState]="everything.area" dxFieldStateShowErrors="always" />
            <dx-number-box id="fc-number-box" [dxFieldState]="everything.num" dxFieldStateShowErrors="always" />
            <dx-check-box id="fc-check-box" [dxFieldState]="everything.check" dxFieldStateShowErrors="always" text="check" />
            <dx-switch id="fc-switch" [dxFieldState]="everything.on" dxFieldStateShowErrors="always" />
            <dx-date-box id="fc-date-box" [dxFieldState]="everything.date" dxFieldStateShowErrors="always" />
            <dx-date-range-box id="fc-date-range-box" [dxFieldState]="everything.dateRange" dxFieldStateShowErrors="always" />
            <dx-calendar id="fc-calendar" [dxFieldState]="everything.calendar" dxFieldStateShowErrors="always" />
            <dx-color-box id="fc-color-box" [dxFieldState]="everything.color" dxFieldStateShowErrors="always" />
            <dx-autocomplete id="fc-autocomplete" [dxFieldState]="everything.auto" dxFieldStateShowErrors="always" [items]="['a']" />
            <dx-slider id="fc-slider" [dxFieldState]="everything.slider" dxFieldStateShowErrors="always" [min]="0" [max]="10" />
            <dx-range-slider id="fc-range-slider" [dxFieldState]="everything.range" dxFieldStateShowErrors="always" [min]="0" [max]="10" />
            <dx-select-box id="fc-select-box" [dxFieldState]="everything.select" dxFieldStateShowErrors="always" [items]="statuses" />
            <dx-lookup id="fc-lookup" [dxFieldState]="everything.lookup" dxFieldStateShowErrors="always" [items]="statuses" />
            <dx-drop-down-box id="fc-drop-down-box" [dxFieldState]="everything.ddbox" dxFieldStateShowErrors="always" [items]="[1, 2]" />
            <dx-radio-group id="fc-radio-group" [dxFieldState]="everything.radio" dxFieldStateShowErrors="always" [items]="statuses" />
            <dx-tag-box id="fc-tag-box" [dxFieldState]="everything.tags" dxFieldStateShowErrors="always" [items]="[1, 2, 3]" />
            <dx-html-editor id="fc-html-editor" [dxFieldState]="everything.html" dxFieldStateShowErrors="always" [height]="80" />
            <dx-file-uploader id="fc-file-uploader" [dxFieldState]="everything.files" dxFieldStateShowErrors="always" uploadMode="useForm" />
        </div>
    `,
    styles: `
        .row { display: flex; align-items: center; gap: 12px; margin: 6px 0; }
        .readout { font-family: monospace; padding: 2px 6px; background: #f3f3f3; }
        .grid { display: grid; grid-template-columns: repeat(3, 260px); gap: 12px; align-items: start; }
    `,
})
export class FormsCoverageComponent {
    readonly statuses = ['Pending', 'Shipped', 'Delivered'];
    readonly readonlyAll = signal(false);

    private readonly model = signal<Everything>({
        text: '',
        area: '',
        num: null,
        check: null,
        on: false,
        date: null,
        dateRange: [null, null],
        calendar: null,
        color: null,
        auto: null,
        slider: 0,
        range: [2, 5],
        select: null,
        lookup: null,
        ddbox: null,
        radio: null,
        tags: [],
        html: '',
        files: [],
    });

    protected readonly everything = form(this.model, (p) => {
        // Always invalid, whatever the value: the directive's job is to present
        // the state, and an unconditional error keeps the assertion independent
        // of every editor's notion of "empty". Read-only follows the switch.
        const always = (): { kind: string; message: string } => ({ kind: 'always', message: 'Always wrong' });
        const whenReadonly = { when: () => this.readonlyAll() };
        validate(p.text, always);
        readonlyRule(p.text, whenReadonly);
        validate(p.area, always);
        readonlyRule(p.area, whenReadonly);
        validate(p.num, always);
        readonlyRule(p.num, whenReadonly);
        validate(p.check, always);
        readonlyRule(p.check, whenReadonly);
        validate(p.on, always);
        readonlyRule(p.on, whenReadonly);
        validate(p.date, always);
        readonlyRule(p.date, whenReadonly);
        validate(p.dateRange, always);
        readonlyRule(p.dateRange, whenReadonly);
        validate(p.calendar, always);
        readonlyRule(p.calendar, whenReadonly);
        validate(p.color, always);
        readonlyRule(p.color, whenReadonly);
        validate(p.auto, always);
        readonlyRule(p.auto, whenReadonly);
        validate(p.slider, always);
        readonlyRule(p.slider, whenReadonly);
        validate(p.range, always);
        readonlyRule(p.range, whenReadonly);
        validate(p.select, always);
        readonlyRule(p.select, whenReadonly);
        validate(p.lookup, always);
        readonlyRule(p.lookup, whenReadonly);
        validate(p.ddbox, always);
        readonlyRule(p.ddbox, whenReadonly);
        validate(p.radio, always);
        readonlyRule(p.radio, whenReadonly);
        validate(p.tags, always);
        readonlyRule(p.tags, whenReadonly);
        validate(p.html, always);
        readonlyRule(p.html, whenReadonly);
        validate(p.files, always);
        readonlyRule(p.files, whenReadonly);
    });
}
