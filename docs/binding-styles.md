# Choosing your binding style

The same form — a required name with a min-length rule, plus a numeric age —
written three ways. The first is the vendor-supported classic; the other two
are what this package opens up. All three run side by side on the smoke app's
comparison screen (`npm run smoke`, then http://localhost:4299/compare), where
the classic variant's behaviour under zoneless change detection is measured
rather than taken on faith — and the measurement corrected this page's first
draft, see below.

## A — Classic zone.js + Reactive Forms (the vendor-supported way)

```ts
@Component({
    imports: [ReactiveFormsModule, DxTextBoxModule, DxNumberBoxModule],
    template: `
        <form [formGroup]="form">
            <dx-text-box formControlName="name" />
            @if (form.controls.name.touched && form.controls.name.invalid) {
                @if (form.controls.name.hasError('required')) {
                    <span class="error">Name is required</span>
                }
                @if (form.controls.name.hasError('minlength')) {
                    <span class="error">At least 3 characters</span>
                }
            }
            <dx-number-box formControlName="age" />
        </form>
    `,
})
export class ProfileComponent {
    private readonly fb = inject(NonNullableFormBuilder);
    readonly form = this.fb.group({
        name: ['', [Validators.required, Validators.minLength(3)]],
        age: this.fb.control<number | null>(null),
    });
}
// bootstrap: zone.js polyfill + provideZoneChangeDetection() — zoneless is
// Angular's default since v21, so "classic" is now the opt-in
```

Everything works because zone.js patches the world: the widget mutates its
internal options, zone fires, change detection sweeps. The cost is the error
UI — every field hand-rolls its touched-gate and per-rule messages in the
template (or adopts `dx-validator`, a second validation system living in
vendor config).

**What actually happens without zone.js — measured, and it corrected this
page's first draft.** The comparison screen runs exactly this syntax in the
zoneless smoke app, and the *field-level* state arrives anyway: Angular's
reactive directives subscribe the control's `valueChanges`/`statusChanges` to
`ChangeDetectorRef.markForCheck`, so value, touched and errors reach the
template with no zone and no signals (pinned by `e2e/compare.spec.ts` — if
that case ever goes red, Angular stopped marking and this page changes again).
What zone.js was actually hiding is everything a `ControlValueAccessor` never
carries: the widget's own option mutations — selection, popup visibility,
paging, grid layout — which is precisely the surface the rest of this package
covers, and why the vendor's supported configuration still requires zone.js.

## B — This package, zoneless: `[(dxValue)]`

```ts
@Component({
    imports: [DxTextBoxModule, DxNumberBoxModule,
              DxTextBoxValueDirective, DxNumberBoxValueDirective],
    template: `
        <dx-text-box [(dxValue)]="name" />
        <dx-number-box [(dxValue)]="age" />
        @if (name().length < 3) { <span class="error">At least 3 characters</span> }
    `,
})
export class ProfileComponent {
    readonly name = signal('');
    readonly age = signal<number | null>(null);
}
```

Near-zero boilerplate for **state**: every widget change lands in a signal
(scheduling zoneless CD natively), every signal write reaches the widget, with
echo suppression, structural equality, optional `dxValueDebounce`, and
teardown that survives widget re-creation. Fully typed end-to-end — binding
`age` to the text box is a compile error. Validation is yours: computed
signals or `dx-validator`, and the widget's native error UI stays unused. This
is the right variant when the value is not part of a form at all — filters,
toolbars, settings panels.

## C — Signal Forms over the seam: `[formField]` + `[dxFieldState]`

```ts
@Component({
    imports: [DxTextBoxModule, DxNumberBoxModule,
              FormField, DX_FIELD_STATE_DIRECTIVES],
    template: `
        <dx-text-box  [formField]="$any(profile.name)" [dxFieldState]="profile.name" />
        <dx-number-box [formField]="$any(profile.age)"  [dxFieldState]="profile.age" />
    `,
})
export class ProfileComponent {
    private readonly model = signal({ name: '', age: null as number | null });
    protected readonly profile = form(this.model, (p) => {
        required(p.name, { message: 'Name is required' });
        minLength(p.name, 3, { message: 'At least 3 characters' });
    });
}
```

The template contains **no error markup at all** — that is the headline.
Value, `touched` and `disabled` cross through the vendor's own
`ControlValueAccessor`; `[dxFieldState]` writes what the CVA cannot carry into
the widget's *native* validation UI: errors (held until touched by default),
async `pending` as the vendor's own spinner, schema `readonly` → `readOnly`,
schema `hidden` → `visible`. The warts are documented and fenced in
[Signal Forms](signal-forms.md): `$any()` on `[formField]` (Angular's
synthesized-input collision, a false positive), and the field named twice —
which is what restores the compile-time type check, with a dev-mode throw if
the two names ever disagree.

## Side by side

| | A: zone.js + Reactive | B: `[(dxValue)]` | C: Signal Forms seam |
|---|---|---|---|
| Change detection | zone.js (the supported config); field state measured working zoneless, non-CVA widget state is not | zoneless, native | zoneless, native |
| Vendor support | ✅ supported config | outside support — netted by this repo's CI | same net |
| Error display | hand-rolled per field/rule | DIY | widget's own UI, zero template |
| Touched-gating, async pending | manual template logic | — | built in (`dxFieldStateShowErrors`, `validationStatus`) |
| Schema-driven readonly/hidden/disabled | manual / partial | — | yes, all three |
| Value type safety | typed forms (good) | end-to-end compile error | restored via `[dxFieldState]` (`$any()` on `[formField]`) |
| Boilerplate growth per field | ~5–8 template lines | ~1 line (+DIY validation) | ~2 lines, flat |
| Survives widget re-creation | via zone re-render | ✅ measured | ✅ measured |

Two rules keep the variants honest:

- `[(dxValue)]` and `[formField]` must never share an editor — two writers of
  one option. Angular 22.1.3 diagnoses this at compile time.
- In both B and C the widget's `valueChangeEvent` defaults to `change`, so
  per-keystroke model updates need `valueChangeEvent="input"` — in C that is
  also the switch that hands debounce ownership to Signal Forms' `debounce()`
  (see [Signal Forms → Debounce ownership](signal-forms.md#debounce-ownership)).
