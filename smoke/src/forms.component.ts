import { Component, signal } from '@angular/core';
import { DxCheckBoxModule } from 'devextreme-angular/ui/check-box';
import { DxDateBoxModule } from 'devextreme-angular/ui/date-box';
import { DxNumberBoxModule } from 'devextreme-angular/ui/number-box';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import { DxTagBoxModule } from 'devextreme-angular/ui/tag-box';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import {
    FormField,
    disabled,
    form,
    minLength,
    readonly as readonlyWhen,
    required,
} from '@angular/forms/signals';

/*
 * Signal Forms certification screen, served at `/forms` and driven by
 * e2e/forms.spec.ts. Nothing here imports this library: that is the point.
 * Every DevExtreme editor registers `NG_VALUE_ACCESSOR` on itself, and
 * `[formField]` resolves a registered CVA ahead of a custom `FormValueControl`
 * and the native element, so the vendor's own CVA is what carries the binding.
 * This screen measures how much of the `FieldState` contract survives that
 * boundary under zoneless change detection — which is what decides where this
 * package still has to put something.
 *
 * `$any()` is load-bearing and not laziness. Angular type-checks a `[formField]`
 * host component structurally against `FormUiControl`, whose optional members
 * include `maxLength`, `min` and `max`. DevExtreme's generated wrappers happen
 * to declare inputs by exactly those names with types that reject `undefined`
 * (`maxLength: null | number | string`), so the check fails on every editor
 * that has one — text box, date box, select box, tag box — and on number box
 * via `value: number` against a `number | null` field. It is a false positive:
 * `elementAcceptsNativeProperty()` returns false for any non-native host, so at
 * runtime none of those properties is ever written. Check box is the one family
 * that compiles unaided, having no `maxLength` and a `value: boolean | null`
 * that admits the field type.
 */

interface Profile {
    name: string;
    nickname: string;
    age: number | null;
    active: boolean;
    birthday: Date | null;
    status: string | null;
    tags: number[];
}

/**
 * Renders a value so that the cases a test needs to tell apart are visibly
 * different: `''` and `undefined` render identically through `{{ }}`, which is
 * how a case once passed without being able to observe the thing it was named
 * for. Type-tagging every scalar keeps `0`/`false`/`''` apart from `null`.
 */
function show(value: unknown): string {
    if (value === undefined) {
        return 'undefined';
    }
    if (value === null) {
        return 'null';
    }
    if (value instanceof Date) {
        return `Date:${value.toISOString().slice(0, 10)}`;
    }
    if (Array.isArray(value)) {
        return `[${value.join(',')}]`;
    }
    return `${typeof value}:${String(value)}`;
}

