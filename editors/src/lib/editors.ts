import { Directive } from '@angular/core';
import type { DxAutocompleteComponent } from 'devextreme-angular/ui/autocomplete';
import type { DxCalendarComponent } from 'devextreme-angular/ui/calendar';
import type { DxCheckBoxComponent } from 'devextreme-angular/ui/check-box';
import type { DxColorBoxComponent } from 'devextreme-angular/ui/color-box';
import type { DxDateBoxComponent } from 'devextreme-angular/ui/date-box';
import type { DxDateRangeBoxComponent } from 'devextreme-angular/ui/date-range-box';
import type { DxDropDownBoxComponent } from 'devextreme-angular/ui/drop-down-box';
import type { DxFilterBuilderComponent } from 'devextreme-angular/ui/filter-builder';
import type { DxHtmlEditorComponent } from 'devextreme-angular/ui/html-editor';
import type { DxLookupComponent } from 'devextreme-angular/ui/lookup';
import type { DxNumberBoxComponent } from 'devextreme-angular/ui/number-box';
import type { DxRadioGroupComponent } from 'devextreme-angular/ui/radio-group';
import type { DxRangeSliderComponent } from 'devextreme-angular/ui/range-slider';
import type { DxSelectBoxComponent } from 'devextreme-angular/ui/select-box';
import type { DxSliderComponent } from 'devextreme-angular/ui/slider';
import type { DxSwitchComponent } from 'devextreme-angular/ui/switch';
import type { DxTagBoxComponent } from 'devextreme-angular/ui/tag-box';
import type { DxTextAreaComponent } from 'devextreme-angular/ui/text-area';
import type { DxTextBoxComponent } from 'devextreme-angular/ui/text-box';
import {
    DxOpenedDirectiveBase,
    DxValueDirectiveBase,
    injectDxHost,
    type DxDateRange,
    type DxDateValue,
    type DxFilterExpression,
    type DxNumberRange,
} from 'ngx-devextreme-zoneless/core';

/**
 * `[(dxValue)]` adapter directives for all value-holding editors.
 *
 * Where DevExtreme declares a concrete value type it is used as-is; where
 * DevExtreme falls back to `any` (SelectBox, Lookup, RadioGroup, ...) the
 * directive is generic instead, so the value type is inferred from your
 * bound signal and checked end-to-end.
 */

@Directive({ selector: 'dx-text-box[dxValue]', exportAs: 'dxValue' })
export class DxTextBoxValueDirective extends DxValueDirectiveBase<DxTextBoxComponent, string> {
    constructor() {
        super(injectDxHost<DxTextBoxComponent>(), 'value');
    }
}

@Directive({ selector: 'dx-text-area[dxValue]', exportAs: 'dxValue' })
export class DxTextAreaValueDirective extends DxValueDirectiveBase<DxTextAreaComponent, string> {
    constructor() {
        super(injectDxHost<DxTextAreaComponent>(), 'value');
    }
}

@Directive({ selector: 'dx-number-box[dxValue]', exportAs: 'dxValue' })
export class DxNumberBoxValueDirective extends DxValueDirectiveBase<
    DxNumberBoxComponent,
    number | null
> {
    constructor() {
        super(injectDxHost<DxNumberBoxComponent>(), 'value');
    }
}

@Directive({ selector: 'dx-check-box[dxValue]', exportAs: 'dxValue' })
export class DxCheckBoxValueDirective extends DxValueDirectiveBase<
    DxCheckBoxComponent,
    boolean | null
> {
    constructor() {
        super(injectDxHost<DxCheckBoxComponent>(), 'value');
    }
}

@Directive({ selector: 'dx-switch[dxValue]', exportAs: 'dxValue' })
export class DxSwitchValueDirective extends DxValueDirectiveBase<DxSwitchComponent, boolean> {
    constructor() {
        super(injectDxHost<DxSwitchComponent>(), 'value');
    }
}

@Directive({ selector: 'dx-date-box[dxValue]', exportAs: 'dxValue' })
export class DxDateBoxValueDirective extends DxValueDirectiveBase<
    DxDateBoxComponent,
    DxDateValue | null
