import { expect, test, type Locator, type Page } from '@playwright/test';

/**
 * Runtime contract tests for the binding engine, driven through the smoke app.
 * Every case checks a *direction* of a binding: widget → signal (user gesture
 * updates a readout rendered from the signal) or signal → widget (a button
 * writes the signal and the widget's DOM reflects it). All of it runs under
 * zoneless change detection — a readout that updates proves the signal write
 * scheduled CD; a widget that updates proves the pusher effect ran.
 */

test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // The text box exists from the first render; its readiness gates all widgets.
    await expect(page.locator('#text-main input.dx-texteditor-input')).toBeVisible();
});

const readout = (page: Page, id: string): Locator => page.getByTestId(id);

test.describe('text box [(dxValue)]', () => {
    test('widget → signal: typing updates the readout per keystroke', async ({ page }) => {
        const input = page.locator('#text-main input.dx-texteditor-input');
        await input.pressSequentially('hello');
        await expect(readout(page, 'text-readout')).toHaveText('hello');
    });

    test('signal → widget: setting the signal updates the input', async ({ page }) => {
        await readout(page, 'text-set').click();
        await expect(page.locator('#text-main input.dx-texteditor-input')).toHaveValue(
            'set-from-signal',
        );
    });
});

test.describe('select box [(dxValue)]', () => {
    test('widget → signal: picking an item updates the readout', async ({ page }) => {
        await page.locator('dx-select-box .dx-dropdowneditor-button').click();
        await expect(readout(page, 'selectbox-opened-readout')).toHaveText('true');
        await page.locator('.dx-list-item-content', { hasText: 'Shipped' }).click();
        await expect(readout(page, 'status-readout')).toHaveText('Shipped');
        await expect(readout(page, 'selectbox-opened-readout')).toHaveText('false');
    });

    test('signal → widget: setting the signal updates the editor', async ({ page }) => {
        await readout(page, 'status-set').click();
        await expect(page.locator('dx-select-box input.dx-texteditor-input')).toHaveValue(
            'Delivered',
        );
        await expect(readout(page, 'status-readout')).toHaveText('Delivered');
    });

    test('clear button pushes null into the signal', async ({ page }) => {
        await readout(page, 'status-set').click();
        await expect(readout(page, 'status-readout')).toHaveText('Delivered');
        await page.locator('dx-select-box .dx-clear-button-area').click();
        await expect(readout(page, 'status-readout')).toHaveText('null');
    });
});

test.describe('check box and slider [(dxValue)]', () => {
    test('check box click updates the signal', async ({ page }) => {
        await expect(readout(page, 'check-readout')).toHaveText('false');
        await page.locator('dx-check-box').click();
        await expect(readout(page, 'check-readout')).toHaveText('true');
    });

    test('slider: signal → widget, then handle drag → signal', async ({ page }) => {
        await readout(page, 'amount-set').click();
        await expect(readout(page, 'amount-readout')).toHaveText('75');
        // Drag the handle to the right; the value updates live during the
        // drag (valueChangeMode 'onHandleMove'), driven widget → signal.
        const handle = page.locator('dx-slider .dx-slider-handle');
        await handle.scrollIntoViewIfNeeded();
        const box = (await handle.boundingBox())!;
        const cx = box.x + box.width / 2;
        const cy = box.y + box.height / 2;
        await page.mouse.move(cx, cy);
        await page.mouse.down();
        await page.mouse.move(cx + 30, cy, { steps: 5 });
        await page.mouse.up();
        await expect
            .poll(async () => Number(await readout(page, 'amount-readout').textContent()))
            .toBeGreaterThan(75);
    });
});