@Component({
    selector: 'app-forms',
    imports: [
        DxCheckBoxModule,
        DxDateBoxModule,
        DxNumberBoxModule,
        DxSelectBoxModule,
        DxTagBoxModule,
        DxTextBoxModule,
        FormField,
    ],
    template: `
        <h3>Text ([formField] over the vendor CVA)</h3>
        <div class="row">
            @if (showName()) {
                <dx-text-box id="form-name" [formField]="$any(profile.name)" />
            }
            <span class="readout" data-testid="name-value">{{ show(model().name) }}</span>
            <span class="readout" data-testid="name-touched">{{ profile.name().touched() }}</span>
            <span class="readout" data-testid="name-invalid">{{ profile.name().invalid() }}</span>
            <span class="readout" data-testid="name-errors">{{ errorKinds(profile.name().errors()) }}</span>
            <button data-testid="name-set" (click)="setName()">set name</button>
            <button data-testid="name-recreate" (click)="showName.set(!showName())">toggle text box</button>
        </div>

        <!--
            Same binding, but the widget is told to publish on every keystroke.
            The default \`valueChangeEvent\` is \`change\`, so the field above only
            reaches the model on blur — which is the widget's policy, not Signal
            Forms'. Anyone reaching for \`debounce()\` needs this distinction first.
        -->
        <div class="row">
            <dx-text-box id="form-nickname" valueChangeEvent="input" [formField]="$any(profile.nickname)" />
            <span class="readout" data-testid="nickname-value">{{ show(model().nickname) }}</span>
        </div>

        <h3>Number</h3>
        <div class="row">
            <dx-number-box id="form-age" [formField]="$any(profile.age)" />
            <span class="readout" data-testid="age-value">{{ show(model().age) }}</span>
            <span class="readout" data-testid="age-disabled">{{ profile.age().disabled() }}</span>
            <button data-testid="age-set" (click)="setAge()">set age</button>
        </div>

        <h3>Boolean</h3>
        <div class="row">
            <dx-check-box id="form-active" [formField]="profile.active" />
            <span class="readout" data-testid="active-value">{{ show(model().active) }}</span>
            <button data-testid="active-set" (click)="setActive()">set active</button>
        </div>

        <h3>Date</h3>
        <div class="row">
            <dx-date-box id="form-birthday" [formField]="$any(profile.birthday)" />
            <span class="readout" data-testid="birthday-value">{{ show(model().birthday) }}</span>
            <button data-testid="birthday-set" (click)="setBirthday()">set birthday</button>
        </div>

        <h3>Select</h3>
        <div class="row">
            <dx-select-box id="form-status" [formField]="$any(profile.status)" [items]="statuses" />
            <span class="readout" data-testid="status-value">{{ show(model().status) }}</span>
            <span class="readout" data-testid="status-readonly">{{ profile.status().readonly() }}</span>
            <span class="readout" data-testid="status-required">{{ profile.status().required() }}</span>
        </div>

        <h3>Multi-value</h3>
        <div class="row">
            <dx-tag-box id="form-tags" [formField]="$any(profile.tags)" [items]="tagIds" />
            <span class="readout" data-testid="tags-value">{{ show(model().tags) }}</span>
            <button data-testid="tags-set" (click)="setTags()">set tags</button>
        </div>

        <h3>Form-wide</h3>
        <div class="row">
            <button data-testid="lock-toggle" (click)="locked.set(!locked())">toggle lock</button>
            <span class="readout" data-testid="form-locked">{{ locked() }}</span>
            <span class="readout" data-testid="form-valid">{{ profile().valid() }}</span>
            <span class="readout" data-testid="form-model">{{ show(model().name) }}/{{ show(model().age) }}</span>
        </div>
    `,
})
export class FormsComponent {
    protected readonly show = show;
    protected readonly statuses = ['Pending', 'Shipped', 'Delivered'];
    protected readonly tagIds = [1, 2, 3];

    /** Drives `disabled` and `readonly` through the schema, not through the widget. */
    protected readonly locked = signal(false);
    /** Widget re-creation: the field binding has to survive a new element. */
    protected readonly showName = signal(true);

    protected readonly model = signal<Profile>({
        name: '',
        nickname: '',
        age: null,
        active: false,
        birthday: null,
        status: null,
        tags: [],
    });

    protected readonly profile = form(this.model, (profile) => {
        required(profile.name);
        minLength(profile.name, 3);
        disabled(profile.age, () => this.locked());
        readonlyWhen(profile.status, () => this.locked());
        required(profile.status);
    });

    /** Error identity without leaning on message text, which is locale-shaped. */
    protected errorKinds(errors: readonly { kind: string }[]): string {
        return errors.length === 0 ? 'none' : errors.map((error) => error.kind).join(',');
    }

    protected setName(): void {
        this.model.update((profile) => ({ ...profile, name: 'set-from-model' }));
    }

    protected setAge(): void {
        this.model.update((profile) => ({ ...profile, age: 42 }));
    }

    protected setActive(): void {
        this.model.update((profile) => ({ ...profile, active: true }));
    }

    protected setBirthday(): void {
        this.model.update((profile) => ({ ...profile, birthday: new Date(Date.UTC(1990, 4, 17)) }));
    }

    protected setTags(): void {
        this.model.update((profile) => ({ ...profile, tags: [1, 3] }));
    }
}
