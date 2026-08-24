# Signal Forms — `[dxFieldState]`

Requires `@angular/forms` (an optional peer). Import from
`ngx-devextreme-zoneless/forms`, which is **not** re-exported by the main entry
point — that is what keeps `@angular/forms` optional for everyone else. For how
this variant compares to `[(dxValue)]` and to classic Reactive Forms, see
[Choosing your binding style](binding-styles.md).

Angular's `[formField]` already works on a DevExtreme editor, and this package
deliberately does not reimplement it: every editor registers its own
`NG_VALUE_ACCESSOR`, and `[formField]` resolves a registered
`ControlValueAccessor` ahead of anything else on the element. Value, `touched`
and `disabled` therefore cross on their own — measured, and pinned by
`e2e/forms.spec.ts`.

What does *not* cross is everything a `ControlValueAccessor` has no hook for.
`[dxFieldState]` writes that into the widget's own validation UI:

| Field state | Reaches the widget via | Notes |
|---|---|---|
| `value` (both directions) | the vendor CVA | on the widget's `valueChangeEvent`, which defaults to `change` (i.e. blur) |
| `touched` | the vendor CVA | on blur |
| `disabled` | the vendor CVA | `setDisabledState` → `dx-state-disabled` |
| `readonly` | **`[dxFieldState]`** | → the widget's `readOnly` option |
| `hidden` | **`[dxFieldState]`** | → the widget's `visible` option (`dx-state-invisible`) |
| `errors` | **`[dxFieldState]`** | → `isValid` + `validationErrors`, rendered by the widget's native message UI |
| `pending` | **`[dxFieldState]`** | → `validationStatus: 'pending'` for async validators |
| `required` | *nowhere* | DevExtreme has no editor-level `required` option — see below |
| `dirty` | *nowhere* | the editor owns its `isDirty` flag and no-ops external writes — see below |

```html
<dx-text-box
    [formField]="$any(profile.email)"
    [dxFieldState]="profile.email"
/>
```

**Why the field is named twice, and why `$any()`.** Angular synthesises one
input assignment per name from a fixed list of 17 (`maxLength`, `min`, `max`,
`readonly`, `required`, …) onto whichever of those names a form-control host
declares. DevExtreme's generated wrappers collide by name with incompatible
types, so `[formField]` fails `strictTemplates` on nine editor families — a
false positive, since nothing is written to those properties on a non-native
host, but not one a consumer can suppress. A directive of ours *could* suppress
it by claiming the `formField` binding, and must not: the runtime instruction
that makes `[formField]` work at all is keyed on the same condition, so claiming
the name silently disables the value binding along with the spurious error.

Passing the field to `[dxFieldState]` is what buys the type safety back. It is
typed to each family's real value type — the same types as
[`[(dxValue)]`](directives.md#editors--dxvalue) — so a mismatched field is a
compile error at that binding even though `[formField]` was cast away:

```html
<!-- compile error: a string field cannot drive a number box -->
<dx-number-box [formField]="$any(profile.name)" [dxFieldState]="profile.name" />
```

The one mistake typing cannot catch is the two bindings naming *different*
fields — value flowing to one while another field's errors render over it. In
dev mode the directive injects Angular's `FORM_FIELD` token and throws when the
bindings disagree; field trees are per-node cached proxies, so the identity
check is exact.

**The schema owns what the directive writes.** While `[dxFieldState]` is
attached it writes `readOnly`, `visible`, `isValid`, `validationStatus` and
`validationErrors` from the field's state — do not also bind any of those on
the element, or the two writers will fight.

**Errors wait for blur by default.** `dxFieldStateShowErrors` is `'touched'`
unless you set it to `'always'`, so a pristine form does not render every
`required` rule as an error on load.

**`required` is not mirrored, and that is a vendor limit rather than an
omission.** No DevExtreme editor declares a `required` option (checked against
26.1.4). The vendor's own mechanisms are `dxValidator` setting `aria-required`
as a side effect of having a `RequiredRule` configured, and `dxForm`'s
item-level `isRequired` drawing an asterisk on the *label*, which exists only
inside a Form. A required field surfaces here the way every other rule does:
through the error it raises when violated.

**`hidden` keeps the widget in the DOM, and Angular will say so.** The
directive maps `hidden()` to the widget's `visible: false` — `dx-state-invisible`
on the root — which keeps the widget warm (its state, its element) where `@if`
would destroy and re-create it. Angular's own preference is `@if`, and its
dev-only `NG01916` warning fires whenever a bound field is hidden while
rendered, because `FormField` cannot see the widget-level hiding. Both patterns
are legitimate: reach for `@if` when you do not need the widget kept warm, and
accept the advisory when you do — the mirrored `visible: false` makes the
situation the warning worries about safe, since the hidden widget cannot be
interacted with.

**`dirty` is not mirrored either, for the opposite reason: the widget owns the
flag.** Editors do declare `isDirty`, but the widget's `_optionChanged`
explicitly no-ops on it, nothing renders it, and the editor overwrites it on
every value change by comparing against its own initial value (verified against
26.1.4). An external write would have no visible effect and would be clobbered
by the next keystroke.

Available on all 18 editor families that carry DevExtreme's `Editor` validation
surface. `dx-filter-builder` is excluded — it extends `WidgetOptions`, not
`EditorOptions`, and has none of these options.

**One owner for the value.** Do not put `[(dxValue)]` and `[formField]` on the
same editor — they are two writers of the same option. Angular 22.1.3 added a
diagnostic that reports forbidden two-way bindings on an element where
`FormField` is applied, so this is now diagnosed rather than merely discouraged.
Use `[(dxValue)]` outside Signal Forms, and `[formField]` + `[dxFieldState]`
inside them.

## Debounce ownership

The widget's `valueChangeEvent` sits *upstream* of Signal Forms' `debounce()`:
with the default `change`, the model is only updated on blur, so there is
nothing left to debounce. Set `valueChangeEvent="input"` on the editor and let
Signal Forms own the debounce policy — do not also reach for `dxValueDebounce`,
which belongs to the `[(dxValue)]` path, not this one.
