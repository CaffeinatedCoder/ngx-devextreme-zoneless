import { Directive } from '@angular/core';
import { DxAutocompleteComponent } from 'devextreme-angular/ui/autocomplete';
import { DxCalendarComponent } from 'devextreme-angular/ui/calendar';
import { DxCheckBoxComponent } from 'devextreme-angular/ui/check-box';
import { DxColorBoxComponent } from 'devextreme-angular/ui/color-box';
import { DxDateBoxComponent } from 'devextreme-angular/ui/date-box';
import { DxDateRangeBoxComponent } from 'devextreme-angular/ui/date-range-box';
import { DxDropDownBoxComponent } from 'devextreme-angular/ui/drop-down-box';
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
import type {
    DxDateRange,
    DxDateValue,
    DxNumberRange,
} from 'ngx-devextreme-zoneless/core';
import { DxFieldStateDirectiveBase } from './base';

/**
 * `[dxFieldState]` adapter directives for every editor that carries the
 * `Editor` base's validation surface.
 *
 * `dx-filter-builder` is deliberately absent: it extends `WidgetOptions`
 * rather than `EditorOptions` and has no `isValid` / `validationErrors` /
 * `readOnly` to write to (verified against 26.1.4).
 *
 * Value types match the `[(dxValue)]` family exactly, so the same mismatch is
 * a compile error in both — enforced by the `SameValueType` pins in
 * `examples/type-tests.ts`, which stop compiling when the families drift.
 */

@Directive({ selector: 'dx-text-box[dxFieldState]', exportAs: 'dxFieldState' })
export class DxTextBoxFieldStateDirective extends DxFieldStateDirectiveBase<
    DxTextBoxComponent,
    string
> {
    constructor() {
        super(DxTextBoxComponent);
    }
}

@Directive({ selector: 'dx-text-area[dxFieldState]', exportAs: 'dxFieldState' })
export class DxTextAreaFieldStateDirective extends DxFieldStateDirectiveBase<
    DxTextAreaComponent,
    string
> {
    constructor() {
        super(DxTextAreaComponent);
    }
}

@Directive({ selector: 'dx-number-box[dxFieldState]', exportAs: 'dxFieldState' })
export class DxNumberBoxFieldStateDirective extends DxFieldStateDirectiveBase<
    DxNumberBoxComponent,
    number | null
> {
    constructor() {
        super(DxNumberBoxComponent);
    }
}

@Directive({ selector: 'dx-check-box[dxFieldState]', exportAs: 'dxFieldState' })
export class DxCheckBoxFieldStateDirective extends DxFieldStateDirectiveBase<
    DxCheckBoxComponent,
    boolean | null
> {
    constructor() {
        super(DxCheckBoxComponent);
    }
}

@Directive({ selector: 'dx-switch[dxFieldState]', exportAs: 'dxFieldState' })
export class DxSwitchFieldStateDirective extends DxFieldStateDirectiveBase<
    DxSwitchComponent,
    boolean
> {
    constructor() {
        super(DxSwitchComponent);
    }
}

@Directive({ selector: 'dx-date-box[dxFieldState]', exportAs: 'dxFieldState' })
export class DxDateBoxFieldStateDirective extends DxFieldStateDirectiveBase<
    DxDateBoxComponent,
    DxDateValue | null
> {
    constructor() {
        super(DxDateBoxComponent);
    }
}

@Directive({ selector: 'dx-date-range-box[dxFieldState]', exportAs: 'dxFieldState' })
export class DxDateRangeBoxFieldStateDirective extends DxFieldStateDirectiveBase<
    DxDateRangeBoxComponent,
    DxDateRange
> {
    constructor() {
        super(DxDateRangeBoxComponent);
    }
}

@Directive({ selector: 'dx-calendar[dxFieldState]', exportAs: 'dxFieldState' })
export class DxCalendarFieldStateDirective extends DxFieldStateDirectiveBase<
    DxCalendarComponent,
    DxDateValue | readonly DxDateValue[] | null