test.describe('tabs [(dxSelectedIndex)]', () => {
    test('widget → signal: clicking a tab updates the readout', async ({ page }) => {
        await page.locator('dx-tabs .dx-tab', { hasText: 'Two' }).click();
        await expect(readout(page, 'tab-readout')).toHaveText('1');
    });

    test('signal → widget: setting the signal selects the tab', async ({ page }) => {
        await readout(page, 'tab-set').click();
        await expect(readout(page, 'tab-readout')).toHaveText('2');
        await expect(page.locator('dx-tabs .dx-tab', { hasText: 'Three' })).toHaveClass(
            /dx-tab-selected/,
        );
    });
});

test.describe('data grid [(dxSelectedRowKeys)]', () => {
    test('widget → signal: clicking a row updates the readout', async ({ page }) => {
        await page.locator('#grid-selection .dx-data-row', { hasText: 'Acme' }).click();
        await expect(readout(page, 'grid-readout')).toHaveText(/\[\s*1\s*\]/);
    });

    test('signal → widget: setting the signal selects the rows', async ({ page }) => {
        await readout(page, 'grid-set').click();
        await expect(readout(page, 'grid-readout')).toHaveText(/\[\s*1\s*,\s*3\s*\]/);
        await expect(
            page.locator('#grid-selection .dx-data-row.dx-selection'),
        ).toHaveCount(2);
    });
});

test.describe('signal-driven data loading', () => {
    test('dxArrayStoreSource: a signal change reloads the bound grid', async ({ page }) => {
        const rows = page.locator('#grid-selection .dx-data-row');
        await expect(rows).toHaveCount(3);
        await readout(page, 'orders-add').click();
        await expect(rows).toHaveCount(4);
        await expect(rows.last()).toContainText('Umbrella');
    });

    test('dxReloadOn: an external filter signal reloads the remote-style grid', async ({
        page,
    }) => {
        const rows = page.locator('#grid-remote .dx-data-row');
        await expect(rows).toHaveCount(3);
        await readout(page, 'remote-filter-input').fill('glo');
        await expect(rows).toHaveCount(1);
        await expect(rows.first()).toContainText('Globex');
        await readout(page, 'remote-filter-input').fill('');
        await expect(rows).toHaveCount(3);
    });
});

test.describe('data grid [(dxPageIndex)] and [(dxFocusedRowKey)]', () => {
    test('page index: signal → widget, pager click → signal', async ({ page }) => {
        const grid = page.locator('#grid-paging');
        await readout(page, 'page-set').click();
        await expect(readout(page, 'page-readout')).toHaveText('1');
        // 3 rows at page size 2 → the second page shows exactly one row.
        await expect(grid.locator('.dx-data-row')).toHaveCount(1);
        await grid.locator('.dx-page', { hasText: '1' }).click();
        await expect(readout(page, 'page-readout')).toHaveText('0');
    });

    test('focused row: row click → signal, signal → widget', async ({ page }) => {
        const grid = page.locator('#grid-paging');
        await grid.locator('.dx-data-row', { hasText: 'Acme' }).click();
        await expect(readout(page, 'focus-readout')).toHaveText('1');
        await readout(page, 'focus-set').click();
        await expect(readout(page, 'focus-readout')).toHaveText('2');
        await expect(grid.locator('.dx-data-row.dx-row-focused')).toContainText('Globex');
    });
});

test.describe('popup [(dxVisible)]', () => {
    const open = async (page: Page): Promise<void> => {
        await readout(page, 'popup-open').click();
        await expect(readout(page, 'popup-readout')).toHaveText('true');
        await expect(readout(page, 'popup-content')).toBeVisible();
    };

    test('signal → widget: open via signal, close via close button', async ({ page }) => {
        await open(page);
        await page.locator('.dx-popup-title .dx-closebutton').click();
        await expect(readout(page, 'popup-readout')).toHaveText('false');
        await expect(readout(page, 'popup-content')).toBeHidden();
    });

    test('escape key closes and the signal follows', async ({ page }) => {
        await open(page);
        // Focus the popup by clicking into it before pressing Escape —
        // locator.press() alone races DevExtreme's focus handling.
        await page.getByRole('dialog', { name: 'Smoke popup' }).click();
        await page.keyboard.press('Escape');
        await expect(readout(page, 'popup-readout')).toHaveText('false');
    });

    test('shading click closes and the signal follows', async ({ page }) => {
        await open(page);
        // The shading class sits on the popup's own wrapper element.
        await page
            .locator('.dx-popup-wrapper.dx-overlay-shader')
            .click({ position: { x: 5, y: 5 } });
        await expect(readout(page, 'popup-readout')).toHaveText('false');
    });
});

