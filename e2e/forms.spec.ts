import { expect, test, type Locator, type Page } from '@playwright/test';

/**
 * Signal Forms certification, driven through smoke/src/forms.component.ts.
 *
 * These cases do not exercise this library's code — a DevExtreme editor
 * registers its own `NG_VALUE_ACCESSOR`, and `[formField]` binds through that
 * CVA in preference to anything else on the element. What they establish is how
 * much of the `FieldState` contract reaches the widget across that boundary
 * under zoneless change detection, because that is what decides which parts a
 * consumer still has to wire by hand and which parts this package should own.
 *
 * The negative cases at the bottom are deliberate. They pin gaps, so a vendor
 * release that closes one turns this suite red — which is the point of having
 * it. A red run there is a signal to delete the case, not to fix the app.
 */

const readout = (page: Page, id: string): Locator => page.getByTestId(id);
const input = (page: Page, id: string): Locator =>
    page.locator(`#${id} input.dx-texteditor-input`);

test.beforeEach(async ({ page }) => {
    await page.goto('/forms');
    await expect(input(page, 'form-name')).toBeVisible();
});

test.describe('value: widget → model', () => {
    test('reaches the model on the widget’s own valueChangeEvent, not per keystroke', async ({
        page,
    }) => {
        await input(page, 'form-name').pressSequentially('ab');
        // The keystrokes landed in the widget…
        await expect(input(page, 'form-name')).toHaveValue('ab');
        // …but `valueChangeEvent` defaults to `change`, so the model has not moved.
        // This is the widget's policy, and it is why debounce ownership has to be
        // stated: Signal Forms cannot debounce updates it is not being sent.
        await expect(readout(page, 'name-value')).toHaveText('string:');

        await input(page, 'form-name').blur();
        await expect(readout(page, 'name-value')).toHaveText('string:ab');
    });

    test('valueChangeEvent="input" publishes every keystroke into the model', async ({ page }) => {
        await input(page, 'form-nickname').pressSequentially('zo');
        await expect(readout(page, 'nickname-value')).toHaveText('string:zo');
    });

    test('validation follows the value across the boundary', async ({ page }) => {
        await expect(readout(page, 'name-errors')).toHaveText('required');
        await input(page, 'form-name').pressSequentially('ab');
        await input(page, 'form-name').blur();
        await expect(readout(page, 'name-errors')).toHaveText('minLength');
        await input(page, 'form-name').pressSequentially('cd');
        await input(page, 'form-name').blur();
        await expect(readout(page, 'name-errors')).toHaveText('none');
    });
});

test.describe('value: model → widget', () => {
    test('text box follows a model write', async ({ page }) => {
        await readout(page, 'name-set').click();
        await expect(input(page, 'form-name')).toHaveValue('set-from-model');
    });

    test('number box follows a model write', async ({ page }) => {
        await readout(page, 'age-set').click();
        await expect(input(page, 'form-age')).toHaveValue('42');
        await expect(readout(page, 'age-value')).toHaveText('number:42');
    });

    test('check box follows a model write', async ({ page }) => {
        await expect(page.locator('#form-active')).not.toHaveClass(/dx-checkbox-checked/);
        await readout(page, 'active-set').click();
        await expect(page.locator('#form-active')).toHaveClass(/dx-checkbox-checked/);
    });

    test('date box follows a model write, and the model keeps a Date', async ({ page }) => {
        await readout(page, 'birthday-set').click();
        await expect(input(page, 'form-birthday')).toHaveValue('5/17/1990');
        // The model still holds a `Date`, not the widget's display string — the
        // value-boundary question a NodaTime-backed consumer will ask.
        await expect(readout(page, 'birthday-value')).toHaveText('Date:1990-05-17');
    });

    test('tag box follows a model write', async ({ page }) => {
        await readout(page, 'tags-set').click();
        await expect(page.locator('#form-tags .dx-tag-content')).toHaveCount(2);
        await expect(readout(page, 'tags-value')).toHaveText('[1,3]');
    });
});

test.describe('state that crosses the CVA', () => {
    test('touched flips on blur', async ({ page }) => {
        await expect(readout(page, 'name-touched')).toHaveText('false');
        await input(page, 'form-name').click();
        await input(page, 'form-name').blur();
        await expect(readout(page, 'name-touched')).toHaveText('true');
    });

    test('schema disabled reaches the widget through setDisabledState', async ({ page }) => {
        await expect(page.locator('#form-age')).not.toHaveClass(/dx-state-disabled/);
        await readout(page, 'lock-toggle').click();
        await expect(readout(page, 'age-disabled')).toHaveText('true');
        await expect(page.locator('#form-age')).toHaveClass(/dx-state-disabled/);

        await readout(page, 'lock-toggle').click();
        await expect(readout(page, 'age-disabled')).toHaveText('false');
        await expect(page.locator('#form-age')).not.toHaveClass(/dx-state-disabled/);
    });
});

test.describe('state that does not cross the CVA', () => {
    /*
     * A `ControlValueAccessor` has four hooks — writeValue, registerOnChange,
     * registerOnTouched, setDisabledState — so `disabled` is the *only* piece of
     * field state with a channel to the widget. Everything below is present and
     * correct on the `FieldState` and simply never arrives, which is the gap a
     * directive in this package would fill.
     */

    test('readonly stays on the field and never reaches the widget', async ({ page }) => {
        await readout(page, 'lock-toggle').click();
        await expect(readout(page, 'status-readonly')).toHaveText('true');
        await expect(page.locator('#form-status')).not.toHaveClass(/dx-state-readonly/);
    });

    test('required stays on the field and never reaches the widget', async ({ page }) => {
        await expect(readout(page, 'status-required')).toHaveText('true');
        await expect(page.locator('#form-status .dx-field-item-required-mark')).toHaveCount(0);
    });

    test('errors stay on the field and never reach the widget’s validation UI', async ({ page }) => {
        // The name field is `required` and empty, so it is invalid from the
        // first render; the widget renders no `dx-invalid` for it.
        await expect(readout(page, 'name-invalid')).toHaveText('true');
        await expect(page.locator('#form-name')).not.toHaveClass(/dx-invalid/);
    });
});

test.describe('widget re-creation', () => {
    test('a re-created widget rebinds in both directions', async ({ page }) => {
        await readout(page, 'name-set').click();
        await expect(input(page, 'form-name')).toHaveValue('set-from-model');

        await readout(page, 'name-recreate').click();
        await expect(input(page, 'form-name')).toHaveCount(0);
        await readout(page, 'name-recreate').click();

        // model → widget: the new element is populated from the field.
        await expect(input(page, 'form-name')).toHaveValue('set-from-model');

        // widget → model: the new element's CVA is wired to the same field.
        await input(page, 'form-name').fill('after-recreate');
        await input(page, 'form-name').blur();
        await expect(readout(page, 'name-value')).toHaveText('string:after-recreate');
    });
});
