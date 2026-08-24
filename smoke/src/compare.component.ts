import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import { FormField, form, minLength, required } from '@angular/forms/signals';
import { DxTextBoxValueDirective } from 'ngx-devextreme-zoneless/editors';
import { DxTextBoxFieldStateDirective } from 'ngx-devextreme-zoneless/forms';

/*
 * Binding-style comparison screen, served at `/compare` and driven by
 * e2e/compare.spec.ts. The same field — a required name, min length 3 —
 * written three ways, side by side. docs/binding-styles.md is written from
 * this file.
 *
 * Card A runs the vendor-supported classic *syntax* (Reactive Forms over the
 * editor's own ControlValueAccessor) inside this zoneless app. The first cut
 * of this screen assumed its readouts would go stale — measurement said
 * otherwise: Angular's reactive directives subscribe the control's
 * valueChanges/statusChanges to cdr.markForCheck (setupCustomControl in the
 * forms FESM), so field-level state reaches a zoneless template on its own.
 * What zone.js was actually hiding is the widget state a CVA never carries —
 * selection, popup visibility, paging, grid layout — which is what the rest
 * of this package covers. The arrival is pinned by e2e: if Angular stops
 * marking, the spec goes red and this screen's story changes again.
 */

/** Type-tagged readout, so '' and undefined render distinguishably. */
function show(value: unknown): string {
    if (value === undefined) {
        return 'undefined';
    }
    if (value === null) {
        return 'null';
    }
    return `${typeof value}:${String(value)}`;
}

/*
 * The classic card is its own OnPush component with no signals and no
 * template listeners, on purpose: signal writes in cards B and C mark the
 * *root* dirty, and a default-CD child would be refreshed along with it. In
 * this isolation, the readouts updating is attributable to exactly one
 * mechanism — the reactive directives' own markForCheck subscription — which
 * is the measurement the e2e pins.
 */
@Component({
    selector: 'app-compare-classic',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ReactiveFormsModule, DxTextBoxModule],
    template: `
        <h3>A — classic Reactive Forms syntax (the vendor-supported way)</h3>
        <div class="row">
            <dx-text-box id="cmp-a" [formControl]="name" />
            <span class="readout" data-testid="a-value">{{ show(name.value) }}</span>
            <span class="readout" data-testid="a-touched">{{ name.touched }}</span>
            <span class="readout" data-testid="a-errors">{{ errorKinds() }}</span>
        </div>
        <p class="note">
            Measured, not assumed: value, touched and errors reach these
            readouts without zone.js — Angular's reactive directives mark the
            view dirty on the control's value/status changes. What zone.js was
            actually hiding is the widget state a CVA never carries (selection,
            popup visibility, paging, grid layout), which the rest of this
            package covers. The error display is still yours to hand-roll, and
            zone.js remains the vendor-supported configuration.
        </p>
    `,
})
export class CompareClassicCardComponent {
    protected readonly show = show;
    readonly name = new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(3)],
    });

    protected errorKinds(): string {
        const errors = this.name.errors;
        return errors === null ? 'none' : Object.keys(errors).join(',');
    }
}

@Component({
    selector: 'app-compare',
    imports: [
        CompareClassicCardComponent,
        DxTextBoxModule,
        DxTextBoxValueDirective,
        DxTextBoxFieldStateDirective,
        FormField,
    ],
    template: `
        <app-compare-classic />

        <h3>B — [(dxValue)]: zoneless signal binding</h3>
        <div class="row">
            <dx-text-box id="cmp-b" [(dxValue)]="bName" />
            <span class="readout" data-testid="b-value">{{ show(bName()) }}</span>
            <span class="readout" data-testid="b-error">{{ bError() }}</span>
            <button data-testid="b-set" (click)="bName.set('set-from-code')">set from code</button>
        </div>
        <p class="note">
            Every widget change lands in the signal (scheduling zoneless CD
            natively), every signal write reaches the widget. Validation is
            yours — here a computed.
        </p>

        <h3>C — [formField] + [dxFieldState]: Signal Forms in the widget's own UI</h3>
        <div class="row">
            <dx-text-box
                id="cmp-c"
                validationMessageMode="always"
                [formField]="$any(cProfile.name)"
                [dxFieldState]="cProfile.name"
            />
            <span class="readout" data-testid="c-value">{{ show(cModel().name) }}</span>
            <button data-testid="c-set" (click)="setCName()">set from code</button>
        </div>
        <p class="note">
            No error markup in the template: the schema's rules render through
            the widget's native validation UI, held back until the field is
            touched.
        </p>
    `,
})
export class CompareComponent {
    protected readonly show = show;

    protected readonly bName = signal('');
    protected readonly bError = computed(() => {
        const name = this.bName();
        return name.length === 0 ? 'required' : name.length < 3 ? 'minlength' : 'none';
    });

    protected readonly cModel = signal({ name: '' });
    protected readonly cProfile = form(this.cModel, (profile) => {
        required(profile.name, { message: 'Name is required' });
        minLength(profile.name, 3, { message: 'At least 3 characters' });
    });

    protected setCName(): void {
        this.cModel.update((model) => ({ ...model, name: 'set-from-code' }));
    }
}