test.describe('chart [(dxSelectedPoints)]', () => {
    test('click-toggle → signal, then signal → widget', async ({ page }) => {
        // Selecting a point re-appends its rect (z-order), so indices into
        // `.dxc-series rect` are only stable *before* the first selection —
        // capture the Feb bar's coordinates once and click by position.
        const febBar = page.locator('dx-chart .dxc-series rect').nth(1);
        await febBar.scrollIntoViewIfNeeded();
        const box = (await febBar.boundingBox())!;
        const feb = { x: box.x + box.width / 2, y: box.y + box.height / 2 };

        // widget → signal: click selects (built-in click toggle) ...
        await page.mouse.click(feb.x, feb.y);
        await expect(readout(page, 'chart-readout')).toContainText('Feb');

        // ... and a second click toggles the selection off.
        await page.mouse.click(feb.x, feb.y);
        await expect(readout(page, 'chart-readout')).not.toContainText('Feb');

        // signal → widget: select Feb programmatically.
        await readout(page, 'chart-set').click();
        await expect(readout(page, 'chart-readout')).toContainText('Feb');
    });
});

test.describe('composition API', () => {
    test('dxOptionSignal: initial pull and signal → widget push', async ({ page }) => {
        // Initial sync pulled the widget's placeholder into the signal.
        await expect(readout(page, 'placeholder-readout')).toHaveText('type here');
        await readout(page, 'placeholder-set').click();
        await expect(readout(page, 'placeholder-readout')).toHaveText('via option signal');
        await expect(page.locator('#text-main input.dx-texteditor-input')).toHaveAttribute(
            'placeholder',
            'via option signal',
        );
    });

    test('dxEventSignal: every focusIn fire is observed', async ({ page }) => {
        const count = readout(page, 'focus-count-readout');
        await expect(count).toHaveText('focusIn events: 0');
        const input = page.locator('#text-main input.dx-texteditor-input');
        await input.click();
        await expect(count).toHaveText('focusIn events: 1');
        await readout(page, 'text-readout').click(); // blur
        await input.click();
        await expect(count).toHaveText('focusIn events: 2');
    });
});

test.describe('widget re-creation (composition API on viewChild)', () => {
    test('bindings re-attach and signal state is restored', async ({ page }) => {
        const input = page.locator('#text-recreate input.dx-texteditor-input');

        // First attach: the signal's initial value was pushed into the widget.
        await expect(readout(page, 'recreate-instance-readout')).toHaveText('live');
        await expect(input).toHaveValue('persisted');

        // widget → signal on the first widget instance.
        await input.fill('first');
        await expect(readout(page, 'recreate-readout')).toHaveText('first');

        // Destroy the widget; the instance signal resets.
        await readout(page, 'recreate-toggle').click();
        await expect(input).toHaveCount(0);
        await expect(readout(page, 'recreate-instance-readout')).toHaveText('gone');

        // Re-create: the binding re-attaches and restores the signal state.
        await readout(page, 'recreate-toggle').click();
        await expect(readout(page, 'recreate-instance-readout')).toHaveText('live');
        await expect(input).toHaveValue('first');

        // widget → signal still works against the second widget instance.
        await input.click();
        await input.press('End');
        await input.pressSequentially('-again');
        await expect(readout(page, 'recreate-readout')).toHaveText('first-again');

        // signal → widget still works against the second widget instance.
        await readout(page, 'recreate-set').click();
        await expect(input).toHaveValue('pushed-into-new-widget');
    });
});
