import { expect, test, type Locator, type Page } from '@playwright/test';

/**
 * The bindings added in 4.0, driven through the lower half of
 * smoke/src/coverage.component.ts. Same contract as smoke.spec.ts: each
 * directive proves both directions under zoneless change detection — a
 * gesture on the widget updates a readout rendered from the signal, and a
 * button that writes the signal moves the widget's DOM.
 */

const readout = (page: Page, id: string): Locator => page.getByTestId(id);

/** Writes a widget option through the wrapper's instance, as the widget's own UI would. */
const setOption = (page: Page, selector: string, name: string, value: unknown): Promise<void> =>
    page.evaluate(
        ([selector, name, value]) => {
            const host = document.querySelector(selector);
            const component = (window as unknown as { ng: { getComponent(el: Element | null): { instance: { option(name: string, value: unknown): void } } } }).ng.getComponent(host);
            component.instance.option(name, value);
        },
        [selector, name, value] as const,
    );

test.beforeEach(async ({ page }) => {
    await page.goto('/coverage');
    await expect(page.locator('#nb-selectbox input.dx-texteditor-input')).toBeVisible();
    await expect(page.locator('#nb-grid-batch .dx-data-row')).toHaveCount(3);
    await expect(page.locator('#nb-polar .dxc-series')).toHaveCount(1);
});

// ---- [(dxOpened)] ------------------------------------------------------------

const OPENED: ReadonlyArray<{ readonly id: string; readonly content: string }> = [
    { id: 'selectbox', content: '.dx-overlay-wrapper .dx-list:visible' },
    { id: 'lookup', content: '.dx-overlay-wrapper .dx-list:visible' },
    { id: 'datebox', content: '.dx-overlay-wrapper .dx-calendar:visible' },
    { id: 'daterangebox', content: '.dx-overlay-wrapper .dx-calendar:visible' },
    // The tag box's list is not reliably reported visible while it animates in; the
    // editor's own active class is the same state one level up.
    { id: 'tagbox', content: '#nb-tagbox.dx-dropdowneditor-active' },
    { id: 'autocomplete', content: '.dx-overlay-wrapper .dx-list:visible' },
    { id: 'ddbox', content: '[data-testid="nb-ddbox-content"]:visible' },
    { id: 'colorbox', content: '.dx-overlay-wrapper .dx-colorview:visible' },
    { id: 'ddbutton', content: '.dx-overlay-wrapper .dx-list:visible' },
];

for (const { id, content } of OPENED) {
    test(`${id} [(dxOpened)]: signal → widget opens it, an outside click → signal`, async ({
        page,
    }) => {
        await expect(readout(page, `nb-${id}-opened`)).toHaveText('false');
        await readout(page, `nb-${id}-open`).click();
        await expect(readout(page, `nb-${id}-opened`)).toHaveText('true');
        await expect(page.locator(content).first()).toBeVisible();
        await page.mouse.click(5, 5);
        await expect(readout(page, `nb-${id}-opened`)).toHaveText('false');
    });
}

// ---- tree view [(dxExpandedNodeKeys)] ------------------------------------------

test.describe('tree view [(dxExpandedNodeKeys)]', () => {
    const node = (page: Page, text: string): Locator =>
        page.locator('#nb-tree .dx-treeview-node', { hasText: text });

    test('widget → signal: expanding a node', async ({ page }) => {
        await expect(readout(page, 'nb-tree-readout')).toHaveText('[]');
        await node(page, 'Fruit').locator('.dx-treeview-toggle-item-visibility').first().click();
        await expect(readout(page, 'nb-tree-readout')).toHaveText(/\[\s*1\s*\]/);
        await expect(page.locator('#nb-tree .dx-treeview-item', { hasText: 'Apple' })).toBeVisible();
    });

    test('signal → widget: the signal holds the complete set', async ({ page }) => {
        await readout(page, 'nb-tree-set').click();
        await expect(page.locator('#nb-tree .dx-treeview-item', { hasText: 'Carrot' })).toBeVisible();
        await expect(page.locator('#nb-tree .dx-treeview-item', { hasText: 'Apple' })).toBeHidden();
        await expect(readout(page, 'nb-tree-readout')).toHaveText(/\[\s*4\s*\]/);
        await readout(page, 'nb-tree-clear').click();
        await expect(page.locator('#nb-tree .dx-treeview-item', { hasText: 'Carrot' })).toBeHidden();
        await expect(readout(page, 'nb-tree-readout')).toHaveText('[]');
    });
});

