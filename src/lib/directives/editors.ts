import { Directive, inject } from '@angular/core';
import { DxAutocompleteComponent } from 'devextreme-angular/ui/autocomplete';
import { DxCalendarComponent } from 'devextreme-angular/ui/calendar';
import { DxCheckBoxComponent } from 'devextreme-angular/ui/check-box';
import { DxColorBoxComponent } from 'devextreme-angular/ui/color-box';
import { DxDateBoxComponent } from 'devextreme-angular/ui/date-box';
import { DxDateRangeBoxComponent } from 'devextreme-angular/ui/date-range-box';
import { DxDropDownBoxComponent } from 'devextreme-angular/ui/drop-down-box';
import { DxFilterBuilderComponent } from 'devextreme-angular/ui/filter-builder';
import { DxHtmlEditorComponent } from 'devextreme-angular/ui/html-editor';
import { DxLookupComponent } from 'devextreme-angular/ui/lookup';
import { DxNumberBoxComponent } from 'devextreme-angular/ui/number-box';
import { DxRadioGroupComponent } from 'devextreme-angular/ui/radio-group';
import { DxRangeSliderComponent } from 'devextreme-angular/ui/range-slider';
import { DxSelectBoxComponent } from 'devextreme-angular/ui/select-box';
import { DxSliderComponent } from 'devextreme-angular/ui/slider';
import { DxSwitchComponent } from 'devextreme-angular/ui/switch';
import { DxTagBoxComponent } from 'devextreme-angular/ui/tag-box';
import { DxTextAreaComponent } from 'devextreme-angular/ui/text-area';
import { DxTextBoxComponent } from 'devextreme-angular/ui/text-box';
import { DxValueDirectiveBase } from './bases';

/**
 * `[(dxValue)]` adapter directives for all value-holding editors.
 *
 * Where DevExtreme declares a concrete value type it is used as-is; where
 * DevExtreme falls back to `any` (SelectBox, Lookup, RadioGroup, ...) the
 * directive is generic instead, so the value type is inferred from your
 * bound signal and checked end-to-end.
 */

/** A date-like value as accepted by DevExtreme date editors. */
export type DxDateValue = Date | number | string;

/** A date range as held by `dx-date-range-box`. */
export type DxDateRange = readonly [start: DxDateValue | null, end: DxDateValue | null];

/** A numeric range as held by `dx-range-slider`. */
export type DxNumberRange = readonly [start: number, end: number];

/** A filter expression as held by `dx-filter-builder`. */
export type DxFilterExpression =
    | string
    | readonly unknown[]
    | ((...args: never[]) => unknown);

@Directive({ selector: 'dx-text-box[dxValue]', exportAs: 'dxValue' })
export class DxTextBoxValueDirective extends DxValueDirectiveBase<DxTextBoxComponent, string> {
    constructor() {
        super(inject(DxTextBoxComponent, { self: true }), 'value');
    }
}

@Directive({ selector: 'dx-text-area[dxValue]', exportAs: 'dxValue' })
export class DxTextAreaValueDirective extends DxValueDirectiveBase<DxTextAreaComponent, string> {
    constructor() {
        super(inject(DxTextAreaComponent, { self: true }), 'value');
    }
}

@Directive({ selector: 'dx-number-box[dxValue]', exportAs: 'dxValue' })
export class DxNumberBoxValueDirective extends DxValueDirectiveBase<
    DxNumberBoxComponent,
    number | null
> {
    constructor() {
        super(inject(DxNumberBoxComponent, { self: true }), 'value');
    }
}

@Directive({ selector: 'dx-check-box[dxValue]', exportAs: 'dxValue' })
export class DxCheckBoxValueDirective extends DxValueDirectiveBase<
    DxCheckBoxComponent,
    boolean | null
> {
    constructor() {
        super(inject(DxCheckBoxComponent, { self: true }), 'value');
    }
}

@Directive({ selector: 'dx-switch[dxValue]', exportAs: 'dxValue' })
export class DxSwitchValueDirective extends DxValueDirectiveBase<DxSwitchComponent, boolean> {
    constructor() {
        super(inject(DxSwitchComponent, { self: true }), 'value');
    }
}

@Directive({ selector: 'dx-date-box[dxValue]', exportAs: 'dxValue' })
export class DxDateBoxValueDirective extends DxValueDirectiveBase<
    DxDateBoxComponent,
    DxDateValue | null
> {
    constructor() {
        super(inject(DxDateBoxComponent, { self: true }), 'value');
    }
}

@Directive({ selector: 'dx-date-range-box[dxValue]', exportAs: 'dxValue' })
export class DxDateRangeBoxValueDirective extends DxValueDirectiveBase<
    DxDateRangeBoxComponent,
    DxDateRange
