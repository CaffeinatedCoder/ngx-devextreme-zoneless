import { Component, resource, signal } from '@angular/core';
import { DxCheckBoxModule } from 'devextreme-angular/ui/check-box';
import { DxDateBoxModule } from 'devextreme-angular/ui/date-box';
import { DxNumberBoxModule } from 'devextreme-angular/ui/number-box';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import { DxTagBoxModule } from 'devextreme-angular/ui/tag-box';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import {
    FormField,
    debounce,
    disabled,
    form,
    hidden,
    minLength,
    readonly as readonlyRule,
    required,
    submit,
    validateAsync,
} from '@angular/forms/signals';
import { DX_FIELD_STATE_DIRECTIVES } from 'ngx-devextreme-zoneless/forms';

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
    email: string;
    code: string;
    note: string;
    category: string | null;
    website: string;
    secret: string;
    search: string;
    username: string;
    price: number | null;
    nativePrice: number | null;
    shippedOn: string | null;
    shippedLoose: Date | string | null;
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
        DX_FIELD_STATE_DIRECTIVES,
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

        <!--
            Everything below pairs the vendor CVA (which carries value, touched
            and disabled) with [dxFieldState] (which carries readonly and the
            errors). The field is named twice by necessity: a directive of ours
            claiming the \`formField\` binding would stop the compiler treating the
            element as a form control — and the runtime \`control\` instruction is
            keyed on the same condition, so the value binding would go with it.
        -->
        <h3>Errors, held until touched (the default)</h3>
        <div class="row">
            @if (showEmail()) {
                <dx-text-box
                    id="fs-email"
                    validationMessageMode="always"
                    [formField]="$any(profile.email)"
                    [dxFieldState]="profile.email"
                />
            }
            <span class="readout" data-testid="email-value">{{ show(model().email) }}</span>
            <span class="readout" data-testid="email-touched">{{ profile.email().touched() }}</span>
            <span class="readout" data-testid="email-errors">{{ errorKinds(profile.email().errors()) }}</span>
            <button data-testid="email-recreate" (click)="showEmail.set(!showEmail())">toggle email box</button>
        </div>

        <h3>Errors, shown immediately</h3>
        <div class="row">
            <dx-text-box
                id="fs-code"
                validationMessageMode="always"
                dxFieldStateShowErrors="always"
                [formField]="$any(profile.code)"
                [dxFieldState]="profile.code"
            />
            <span class="readout" data-testid="code-touched">{{ profile.code().touched() }}</span>
        </div>

        <h3>Readonly, which the CVA does not carry</h3>
        <div class="row">
            <dx-text-box id="fs-note" [formField]="$any(profile.note)" [dxFieldState]="profile.note" />
            <span class="readout" data-testid="note-readonly">{{ profile.note().readonly() }}</span>
        </div>

        <h3>Another family, same seam</h3>
        <div class="row">
            <dx-select-box
                id="fs-category"
                validationMessageMode="always"
                dxFieldStateShowErrors="always"
                [items]="statuses"
                [formField]="$any(profile.category)"
                [dxFieldState]="profile.category"
            />
            <span class="readout" data-testid="category-value">{{ show(model().category) }}</span>
        </div>

        <h3>Async validation, held pending</h3>
        <div class="row">
            <dx-text-box
                id="fs-website"
                validationMessageMode="always"
                [formField]="$any(profile.website)"
                [dxFieldState]="profile.website"
            />
            <span class="readout" data-testid="website-pending">{{ profile.website().pending() }}</span>
            <button data-testid="website-release" (click)="releaseWebsiteCheck()">release async check</button>
        </div>

        <h3>Hidden, which the CVA does not carry either</h3>
        <div class="row">
            <!--
                While hidden, Angular logs the dev-only NG01916 ("hidden fields
                should be removed from the DOM using @if"): FormField cannot see
                the widget-level hiding. Keeping the element is the point here —
                \`visible: false\` keeps the widget warm where @if would destroy
                it — and the warning is the documented cost of that choice.
            -->
            <dx-text-box id="fs-secret" [formField]="$any(profile.secret)" [dxFieldState]="profile.secret" />
            <span class="readout" data-testid="secret-hidden">{{ profile.secret().hidden() }}</span>
            <button data-testid="secret-toggle" (click)="hideSecret.set(!hideSecret())">toggle secret</button>
        </div>

        <h3>reset() while a debounced write is pending</h3>
        <div class="row">
            <dx-text-box id="form-search" valueChangeEvent="input" [formField]="$any(profile.search)" />
            <span class="readout" data-testid="search-value">{{ show(model().search) }}</span>
            <button data-testid="search-reset" (click)="resetSearch()">reset search</button>
        </div>

        <h3>Submit, and what a server error does to the second attempt</h3>
        <div class="row">
            <dx-text-box
                id="form-username"
                validationMessageMode="always"
                dxFieldStateShowErrors="always"
                [formField]="$any(profile.username)"
                [dxFieldState]="profile.username"
            />
            <span class="readout" data-testid="submit-runs">{{ actionRuns() }}</span>
            <span class="readout" data-testid="username-errors">{{ errorKinds(profile.username().errors()) }}</span>
            <button data-testid="submit" (click)="submitUsername()">submit</button>
        </div>

        <h3>Number editing: the widget owns its text buffer</h3>
        <div class="row">
            <dx-number-box id="form-price" valueChangeEvent="input" [formField]="$any(profile.price)" />
            <span class="readout" data-testid="price-value">{{ show(model().price) }}</span>
            <!--
                The native control angular#69635 breaks, kept beside the immune
                widget: Angular writes the parsed number back into a native
                input's .value on every keystroke, destroying intermediate text
                ('-', '0.') that does not round-trip through Number → String.
                The widget never exposes its text buffer to that write-back.
            -->
            <input id="native-price" type="number" [formField]="profile.nativePrice" />
        </div>

        <h3>ISO date strings, via the widget's own serialization</h3>
        <div class="row">
            <!--
                dateSerializationFormat makes the widget's value *option* hold
                the serialized string — the CVA passes it through verbatim, so
                the model round-trips ISO strings with no adapter (verified
                against 26.1.4; gated on the config default
                forceIsoDateParsing: true).
            -->
            <dx-date-box
                id="form-shipped"
                dateSerializationFormat="yyyy-MM-dd"
                [formField]="$any(profile.shippedOn)"
                [dxFieldState]="profile.shippedOn"
            />
            <span class="readout" data-testid="shipped-value">{{ show(model().shippedOn) }}</span>
            <button data-testid="shipped-set" (click)="setShippedOn()">set shipped</button>
        </div>
        <div class="row">
            <!--
                The same edit without dateSerializationFormat: from an empty
                field the widget has no string value to infer a format from,
                so the model receives a raw Date. The model type admits both
                so the readout can report which one actually arrived.
            -->
            <dx-date-box id="form-shipped-loose" [formField]="$any(profile.shippedLoose)" />
            <span class="readout" data-testid="shipped-loose-value">{{ show(model().shippedLoose) }}</span>
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
    /** Widget re-creation on the [dxFieldState] side: state must be re-applied. */
    protected readonly showEmail = signal(true);
    /** Drives `hidden` through the schema, not through the widget's `visible`. */
    protected readonly hideSecret = signal(false);

    /**
     * Deterministic async validation: the website check pends until the release
     * button resolves it, so the e2e observes `pending` as a held state rather
     * than racing a timer. One-shot by design — each page load arms it once.
     */
    protected releaseWebsiteCheck: () => void = () => {};
    private readonly websiteCheckDone = new Promise<void>((resolve) => {
        this.releaseWebsiteCheck = resolve;
    });

    protected readonly model = signal<Profile>({
        name: '',
        nickname: '',
        age: null,
        active: false,
        birthday: null,
        status: null,
        tags: [],
        email: '',
        code: '',
        note: '',
        category: null,
        website: '',
        secret: '',
        search: '',
        username: '',
        price: null,
        nativePrice: null,
        shippedOn: null,
        shippedLoose: null,
    });

    protected readonly profile = form(this.model, (profile) => {
        required(profile.name);
        minLength(profile.name, 3);
        disabled(profile.age, { when: () => this.locked() });
        readonlyRule(profile.status, { when: () => this.locked() });
        required(profile.status);

        // The [dxFieldState] half of the screen. Separate fields on purpose:
        // the widgets above carry the bare CVA and their negative assertions
        // are the alarm for a vendor release closing that gap, so they must
        // stay free of the companion directive.
        // Explicit messages: they are what the widget renders, so the e2e can
        // assert the exact string rather than merely that something appeared.
        required(profile.email, { message: 'Email is required' });
        minLength(profile.email, 5, { message: 'At least 5 characters' });
        required(profile.code, { message: 'Code is required' });
        readonlyRule(profile.note, { when: () => this.locked() });
        required(profile.category, { message: 'Pick a category' });

        // The [dxFieldState] pending path: the loader cannot settle until the
        // release button resolves the gate, which is what makes
        // `validationStatus: 'pending'` observable instead of a race.
        validateAsync(profile.website, {
            params: ({ value }) => value(),
            factory: (params) =>
                resource({
                    params,
                    loader: async ({ params: website }) => {
                        if (website === undefined || website === '') {
                            return 'free';
                        }
                        await this.websiteCheckDone;
                        return website.includes('taken') ? 'taken' : 'free';
                    },
                }),
            onError: () => undefined,
            onSuccess: (result) =>
                result === 'taken' ? { kind: 'taken', message: 'Name is taken' } : undefined,
        });
        hidden(profile.secret, { when: () => this.hideSecret() });

        // Model sync debounced: the reset-vs-debounce pin needs a write that
        // is demonstrably still pending when reset() lands.
        debounce(profile.search, 500);
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

    /** How often the submit action actually ran — the blocked-retry readout. */
    protected readonly actionRuns = signal(0);

    protected resetSearch(): void {
        this.profile.search().reset('reset-value');
    }

    /**
     * First run fails with a root-level submit error (no fieldTree, so it
     * lands on the submitted field itself); every later run succeeds. That
     * split is what lets the e2e observe the retry being blocked while the
     * error stands, and running again once an edit has cleared it.
     */
    protected submitUsername(): void {
        void submit(this.profile.username, async () => {
            this.actionRuns.update((count) => count + 1);
            return this.actionRuns() === 1
                ? [{ kind: 'server', message: 'Username taken' }]
                : undefined;
        });
    }

    protected setShippedOn(): void {
        this.model.update((profile) => ({ ...profile, shippedOn: '2026-03-15' }));
    }
}