// ---- grid editing state --------------------------------------------------------

test.describe('data grid [(dxEditingChanges)]', () => {
    test('widget → signal: a batch edit lands as an update change', async ({ page }) => {
        const cell = page.locator('#nb-grid-batch .dx-data-row', { hasText: 'Acme' }).locator('td').nth(1);
        await cell.click();
        const editor = page.locator('#nb-grid-batch input.dx-texteditor-input');
        await editor.pressSequentially('X');
        await editor.press('Tab');
        await expect(readout(page, 'nb-grid-batch-readout')).toContainText('"update"');
        await expect(readout(page, 'nb-grid-batch-readout')).toContainText('AcmeX');
    });

    test('signal → widget: a change is rendered as a modified cell, and [] discards it', async ({ page }) => {
        await readout(page, 'nb-grid-batch-set').click();
        const row = page.locator('#nb-grid-batch .dx-data-row').nth(1);
        await expect(row).toContainText('Changed');
        await expect(row.locator('.dx-cell-modified')).toHaveCount(1);
        await readout(page, 'nb-grid-batch-clear').click();
        await expect(row).toContainText('Globex');
        await expect(row.locator('.dx-cell-modified')).toHaveCount(0);
    });
});

test.describe('tree list [(dxEditingChanges)]', () => {
    test('widget → signal: a batch edit lands as an update change', async ({ page }) => {
        const cell = page.locator('#nb-treelist-batch .dx-data-row', { hasText: 'Apple' }).locator('td').first();
        await cell.click();
        const editor = page.locator('#nb-treelist-batch input.dx-texteditor-input');
        await editor.pressSequentially('X');
        await editor.press('Tab');
        await expect(readout(page, 'nb-treelist-batch-readout')).toContainText('"update"');
        await expect(readout(page, 'nb-treelist-batch-readout')).toContainText('AppleX');
    });

    test('signal → widget: a change is rendered as a modified cell, and [] discards it', async ({ page }) => {
        await readout(page, 'nb-treelist-batch-set').click();
        const row = page.locator('#nb-treelist-batch .dx-data-row', { hasText: /Changed|Apple/ });
        await expect(row).toContainText('Changed');
        await expect(row.locator('.dx-cell-modified')).toHaveCount(1);
        await readout(page, 'nb-treelist-batch-clear').click();
        await expect(page.locator('#nb-treelist-batch .dx-data-row', { hasText: 'Apple' })).toHaveCount(1);
    });
});

test.describe('data grid [(dxEditRowKey)]', () => {
    test('widget → signal: the edit link', async ({ page }) => {
        await page.locator('#nb-grid-row .dx-data-row', { hasText: 'Globex' }).locator('.dx-link-edit').click();
        await expect(readout(page, 'nb-grid-row-readout')).toHaveText('2');
    });

    test('signal → widget: a key opens the row editor, null closes it', async ({ page }) => {
        await readout(page, 'nb-grid-row-set').click();
        await expect(page.locator('#nb-grid-row .dx-edit-row')).toHaveCount(1);
        await expect(page.locator('#nb-grid-row .dx-edit-row input.dx-texteditor-input')).toHaveValue('Acme');
        await readout(page, 'nb-grid-row-cancel').click();
        await expect(page.locator('#nb-grid-row .dx-edit-row')).toHaveCount(0);
        await expect(readout(page, 'nb-grid-row-readout')).toHaveText('null');
    });
});

