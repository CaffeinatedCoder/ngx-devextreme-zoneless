import { Directive } from '@angular/core';
import type { DxAutocompleteComponent } from 'devextreme-angular/ui/autocomplete';
import type { DxCalendarComponent } from 'devextreme-angular/ui/calendar';
import type { DxCheckBoxComponent } from 'devextreme-angular/ui/check-box';
import type { DxColorBoxComponent } from 'devextreme-angular/ui/color-box';
import type { DxDateBoxComponent } from 'devextreme-angular/ui/date-box';
import type { DxDateRangeBoxComponent } from 'devextreme-angular/ui/date-range-box';
import type { DxDropDownBoxComponent } from 'devextreme-angular/ui/drop-down-box';
import type { DxFileUploaderComponent } from 'devextreme-angular/ui/file-uploader';
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
    injectDxHost,
    type DxDateRange,
    type DxDateValue,
    type DxNumberRange,
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
        super(injectDxHost<DxTextBoxComponent>());
    }
}

@Directive({ selector: 'dx-text-area[dxFieldState]', exportAs: 'dxFieldState' })
export class DxTextAreaFieldStateDirective extends DxFieldStateDirectiveBase<
    DxTextAreaComponent,
    string
> {
    constructor() {
        super(injectDxHost<DxTextAreaComponent>());
    }
}

@Directive({ selector: 'dx-number-box[dxFieldState]', exportAs: 'dxFieldState' })
export class DxNumberBoxFieldStateDirective extends DxFieldStateDirectiveBase<
    DxNumberBoxComponent,
    number | null
> {
    constructor() {
        super(injectDxHost<DxNumberBoxComponent>());
    }
}

@Directive({ selector: 'dx-check-box[dxFieldState]', exportAs: 'dxFieldState' })
export class DxCheckBoxFieldStateDirective extends DxFieldStateDirectiveBase<
    DxCheckBoxComponent,
    boolean | null
> {
    constructor() {
        super(injectDxHost<DxCheckBoxComponent>());
    }
}

@Directive({ selector: 'dx-switch[dxFieldState]', exportAs: 'dxFieldState' })
export class DxSwitchFieldStateDirective extends DxFieldStateDirectiveBase<
    DxSwitchComponent,
    boolean
> {
    constructor() {
        super(injectDxHost<DxSwitchComponent>());
    }
}

@Directive({ selector: 'dx-date-box[dxFieldState]', exportAs: 'dxFieldState' })
export class DxDateBoxFieldStateDirective extends DxFieldStateDirectiveBase<
    DxDateBoxComponent,
    DxDateValue | null
> {
    constructor() {
        super(injectDxHost<DxDateBoxComponent>());
    }
}

@Directive({ selector: 'dx-date-range-box[dxFieldState]', exportAs: 'dxFieldState' })
export class DxDateRangeBoxFieldStateDirective extends DxFieldStateDirectiveBase<
    DxDateRangeBoxComponent,
    DxDateRange
> {
    constructor() {
        super(injectDxHost<DxDateRangeBoxComponent>());
    }
}

@Directive({ selector: 'dx-calendar[dxFieldState]', exportAs: 'dxFieldState' })
export class DxCalendarFieldStateDirective extends DxFieldStateDirectiveBase<
    DxCalendarComponent,
    DxDateValue | readonly DxDateValue[] | null
> {
    constructor() {
        super(injectDxHost<DxCalendarComponent>());
    }
}

@Directive({ selector: 'dx-color-box[dxFieldState]', exportAs: 'dxFieldState' })
export class DxColorBoxFieldStateDirective extends DxFieldStateDirectiveBase<
    DxColorBoxComponent,
    string | null
> {
    constructor() {
        super(injectDxHost<DxColorBoxComponent>());
    }
}

@Directive({ selector: 'dx-autocomplete[dxFieldState]', exportAs: 'dxFieldState' })
export class DxAutocompleteFieldStateDirective extends DxFieldStateDirectiveBase<
    DxAutocompleteComponent,
    string | null
> {
    constructor() {
        super(injectDxHost<DxAutocompleteComponent>());
    }
}

@Directive({ selector: 'dx-slider[dxFieldState]', exportAs: 'dxFieldState' })
export class DxSliderFieldStateDirective extends DxFieldStateDirectiveBase<
    DxSliderComponent,
    number
> {
    constructor() {
        super(injectDxHost<DxSliderComponent>());
    }
}

@Directive({ selector: 'dx-range-slider[dxFieldState]', exportAs: 'dxFieldState' })
export class DxRangeSliderFieldStateDirective extends DxFieldStateDirectiveBase<
    DxRangeSliderComponent,
    DxNumberRange
> {
    constructor() {
        super(injectDxHost<DxRangeSliderComponent>());
    }
}

@Directive({ selector: 'dx-select-box[dxFieldState]', exportAs: 'dxFieldState' })
export class DxSelectBoxFieldStateDirective<TValue = unknown> extends DxFieldStateDirectiveBase<
    DxSelectBoxComponent,
    TValue
> {
    constructor() {
        super(injectDxHost<DxSelectBoxComponent>());
    }
}

@Directive({ selector: 'dx-lookup[dxFieldState]', exportAs: 'dxFieldState' })
export class DxLookupFieldStateDirective<TValue = unknown> extends DxFieldStateDirectiveBase<
    DxLookupComponent,
    TValue
> {
    constructor() {
        super(injectDxHost<DxLookupComponent>());
    }
}

@Directive({ selector: 'dx-drop-down-box[dxFieldState]', exportAs: 'dxFieldState' })
export class DxDropDownBoxFieldStateDirective<TValue = unknown> extends DxFieldStateDirectiveBase<
    DxDropDownBoxComponent,
    TValue
> {
    constructor() {
        super(injectDxHost<DxDropDownBoxComponent>());
    }
}

@Directive({ selector: 'dx-radio-group[dxFieldState]', exportAs: 'dxFieldState' })
export class DxRadioGroupFieldStateDirective<TValue = unknown> extends DxFieldStateDirectiveBase<
    DxRadioGroupComponent,
    TValue
> {
    constructor() {
        super(injectDxHost<DxRadioGroupComponent>());
    }
}

@Directive({ selector: 'dx-tag-box[dxFieldState]', exportAs: 'dxFieldState' })
export class DxTagBoxFieldStateDirective<
    TKey = string | number,
> extends DxFieldStateDirectiveBase<DxTagBoxComponent, readonly TKey[]> {
    constructor() {
        super(injectDxHost<DxTagBoxComponent>());
    }
}

@Directive({ selector: 'dx-html-editor[dxFieldState]', exportAs: 'dxFieldState' })
export class DxHtmlEditorFieldStateDirective extends DxFieldStateDirectiveBase<
    DxHtmlEditorComponent,
    string
> {
    constructor() {
        super(injectDxHost<DxHtmlEditorComponent>());
    }
}

/**
 * `dx-file-uploader` extends `Editor` like the rest of the family, and its
 * `_optionChanged` falls through to the base for every validation option, so
 * the field's state renders through the same `_renderValidationState()` path
 * (verified against 26.1.4). Its value is the picked `File[]`.
 */
@Directive({ selector: 'dx-file-uploader[dxFieldState]', exportAs: 'dxFieldState' })
export class DxFileUploaderFieldStateDirective extends DxFieldStateDirectiveBase<
    DxFileUploaderComponent,
    readonly File[]
> {
    constructor() {
        super(injectDxHost<DxFileUploaderComponent>());
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
] as const;