> {
    constructor() {
        super(inject(DxDateRangeBoxComponent, { self: true }), 'value');
    }
}

@Directive({ selector: 'dx-calendar[dxValue]', exportAs: 'dxValue' })
export class DxCalendarValueDirective extends DxValueDirectiveBase<
    DxCalendarComponent,
    DxDateValue | readonly DxDateValue[] | null
> {
    constructor() {
        super(inject(DxCalendarComponent, { self: true }), 'value');
    }
}

@Directive({ selector: 'dx-color-box[dxValue]', exportAs: 'dxValue' })
export class DxColorBoxValueDirective extends DxValueDirectiveBase<
    DxColorBoxComponent,
    string | null
> {
    constructor() {
        super(inject(DxColorBoxComponent, { self: true }), 'value');
    }
}

@Directive({ selector: 'dx-autocomplete[dxValue]', exportAs: 'dxValue' })
export class DxAutocompleteValueDirective extends DxValueDirectiveBase<
    DxAutocompleteComponent,
    string | null
> {
    constructor() {
        super(inject(DxAutocompleteComponent, { self: true }), 'value');
    }
}

@Directive({ selector: 'dx-slider[dxValue]', exportAs: 'dxValue' })
export class DxSliderValueDirective extends DxValueDirectiveBase<DxSliderComponent, number> {
    constructor() {
        super(inject(DxSliderComponent, { self: true }), 'value');
    }
}

@Directive({ selector: 'dx-range-slider[dxValue]', exportAs: 'dxValue' })
export class DxRangeSliderValueDirective extends DxValueDirectiveBase<
    DxRangeSliderComponent,
    DxNumberRange
> {
    constructor() {
        super(inject(DxRangeSliderComponent, { self: true }), 'value');
    }
}

@Directive({ selector: 'dx-select-box[dxValue]', exportAs: 'dxValue' })
export class DxSelectBoxValueDirective<TValue = unknown> extends DxValueDirectiveBase<
    DxSelectBoxComponent,
    TValue
> {
    constructor() {
        super(inject(DxSelectBoxComponent, { self: true }), 'value');
    }
}

@Directive({ selector: 'dx-lookup[dxValue]', exportAs: 'dxValue' })
export class DxLookupValueDirective<TValue = unknown> extends DxValueDirectiveBase<
    DxLookupComponent,
    TValue
> {
    constructor() {
        super(inject(DxLookupComponent, { self: true }), 'value');
    }
}

@Directive({ selector: 'dx-drop-down-box[dxValue]', exportAs: 'dxValue' })
export class DxDropDownBoxValueDirective<TValue = unknown> extends DxValueDirectiveBase<
    DxDropDownBoxComponent,
    TValue
> {
    constructor() {
        super(inject(DxDropDownBoxComponent, { self: true }), 'value');
    }
}

@Directive({ selector: 'dx-radio-group[dxValue]', exportAs: 'dxValue' })
export class DxRadioGroupValueDirective<TValue = unknown> extends DxValueDirectiveBase<
    DxRadioGroupComponent,
    TValue
> {
    constructor() {
        super(inject(DxRadioGroupComponent, { self: true }), 'value');
    }
}

@Directive({ selector: 'dx-tag-box[dxValue]', exportAs: 'dxValue' })
export class DxTagBoxValueDirective<TKey = string | number> extends DxValueDirectiveBase<
    DxTagBoxComponent,
    readonly TKey[]
> {
    constructor() {
        super(inject(DxTagBoxComponent, { self: true }), 'value');
    }
}

@Directive({ selector: 'dx-html-editor[dxValue]', exportAs: 'dxValue' })
export class DxHtmlEditorValueDirective extends DxValueDirectiveBase<
    DxHtmlEditorComponent,
    string
> {
    constructor() {
        super(inject(DxHtmlEditorComponent, { self: true }), 'value');
    }
}

@Directive({ selector: 'dx-filter-builder[dxValue]', exportAs: 'dxValue' })
export class DxFilterBuilderValueDirective extends DxValueDirectiveBase<
    DxFilterBuilderComponent,
    DxFilterExpression | null
> {
    constructor() {
        super(inject(DxFilterBuilderComponent, { self: true }), 'value');
    }
}

/** All editor `[(dxValue)]` directives, for convenient bulk import. */
export const DX_VALUE_DIRECTIVES = [
    DxAutocompleteValueDirective,
    DxCalendarValueDirective,
    DxCheckBoxValueDirective,
    DxColorBoxValueDirective,
    DxDateBoxValueDirective,
    DxDateRangeBoxValueDirective,
    DxDropDownBoxValueDirective,
    DxFilterBuilderValueDirective,
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
] as const;