> {
    constructor() {
        super(injectDxHost<DxDateBoxComponent>(), 'value');
    }
}

@Directive({ selector: 'dx-date-range-box[dxValue]', exportAs: 'dxValue' })
export class DxDateRangeBoxValueDirective extends DxValueDirectiveBase<
    DxDateRangeBoxComponent,
    DxDateRange
> {
    constructor() {
        super(injectDxHost<DxDateRangeBoxComponent>(), 'value');
    }
}

@Directive({ selector: 'dx-calendar[dxValue]', exportAs: 'dxValue' })
export class DxCalendarValueDirective extends DxValueDirectiveBase<
    DxCalendarComponent,
    DxDateValue | readonly DxDateValue[] | null
> {
    constructor() {
        super(injectDxHost<DxCalendarComponent>(), 'value');
    }
}

@Directive({ selector: 'dx-color-box[dxValue]', exportAs: 'dxValue' })
export class DxColorBoxValueDirective extends DxValueDirectiveBase<
    DxColorBoxComponent,
    string | null
> {
    constructor() {
        super(injectDxHost<DxColorBoxComponent>(), 'value');
    }
}

@Directive({ selector: 'dx-autocomplete[dxValue]', exportAs: 'dxValue' })
export class DxAutocompleteValueDirective extends DxValueDirectiveBase<
    DxAutocompleteComponent,
    string | null
> {
    constructor() {
        super(injectDxHost<DxAutocompleteComponent>(), 'value');
    }
}

@Directive({ selector: 'dx-slider[dxValue]', exportAs: 'dxValue' })
export class DxSliderValueDirective extends DxValueDirectiveBase<DxSliderComponent, number> {
    constructor() {
        super(injectDxHost<DxSliderComponent>(), 'value');
    }
}

@Directive({ selector: 'dx-range-slider[dxValue]', exportAs: 'dxValue' })
export class DxRangeSliderValueDirective extends DxValueDirectiveBase<
    DxRangeSliderComponent,
    DxNumberRange
> {
    constructor() {
        super(injectDxHost<DxRangeSliderComponent>(), 'value');
    }
}

@Directive({ selector: 'dx-select-box[dxValue]', exportAs: 'dxValue' })
export class DxSelectBoxValueDirective<TValue = unknown> extends DxValueDirectiveBase<
    DxSelectBoxComponent,
    TValue
> {
    constructor() {
        super(injectDxHost<DxSelectBoxComponent>(), 'value');
    }
}

@Directive({ selector: 'dx-lookup[dxValue]', exportAs: 'dxValue' })
export class DxLookupValueDirective<TValue = unknown> extends DxValueDirectiveBase<
    DxLookupComponent,
    TValue
> {
    constructor() {
        super(injectDxHost<DxLookupComponent>(), 'value');
    }
}

@Directive({ selector: 'dx-drop-down-box[dxValue]', exportAs: 'dxValue' })
export class DxDropDownBoxValueDirective<TValue = unknown> extends DxValueDirectiveBase<
    DxDropDownBoxComponent,
    TValue
> {
    constructor() {
        super(injectDxHost<DxDropDownBoxComponent>(), 'value');
    }
}

@Directive({ selector: 'dx-radio-group[dxValue]', exportAs: 'dxValue' })
export class DxRadioGroupValueDirective<TValue = unknown> extends DxValueDirectiveBase<
    DxRadioGroupComponent,
    TValue
> {
    constructor() {
        super(injectDxHost<DxRadioGroupComponent>(), 'value');
    }
}

@Directive({ selector: 'dx-tag-box[dxValue]', exportAs: 'dxValue' })
export class DxTagBoxValueDirective<TKey = string | number> extends DxValueDirectiveBase<
    DxTagBoxComponent,
    readonly TKey[]
> {
    constructor() {
        super(injectDxHost<DxTagBoxComponent>(), 'value');
    }
}

@Directive({ selector: 'dx-html-editor[dxValue]', exportAs: 'dxValue' })
export class DxHtmlEditorValueDirective extends DxValueDirectiveBase<
    DxHtmlEditorComponent,
    string
