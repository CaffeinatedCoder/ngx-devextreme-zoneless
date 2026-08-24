import { Directive, effect, input } from '@angular/core';
import type { Field } from '@angular/forms/signals';
import {
    dxInstanceSignal,
    type DxHostComponent,
} from 'ngx-devextreme-zoneless/core';

/**
 * `[dxFieldState]` — presents an Angular Signal Forms field's state in the
 * editor's *own* validation UI.
 *
 * This directive deliberately does **not** carry the value. Every DevExtreme
 * editor registers `NG_VALUE_ACCESSOR` on itself, and `[formField]` resolves a
 * registered `ControlValueAccessor` ahead of anything else, so value, `touched`
 * and `disabled` already cross that boundary — measured, and pinned by
 * `e2e/forms.spec.ts`. A `ControlValueAccessor` has four hooks and only
 * `setDisabledState` carries state *toward* the widget, which is why `readonly`,
 * `required` and `errors` do not arrive.
 *
 * Two of those three are written here. **`required` is not, because DevExtreme
 * has nowhere to put it**: no editor declares a `required` option (verified
 * against 26.1.4). The vendor's own mechanisms are `dxValidator` setting
 * `aria-required` as a side effect of having a `RequiredRule` configured, and
 * `dxForm`'s item-level `isRequired` rendering an asterisk on the *label* — the
 * latter existing only inside a Form. A required field therefore surfaces here
 * the way every other rule does: through the error it raises when violated.
 *
 * It must not claim the `formField` binding itself. The template type-checker
 * stops treating an element as a form control as soon as a directive that is not
 * Angular's own field directive declares a binding property named `formField` —
 * and the runtime `ɵɵcontrol` instruction is keyed on the same condition, so
 * claiming the name would silently disable the value binding along with the
 * spurious type error. Hence the separate input name, and hence the field is
 * named twice:
 *
 * ```html
 * <dx-text-box [formField]="$any(profile.name)" [dxFieldState]="profile.name" />
 * ```
 *
 * The `$any()` is unavoidable on the nine editor families whose generated
 * wrapper declares an input colliding with one of the 17 names Angular
 * synthesises onto a form-control host (`maxLength`, `min`, `max`, `value`).
 * Passing the field here is what buys the type safety back: `dxFieldState` is
 * typed to the family's real value type, so a mismatched field is a compile
 * error at this binding even though `[formField]` was cast away.
 *
 * `@angular/forms` is an optional peer dependency and is imported for types
 * only — the built entry point carries no runtime import of it.
 */
@Directive()
export abstract class DxFieldStateDirectiveBase<THost extends DxHostComponent, TValue> {
    /** The Signal Forms field whose state this widget presents. */
    readonly dxFieldState = input.required<Field<TValue>>();

    /**
     * When validation errors become visible. `'touched'` (the default) holds
     * them back until the field has been blurred at least once, which is what
     * keeps a pristine form from rendering every `required` rule as an error on
     * load. `'always'` mirrors `invalid()` as-is.
     */
    readonly dxFieldStateShowErrors = input<'touched' | 'always'>('touched');

    protected constructor(host: THost) {
        const instance = dxInstanceSignal(host);

        effect(() => {
            const widget = instance();
            if (widget === undefined) {
                return;
            }

            const state = this.dxFieldState()();
            const visible = this.dxFieldStateShowErrors() === 'always' || state.touched();
            const invalid = state.invalid() && visible;

            // `isValid` and `validationStatus` re-derive each other through the
            // widget's `synchronizeValidationOptions`, so they are written in one
            // call and kept consistent rather than in sequence, where the last
            // key processed would decide the outcome.
            //
            // Written to the widget rather than to the wrapper's `@Input()`s on
            // purpose: `DxLookupComponent`'s generated wrapper omits `readOnly`
            // even though `dxLookupOptions` inherits it from `EditorOptions`, so
            // the option route is the one that works uniformly across the family.
            //
            // `readOnly` does not interact with message visibility — the widget
            // gates the tooltip on `validationMessageMode`/focus and never on
            // `readOnly`, so this cannot produce an error that is set but
            // unreachable.
            (widget.option as (options: Record<string, unknown>) => void)({
                readOnly: state.readonly(),
                isValid: !invalid,
                validationStatus: state.pending() ? 'pending' : invalid ? 'invalid' : 'valid',
                // The widget's renderer reads `.message` off each entry and joins
                // all of them; `kind` is the fallback for a rule that carries no
                // human-readable message.
                validationErrors: invalid
                    ? state.errors().map((error) => ({ message: error.message ?? error.kind }))
                    : [],
            });
        });
    }
}