> {
    constructor() {
        super(DxCalendarComponent);
    }
}

@Directive({ selector: 'dx-color-box[dxFieldState]', exportAs: 'dxFieldState' })
export class DxColorBoxFieldStateDirective extends DxFieldStateDirectiveBase<
    DxColorBoxComponent,
    string | null
> {
    constructor() {
        super(DxColorBoxComponent);
    }
}

@Directive({ selector: 'dx-autocomplete[dxFieldState]', exportAs: 'dxFieldState' })
export class DxAutocompleteFieldStateDirective extends DxFieldStateDirectiveBase<
    DxAutocompleteComponent,
    string | null
> {
    constructor() {
        super(DxAutocompleteComponent);
    }
}

@Directive({ selector: 'dx-slider[dxFieldState]', exportAs: 'dxFieldState' })
export class DxSliderFieldStateDirective extends DxFieldStateDirectiveBase<
    DxSliderComponent,
    number
> {
    constructor() {
        super(DxSliderComponent);
    }
}

@Directive({ selector: 'dx-range-slider[dxFieldState]', exportAs: 'dxFieldState' })
export class DxRangeSliderFieldStateDirective extends DxFieldStateDirectiveBase<
    DxRangeSliderComponent,
    DxNumberRange
> {
    constructor() {
        super(DxRangeSliderComponent);
    }
}

@Directive({ selector: 'dx-select-box[dxFieldState]', exportAs: 'dxFieldState' })
export class DxSelectBoxFieldStateDirective<TValue = unknown> extends DxFieldStateDirectiveBase<
    DxSelectBoxComponent,
    TValue
> {
    constructor() {
        super(DxSelectBoxComponent);
    }
}

@Directive({ selector: 'dx-lookup[dxFieldState]', exportAs: 'dxFieldState' })
export class DxLookupFieldStateDirective<TValue = unknown> extends DxFieldStateDirectiveBase<
    DxLookupComponent,
    TValue
> {
    constructor() {
        super(DxLookupComponent);
    }
}

@Directive({ selector: 'dx-drop-down-box[dxFieldState]', exportAs: 'dxFieldState' })
export class DxDropDownBoxFieldStateDirective<TValue = unknown> extends DxFieldStateDirectiveBase<
    DxDropDownBoxComponent,
    TValue
> {
    constructor() {
        super(DxDropDownBoxComponent);
    }
}

@Directive({ selector: 'dx-radio-group[dxFieldState]', exportAs: 'dxFieldState' })
export class DxRadioGroupFieldStateDirective<TValue = unknown> extends DxFieldStateDirectiveBase<
    DxRadioGroupComponent,
    TValue
> {
    constructor() {
        super(DxRadioGroupComponent);
    }
}

@Directive({ selector: 'dx-tag-box[dxFieldState]', exportAs: 'dxFieldState' })
export class DxTagBoxFieldStateDirective<
    TKey = string | number,
> extends DxFieldStateDirectiveBase<DxTagBoxComponent, readonly TKey[]> {
    constructor() {
        super(DxTagBoxComponent);
    }
}

@Directive({ selector: 'dx-html-editor[dxFieldState]', exportAs: 'dxFieldState' })
export class DxHtmlEditorFieldStateDirective extends DxFieldStateDirectiveBase<
    DxHtmlEditorComponent,
    string
> {
    constructor() {
        super(DxHtmlEditorComponent);
    }
}

/** All editor `[dxFieldState]` directives, for convenient bulk import. */
export const DX_FIELD_STATE_DIRECTIVES = [
    DxAutocompleteFieldStateDirective,
    DxCalendarFieldStateDirective,
    DxCheckBoxFieldStateDirective,
    DxColorBoxFieldStateDirective,
    DxDateBoxFieldStateDirective,
    DxDateRangeBoxFieldStateDirective,
    DxDropDownBoxFieldStateDirective,
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
] as const;
