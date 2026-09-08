import { expect, test } from '@playwright/test';

/**
 * `[dxFieldState]` on every editor family it supports, driven through
 * smoke/src/forms-coverage.component.ts. The directive is one-way — field
 * state into the widget's own validation UI — so each widget proves the two
 * states with a DOM outcome: an invalid field renders the widget invalid, and
 * a read-only field renders it read-only. The screen starts with every field
 * invalid and a switch that makes every field read-only.
 */

const WIDGETS = [
    'text-box',
    'text-area',
    'number-box',
    'check-box',
    'switch',
    'date-box',
    'date-range-box',
    'calendar',
    'color-box',
    'autocomplete',
    'slider',
    'range-slider',
    'select-box',
    'lookup',
    'drop-down-box',
    'radio-group',
    'tag-box',
    'html-editor',
    'file-uploader',
] as const;

test.beforeEach(async ({ page }) => {
    await page.goto('/forms-coverage');
    await expect(page.locator('#fc-text-box input.dx-texteditor-input')).toBeVisible();
    await expect(page.locator('#fc-html-editor .dx-htmleditor-content')).toBeVisible();
});

for (const widget of WIDGETS) {
    test(`${widget}: the field's invalid and read-only states reach the widget`, async ({
        page,
    }) => {
        const root = page.locator(`#fc-${widget}`);
        await expect(root).toHaveClass(/dx-invalid/);
        await expect(root).not.toHaveClass(/dx-state-readonly/);
        await page.getByTestId('fc-readonly-toggle').click();
        await expect(page.getByTestId('fc-readonly-readout')).toHaveText('true');
        await expect(root).toHaveClass(/dx-state-readonly/);
    });
}
