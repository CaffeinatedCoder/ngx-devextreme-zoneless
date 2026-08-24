import { expect, test, type Locator, type Page } from '@playwright/test';

/*
 * The binding-style comparison screen (smoke/src/compare.component.ts,
 * docs/binding-styles.md). Three cards, one field each: classic Reactive
 * Forms syntax, [(dxValue)], and Signal Forms via [formField]+[dxFieldState].
 *
 * The first case is a certification pin. The screen's first cut asserted the
 * classic card's readouts would go STALE under zoneless CD — this suite
 * proved that wrong: Angular's reactive directives subscribe the control's
 * valueChanges/statusChanges to cdr.markForCheck, so field state arrives on
 * its own. The case now pins the arrival. If it goes red, Angular stopped
 * marking — change the story in docs/binding-styles.md and on the screen,
 * not the app.
 */

const readout = (page: Page, id: string): Locator => page.getByTestId(id);
const input = (page: Page, id: string): Locator =>
    page.locator(`#${id} input.dx-texteditor-input`);
const validationMessage = (page: Page, id: string): Locator =>
    page.locator(`#${id} .dx-invalid-message .dx-overlay-content`);

test.beforeEach(async ({ page }) => {
    await page.goto('/compare');
    await expect(input(page, 'cmp-a')).toBeVisible();
});

test('A: classic field state reaches the zoneless template on its own', async ({ page }) => {
    await expect(readout(page, 'a-errors')).toHaveText('required');

    await input(page, 'cmp-a').pressSequentially('ab');
    await input(page, 'cmp-a').blur();
    await expect(input(page, 'cmp-a')).toHaveValue('ab');

    // Nothing in this card fires an Angular template listener during typing
    // and blur — DevExtreme listens natively, and the card is OnPush with no
    // signals, so neighbors cannot refresh it. The readouts updating is
    // therefore attributable to exactly one mechanism: the reactive
    // directives' valueChanges/statusChanges → markForCheck subscription.
    await expect(readout(page, 'a-value')).toHaveText('string:ab');
    await expect(readout(page, 'a-touched')).toHaveText('true');
    await expect(readout(page, 'a-errors')).toHaveText('minlength');
});

test('B: [(dxValue)] carries both directions zoneless', async ({ page }) => {
    await expect(readout(page, 'b-error')).toHaveText('required');

    await input(page, 'cmp-b').pressSequentially('ab');
    await input(page, 'cmp-b').blur();
    await expect(readout(page, 'b-value')).toHaveText('string:ab');
    await expect(readout(page, 'b-error')).toHaveText('minlength');

    await readout(page, 'b-set').click();
    await expect(input(page, 'cmp-b')).toHaveValue('set-from-code');
    await expect(readout(page, 'b-error')).toHaveText('none');
});

test('C: the schema error renders in the widget’s own UI, and a valid write clears it', async ({
    page,
}) => {
    await input(page, 'cmp-c').focus();
    await input(page, 'cmp-c').blur();
    await expect(page.locator('#cmp-c')).toHaveClass(/dx-invalid/);
    await expect(validationMessage(page, 'cmp-c')).toHaveText('Name is required');

    await readout(page, 'c-set').click();
    await expect(input(page, 'cmp-c')).toHaveValue('set-from-code');
    await expect(readout(page, 'c-value')).toHaveText('string:set-from-code');
    await expect(page.locator('#cmp-c')).not.toHaveClass(/dx-invalid/);
});