test.describe('tree list [(dxEditRowKey)]', () => {
    test('widget → signal: the edit link', async ({ page }) => {
        await page.locator('#nb-treelist-row .dx-data-row', { hasText: 'Apple' }).locator('.dx-link-edit').click();
        await expect(readout(page, 'nb-treelist-row-readout')).toHaveText('2');
    });

    test('signal → widget: a key opens the row editor, null closes it', async ({ page }) => {
        await readout(page, 'nb-treelist-row-set').click();
        await expect(page.locator('#nb-treelist-row .dx-edit-row')).toHaveCount(1);
        await readout(page, 'nb-treelist-row-cancel').click();
        await expect(page.locator('#nb-treelist-row .dx-edit-row')).toHaveCount(0);
    });
});

// ---- data grid [(dxSelectionFilter)] --------------------------------------------

test.describe('data grid [(dxSelectionFilter)]', () => {
    test('widget → signal: a row checkbox becomes a filter expression', async ({ page }) => {
        await page.locator('#nb-grid-deferred .dx-data-row', { hasText: 'Acme' }).locator('.dx-select-checkbox').click();
        await expect(readout(page, 'nb-grid-deferred-readout')).toContainText('"id"');
        await expect(readout(page, 'nb-grid-deferred-readout')).toContainText('1');
    });

    test('signal → widget: a filter expression selects the rows it describes', async ({ page }) => {
        await readout(page, 'nb-grid-deferred-set').click();
        await expect(page.locator('#nb-grid-deferred .dx-data-row.dx-selection')).toHaveCount(1);
        await expect(page.locator('#nb-grid-deferred .dx-data-row.dx-selection')).toContainText('Globex');
    });
});

// ---- chart [(dxVisualRange)] ---------------------------------------------------

test.describe('chart [(dxVisualRange)]', () => {
    test('widget → signal: a wheel zoom writes the range', async ({ page }) => {
        // Once rendered the chart reports the full data range, so the signal is
        // already `{ startValue: 1, endValue: 10 }` here; a zoom narrows it.
        await expect(readout(page, 'nb-chart-readout')).toContainText('"endValue": 10');
        const plot = page.locator('#nb-chart svg');
        await plot.scrollIntoViewIfNeeded();
        const box = (await plot.boundingBox())!;
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.wheel(0, -400);
        await expect(readout(page, 'nb-chart-readout')).not.toContainText('"endValue": 10');
        await expect(readout(page, 'nb-chart-readout')).toContainText('startValue');
    });

    test('signal → widget: the chart converges the signal to its own representation', async ({ page }) => {
        await readout(page, 'nb-chart-set').click();
        await expect(readout(page, 'nb-chart-readout')).toContainText('"startValue": 3');
        await expect(readout(page, 'nb-chart-readout')).toContainText('"endValue": 6');
    });
});

// ---- selection breadth ---------------------------------------------------------

test.describe('tabs [(dxSelectedItemKeys)]', () => {
    test('widget → signal', async ({ page }) => {
        await page.locator('#nb-tabs .dx-tab', { hasText: 'Two' }).click();
        await expect(readout(page, 'nb-tabs-readout')).toHaveText(/\[\s*2\s*\]/);
    });
    test('signal → widget', async ({ page }) => {
        await readout(page, 'nb-tabs-set').click();
        await expect(page.locator('#nb-tabs .dx-tab-selected')).toHaveCount(2);
    });
});

test.describe('accordion [(dxSelectedItemKeys)]', () => {
    test('widget → signal', async ({ page }) => {
        // Multiple selection: the click adds the second pane's key to whatever
        // the widget opened by default.
        await page.locator('#nb-accordion .dx-accordion-item-title', { hasText: 'Second' }).click();
        await expect(readout(page, 'nb-accordion-readout')).toContainText('2');
    });
    test('signal → widget', async ({ page }) => {
        await readout(page, 'nb-accordion-set').click();
        await expect(page.locator('#nb-accordion .dx-accordion-item-opened')).toHaveCount(2);
    });
});