> {
    constructor() {
        super(injectDxHost<DxHtmlEditorComponent>(), 'value');
    }
}

@Directive({ selector: 'dx-filter-builder[dxValue]', exportAs: 'dxValue' })
export class DxFilterBuilderValueDirective extends DxValueDirectiveBase<
    DxFilterBuilderComponent,
    DxFilterExpression | null
> {
    constructor() {
        super(injectDxHost<DxFilterBuilderComponent>(), 'value');
    }
}

/**
 * `[(dxOpened)]` adapter directives for the drop-down editors — the popup's
 * open state on a signal, so it can be driven from outside and every way it
 * closes (outside click, escape, item pick, tab-out) is observed. The widget
 * writes `opened` through its regular option setter on every user toggle
 * (`_toggleOpenState` → `option('opened', …)`, verified against 26.1.4), so
 * this is a plain option binding with no re-read.
 */

@Directive({ selector: 'dx-select-box[dxOpened]', exportAs: 'dxOpened' })
export class DxSelectBoxOpenedDirective extends DxOpenedDirectiveBase<DxSelectBoxComponent> {
    constructor() {
        super(injectDxHost<DxSelectBoxComponent>(), 'opened');
    }
}

@Directive({ selector: 'dx-lookup[dxOpened]', exportAs: 'dxOpened' })
export class DxLookupOpenedDirective extends DxOpenedDirectiveBase<DxLookupComponent> {
    constructor() {
        super(injectDxHost<DxLookupComponent>(), 'opened');
    }
}

@Directive({ selector: 'dx-date-box[dxOpened]', exportAs: 'dxOpened' })
export class DxDateBoxOpenedDirective extends DxOpenedDirectiveBase<DxDateBoxComponent> {
    constructor() {
        super(injectDxHost<DxDateBoxComponent>(), 'opened');
    }
}

@Directive({ selector: 'dx-date-range-box[dxOpened]', exportAs: 'dxOpened' })
export class DxDateRangeBoxOpenedDirective extends DxOpenedDirectiveBase<DxDateRangeBoxComponent> {
    constructor() {
        super(injectDxHost<DxDateRangeBoxComponent>(), 'opened');
    }
}

@Directive({ selector: 'dx-tag-box[dxOpened]', exportAs: 'dxOpened' })
export class DxTagBoxOpenedDirective extends DxOpenedDirectiveBase<DxTagBoxComponent> {
    constructor() {
        super(injectDxHost<DxTagBoxComponent>(), 'opened');
    }
}

@Directive({ selector: 'dx-drop-down-box[dxOpened]', exportAs: 'dxOpened' })
export class DxDropDownBoxOpenedDirective extends DxOpenedDirectiveBase<DxDropDownBoxComponent> {
    constructor() {
        super(injectDxHost<DxDropDownBoxComponent>(), 'opened');
    }
}

@Directive({ selector: 'dx-autocomplete[dxOpened]', exportAs: 'dxOpened' })
export class DxAutocompleteOpenedDirective extends DxOpenedDirectiveBase<DxAutocompleteComponent> {
    constructor() {
        super(injectDxHost<DxAutocompleteComponent>(), 'opened');
    }
}

@Directive({ selector: 'dx-color-box[dxOpened]', exportAs: 'dxOpened' })
export class DxColorBoxOpenedDirective extends DxOpenedDirectiveBase<DxColorBoxComponent> {
    constructor() {
        super(injectDxHost<DxColorBoxComponent>(), 'opened');
    }
}

/** All drop-down editor `[(dxOpened)]` directives, for convenient bulk import. */
export const DX_OPENED_DIRECTIVES = [
    DxAutocompleteOpenedDirective,
    DxColorBoxOpenedDirective,
    DxDateBoxOpenedDirective,
    DxDateRangeBoxOpenedDirective,
    DxDropDownBoxOpenedDirective,
    DxLookupOpenedDirective,
    DxSelectBoxOpenedDirective,
    DxTagBoxOpenedDirective,
] as const;

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