test.describe('button group [(dxSelectedItemKeys)]', () => {
    test('widget → signal', async ({ page }) => {
        await page.locator('#nb-buttongroup .dx-button', { hasText: 'Italic' }).click();
        await expect(readout(page, 'nb-buttongroup-readout')).toContainText('"i"');
    });
    test('signal → widget', async ({ page }) => {
        await readout(page, 'nb-buttongroup-set').click();
        await expect(page.locator('#nb-buttongroup .dx-item-selected')).toHaveCount(2);
    });
});

test.describe('multi view [(dxSelectedIndex)]', () => {
    test('widget → signal: the widget writing its index (it has no navigation UI of its own)', async ({ page }) => {
        await setOption(page, '#nb-multiview', 'selectedIndex', 1);
        await expect(readout(page, 'nb-multiview-readout')).toHaveText('1');
    });
    test('signal → widget', async ({ page }) => {
        await readout(page, 'nb-multiview-set').click();
        await expect(page.locator('#nb-multiview .dx-item-selected')).toContainText('third pane');
    });
});

test.describe('stepper [(dxSelectedIndex)]', () => {
    test('widget → signal', async ({ page }) => {
        await page.locator('#nb-stepper .dx-step', { hasText: 'Pay' }).click();
        await expect(readout(page, 'nb-stepper-readout')).toHaveText('1');
    });
    test('signal → widget', async ({ page }) => {
        await readout(page, 'nb-stepper-set').click();
        await expect(page.locator('#nb-stepper .dx-step-selected')).toContainText('Done');
    });
});

test.describe('pagination [(dxPageIndex)] and [(dxPageSize)]', () => {
    test('widget → signal: page and page size clicks (1-based index)', async ({ page }) => {
        await page.locator('#nb-pagination .dx-page', { hasText: /^3$/ }).click();
        await expect(readout(page, 'nb-pagination-index')).toHaveText('3');
        await page.locator('#nb-pagination .dx-page-size', { hasText: /^20$/ }).click();
        await expect(readout(page, 'nb-pagination-size')).toHaveText('20');
    });
    test('signal → widget', async ({ page }) => {
        await readout(page, 'nb-pagination-set-index').click();
        await expect(page.locator('#nb-pagination .dx-page.dx-selection')).toHaveText('2');
        await readout(page, 'nb-pagination-set-size').click();
        await expect(page.locator('#nb-pagination .dx-page-size.dx-selection')).toHaveText('5');
    });
});

test.describe('context menu [(dxVisible)]', () => {
    test('right-click → signal, item click → signal', async ({ page }) => {
        await readout(page, 'nb-contextmenu-target').click({ button: 'right' });
        await expect(readout(page, 'nb-contextmenu-readout')).toHaveText('true');
        await page.locator('.dx-context-menu .dx-menu-item', { hasText: 'Cut' }).click();
        await expect(readout(page, 'nb-contextmenu-readout')).toHaveText('false');
    });
    test('signal → widget', async ({ page }) => {
        await readout(page, 'nb-contextmenu-open').click();
        await expect(page.locator('.dx-context-menu .dx-menu-item', { hasText: 'Copy' })).toBeVisible();
    });
});

test.describe('polar chart [(dxSelectedPoints)]', () => {
    test('click → signal, then signal → widget', async ({ page }) => {
        const marker = page.locator('#nb-polar .dxc-markers circle').first();
        await marker.scrollIntoViewIfNeeded();
        const box = (await marker.boundingBox())!;
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await expect(readout(page, 'nb-polar-readout')).toContainText('"N"');
        await readout(page, 'nb-polar-set').click();
        await expect(readout(page, 'nb-polar-readout')).toContainText('"E"');
        await expect(readout(page, 'nb-polar-readout')).not.toContainText('"N"');
    });
});
