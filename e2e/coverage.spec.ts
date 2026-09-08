import { expect, test, type Locator, type Page } from '@playwright/test';

/**
 * Coverage of every directive the binding screen does not place, driven
 * through smoke/src/coverage.component.ts. Same contract as smoke.spec.ts:
 * each widget proves both directions — a gesture on the widget updates a
 * readout rendered from the signal, and a button that writes the signal
 * moves the widget's DOM — under zoneless change detection.
 *
 * Where a gesture would be a test of DevExtreme's own pointer handling rather
 * than of the binding (a filter builder's inline editors, a range selector's
 * SVG sliders, a date range's masked inputs), the widget → signal direction
 * is driven by writing the widget's option through its instance — the same
 * `option()` setter the gesture ends in, and the path `optionChanged` takes.
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
    await expect(page.locator('#cov-textarea textarea.dx-texteditor-input')).toBeVisible();
    // The two widgets that render asynchronously gate the rest.
    await expect(page.locator('#cov-gantt .dx-data-row')).toHaveCount(2);
    await expect(page.locator('#cov-pie .dxc-series path')).toHaveCount(3);
});

// ---- editors ----------------------------------------------------------------

test.describe('text area [(dxValue)]', () => {
    const input = (page: Page): Locator => page.locator('#cov-textarea textarea.dx-texteditor-input');
    test('widget → signal', async ({ page }) => {
        await input(page).pressSequentially('hi');
        await expect(readout(page, 'cov-textarea-readout')).toHaveText('hi');
    });
    test('signal → widget', async ({ page }) => {
        await readout(page, 'cov-textarea-set').click();
        await expect(input(page)).toHaveValue('set-area');
    });
});

test.describe('autocomplete [(dxValue)]', () => {
    const input = (page: Page): Locator => page.locator('#cov-autocomplete input.dx-texteditor-input');
    test('widget → signal', async ({ page }) => {
        await input(page).pressSequentially('al');
        await expect(readout(page, 'cov-autocomplete-readout')).toHaveText('al');
    });
    test('signal → widget', async ({ page }) => {
        await readout(page, 'cov-autocomplete-set').click();
        await expect(input(page)).toHaveValue('set-auto');
    });
});

test.describe('switch [(dxValue)]', () => {
    test('widget → signal', async ({ page }) => {
        await expect(readout(page, 'cov-switch-readout')).toHaveText('false');
        await page.locator('#cov-switch').click();
        await expect(readout(page, 'cov-switch-readout')).toHaveText('true');
    });
    test('signal → widget', async ({ page }) => {
        await readout(page, 'cov-switch-set').click();
        await expect(page.locator('#cov-switch')).toHaveClass(/dx-switch-on-value/);
    });
});

test.describe('radio group [(dxValue)]', () => {
    test('widget → signal', async ({ page }) => {
        await page.locator('#cov-radio .dx-radiobutton', { hasText: 'Shipped' }).click();
        await expect(readout(page, 'cov-radio-readout')).toHaveText('Shipped');
    });
    test('signal → widget', async ({ page }) => {
        await readout(page, 'cov-radio-set').click();
        await expect(page.locator('#cov-radio .dx-radiobutton-checked')).toContainText('Delivered');
    });
});

test.describe('range slider [(dxValue)]', () => {
    test('widget → signal: dragging the end handle', async ({ page }) => {
        const handle = page.locator('#cov-rangeslider .dx-slider-handle').nth(1);
        await handle.scrollIntoViewIfNeeded();
        const box = (await handle.boundingBox())!;
        const cx = box.x + box.width / 2;
        const cy = box.y + box.height / 2;
        await page.mouse.move(cx, cy);
        await page.mouse.down();
        await page.mouse.move(cx + 40, cy, { steps: 5 });
        await page.mouse.up();
        await expect
            .poll(async () => JSON.parse((await readout(page, 'cov-rangeslider-readout').textContent()) ?? '[]')[1])
            .toBeGreaterThan(60);
    });
    test('signal → widget', async ({ page }) => {
        await readout(page, 'cov-rangeslider-set').click();
        await expect(readout(page, 'cov-rangeslider-readout')).toHaveText(/\[\s*10\s*,\s*90\s*\]/);
        // The start handle moved left of where it started: the rendered range begins nearer the left edge.
        const handles = page.locator('#cov-rangeslider .dx-slider-handle');
        const start = (await handles.nth(0).boundingBox())!;
        const track = (await page.locator('#cov-rangeslider').boundingBox())!;
        expect(start.x - track.x).toBeLessThan(track.width * 0.15);
    });
});

test.describe('color box [(dxValue)]', () => {
    const input = (page: Page): Locator => page.locator('#cov-color input.dx-texteditor-input');
    test('widget → signal: typing a colour and confirming', async ({ page }) => {
        await input(page).fill('#00ff00');
        await input(page).press('Enter');
        await expect(readout(page, 'cov-color-readout')).toHaveText('#00ff00');
    });
    test('signal → widget', async ({ page }) => {
        await readout(page, 'cov-color-set').click();
        await expect(input(page)).toHaveValue('#0000ff');
    });
});

test.describe('lookup [(dxValue)]', () => {
    test('widget → signal: picking from the popup', async ({ page }) => {
        await page.locator('#cov-lookup .dx-lookup-field').click();
        await page.locator('.dx-list-item', { hasText: 'Shipped' }).click();
        await expect(readout(page, 'cov-lookup-readout')).toHaveText('Shipped');
    });
    test('signal → widget', async ({ page }) => {
        await readout(page, 'cov-lookup-set').click();
        await expect(page.locator('#cov-lookup .dx-lookup-field')).toHaveText('Delivered');
    });
});

test.describe('drop-down box [(dxValue)]', () => {
    test('widget → signal: the clear button pushes null', async ({ page }) => {
        await expect(readout(page, 'cov-ddbox-readout')).toHaveText('1');
        await page.locator('#cov-ddbox .dx-clear-button-area').click();
        await expect(readout(page, 'cov-ddbox-readout')).toHaveText('null');
    });
    test('signal → widget', async ({ page }) => {
        await readout(page, 'cov-ddbox-set').click();
        await expect(page.locator('#cov-ddbox input.dx-texteditor-input')).toHaveValue('Two');
    });
    test('a content template renders and its list writes the signal', async ({ page }) => {
        await page.locator('#cov-ddbox .dx-dropdowneditor-button').click();
        await page.locator('#cov-ddbox-list .dx-list-item', { hasText: 'Three' }).click();
        await expect(readout(page, 'cov-ddbox-readout')).toHaveText('3');
    });
});

test.describe('html editor [(dxValue)]', () => {
    test('widget → signal: typing into the content', async ({ page }) => {
        await page.locator('#cov-html .dx-htmleditor-content').click();
        await page.keyboard.type('hey');
        await expect(readout(page, 'cov-html-readout')).toContainText('hey');
    });
    test('signal → widget', async ({ page }) => {
        await readout(page, 'cov-html-set').click();
        await expect(page.locator('#cov-html .dx-htmleditor-content')).toContainText('set-html');
    });
});

test.describe('calendar [(dxValue)]', () => {
    test('widget → signal: clicking a day', async ({ page }) => {
        // The calendar renders the neighbouring months too (for the swipe
        // animation), so a day number alone matches three cells; the
        // accessible label names the month.
        await page.locator('#cov-calendar .dx-calendar-cell[aria-label*="January 15, 2026"]').click();
        await expect(readout(page, 'cov-calendar-readout')).toHaveText('2026-01-15');
    });
    test('signal → widget', async ({ page }) => {
        await readout(page, 'cov-calendar-set').click();
        await expect(page.locator('#cov-calendar .dx-calendar-selected-date')).toHaveText('20');
    });
});

test.describe('date range box [(dxValue)]', () => {
    test('widget → signal: the widget writing its value', async ({ page }) => {
        // Built inside the page so the dates are local, like the ones the
        // widget's own picker would produce.
        await page.evaluate(() => {
            const host = document.querySelector('#cov-daterange');
            const component = (window as unknown as { ng: { getComponent(el: Element | null): { instance: { option(name: string, value: unknown): void } } } }).ng.getComponent(host);
            component.instance.option('value', [new Date(2026, 0, 12), new Date(2026, 0, 14)]);
        });
        await expect(readout(page, 'cov-daterange-readout')).toHaveText('2026-01-12..2026-01-14');
    });
    test('signal → widget', async ({ page }) => {
        await readout(page, 'cov-daterange-set').click();
        await expect(page.locator('#cov-daterange input.dx-texteditor-input').first()).toHaveValue('2026-01-20');
        await expect(page.locator('#cov-daterange input.dx-texteditor-input').last()).toHaveValue('2026-01-25');
    });
});

test.describe('filter builder [(dxValue)]', () => {
    test('widget → signal: the widget writing its value', async ({ page }) => {
        await setOption(page, '#cov-filter', 'value', ['customer', 'contains', 'x']);
        await expect(readout(page, 'cov-filter-readout')).toContainText('contains');
    });
    test('signal → widget', async ({ page }) => {
        await readout(page, 'cov-filter-set').click();
        await expect(page.locator('#cov-filter')).toContainText('42');
        await expect(page.locator('#cov-filter')).toContainText('Amount');
    });
});

// ---- navigation --------------------------------------------------------------

test.describe('accordion [(dxSelectedIndex)]', () => {
    test('widget → signal', async ({ page }) => {
        await page.locator('#cov-accordion .dx-accordion-item-title', { hasText: 'Second' }).click();
        await expect(readout(page, 'cov-accordion-readout')).toHaveText('1');
    });
    test('signal → widget', async ({ page }) => {
        await readout(page, 'cov-accordion-set').click();
        await expect(page.locator('#cov-accordion .dx-accordion-item-opened')).toContainText('Third');
    });
});

test.describe('tab panel [(dxSelectedIndex)]', () => {
    test('widget → signal', async ({ page }) => {
        await page.locator('#cov-tabpanel .dx-tab', { hasText: 'Second' }).click();
        await expect(readout(page, 'cov-tabpanel-readout')).toHaveText('1');
    });
    test('signal → widget', async ({ page }) => {
        await readout(page, 'cov-tabpanel-set').click();
        await expect(page.locator('#cov-tabpanel .dx-tab-selected')).toContainText('Third');
    });
});

test.describe('gallery [(dxSelectedIndex)]', () => {
    test('widget → signal: the next button', async ({ page }) => {
        await page.locator('#cov-gallery .dx-gallery-nav-button-next').click();
        await expect(readout(page, 'cov-gallery-readout')).toHaveText('1');
    });
    test('signal → widget', async ({ page }) => {
        await readout(page, 'cov-gallery-set').click();
        await expect(page.locator('#cov-gallery .dx-gallery-indicator-item').nth(2)).toHaveClass(
            /dx-gallery-indicator-item-selected/,
        );
    });
});

test.describe('list [(dxSelectedItemKeys)]', () => {
    test('widget → signal', async ({ page }) => {
        await page.locator('#cov-list .dx-list-item', { hasText: 'Two' }).click();
        await expect(readout(page, 'cov-list-readout')).toHaveText(/\[\s*2\s*\]/);
    });
    test('signal → widget', async ({ page }) => {
        await readout(page, 'cov-list-set').click();
        await expect(page.locator('#cov-list .dx-list-item-selected')).toHaveCount(2);
    });
});

test.describe('drawer [(dxOpened)]', () => {
    test('signal → widget, then an outside click → signal', async ({ page }) => {
        await readout(page, 'cov-drawer-set').click();
        await expect(readout(page, 'cov-drawer-readout')).toHaveText('true');
        await expect(readout(page, 'cov-drawer-panel')).toBeVisible();
        await page.locator('#cov-drawer-content').click();
        await expect(readout(page, 'cov-drawer-readout')).toHaveText('false');
    });
});

// ---- overlays ----------------------------------------------------------------

test.describe('action sheet [(dxVisible)]', () => {
    test('signal → widget, then cancel → signal', async ({ page }) => {
        await readout(page, 'cov-actionsheet-set').click();
        await expect(page.locator('.dx-actionsheet-container')).toBeVisible();
        await page.locator('.dx-actionsheet-cancel').click();
        await expect(readout(page, 'cov-actionsheet-readout')).toHaveText('false');
    });
});

test.describe('load panel [(dxVisible)]', () => {
    test('signal → widget, then an outside click → signal', async ({ page }) => {
        await readout(page, 'cov-loadpanel-set').click();
        await expect(page.locator('.dx-loadpanel-content')).toBeVisible();
        await page.mouse.click(5, 5);
        await expect(readout(page, 'cov-loadpanel-readout')).toHaveText('false');
    });
});

test.describe('toast [(dxVisible)]', () => {
    test('signal → widget, then the widget hiding itself → signal', async ({ page }) => {
        await readout(page, 'cov-toast-set').click();
        await expect(page.locator('.dx-toast-message')).toBeVisible();
        await expect(readout(page, 'cov-toast-readout')).toHaveText('false', { timeout: 5_000 });
    });
});

test.describe('popover [(dxVisible)]', () => {
    test('signal → widget, then an outside click → signal', async ({ page }) => {
        await readout(page, 'cov-popover-set').click();
        await expect(readout(page, 'cov-popover-content')).toBeVisible();
        await page.mouse.click(5, 5);
        await expect(readout(page, 'cov-popover-readout')).toHaveText('false');
    });
});

test.describe('tooltip [(dxVisible)]', () => {
    test('signal → widget, then an outside click → signal', async ({ page }) => {
        await readout(page, 'cov-tooltip-set').click();
        await expect(readout(page, 'cov-tooltip-content')).toBeVisible();
        await page.mouse.click(5, 5);
        await expect(readout(page, 'cov-tooltip-readout')).toHaveText('false');
    });
});

// ---- data ---------------------------------------------------------------------

test.describe('gantt [(dxSelectedRowKey)]', () => {
    test('widget → signal', async ({ page }) => {
        await page.locator('#cov-gantt .dx-data-row', { hasText: 'Design' }).click();
        await expect(readout(page, 'cov-gantt-readout')).toHaveText('2');
    });
    test('signal → widget', async ({ page }) => {
        await readout(page, 'cov-gantt-set').click();
        await expect(page.locator('#cov-gantt .dx-data-row.dx-selection')).toContainText('Plan');
    });
});

test.describe('scheduler [(dxCurrentDate)] and [(dxCurrentView)]', () => {
    test('widget → signal: navigator and view switcher', async ({ page }) => {
        await page.locator('#cov-scheduler .dx-scheduler-navigator-next').click();
        await expect(readout(page, 'cov-scheduler-date-readout')).toHaveText('2026-03-11');
        // The view switcher is a button group in this version, not a tab strip.
        await page.locator('#cov-scheduler .dx-scheduler-view-switcher').getByText('Week', { exact: true }).click();
        await expect(readout(page, 'cov-scheduler-view-readout')).toHaveText('week');
    });
    test('signal → widget', async ({ page }) => {
        await readout(page, 'cov-scheduler-date-set').click();
        await expect(page.locator('#cov-scheduler .dx-scheduler-navigator-caption')).toContainText('20');
        await readout(page, 'cov-scheduler-view-set').click();
        await expect(
            page.locator(
                '#cov-scheduler .dx-scheduler-view-switcher .dx-item-selected, ' +
                    '#cov-scheduler .dx-scheduler-view-switcher .dx-tab-selected, ' +
                    '#cov-scheduler .dx-scheduler-view-switcher .dx-state-selected',
            ),
        ).toContainText('Week');
    });
});

// ---- visualization -----------------------------------------------------------

test.describe('pie chart [(dxSelectedPoints)]', () => {
    test('click → signal, then signal → widget', async ({ page }) => {
        // Slice A holds 80 % of the pie, so a point half a radius below the
        // centre is inside it whichever way the slices are laid out.
        const series = page.locator('#cov-pie .dxc-series').first();
        await series.scrollIntoViewIfNeeded();
        const box = (await series.boundingBox())!;
        await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.75);
        await expect(readout(page, 'cov-pie-readout')).toContainText('"A"');

        await readout(page, 'cov-pie-set').click();
        await expect(readout(page, 'cov-pie-readout')).toContainText('"B"');
        await expect(readout(page, 'cov-pie-readout')).not.toContainText('"A"');
    });
});

test.describe('range selector [(dxValue)]', () => {
    test('widget → signal: the widget writing its value', async ({ page }) => {
        await setOption(page, '#cov-rangesel', 'value', [30, 70]);
        await expect(readout(page, 'cov-rangesel-readout')).toHaveText(/\[\s*30\s*,\s*70\s*\]/);
    });
    test('signal → widget', async ({ page }) => {
        await readout(page, 'cov-rangesel-set').click();
        await expect
            .poll(() =>
                page.evaluate(() =>
                    (window as unknown as { ng: { getComponent(el: Element | null): { instance: { getValue(): number[] } } } }).ng
                        .getComponent(document.querySelector('#cov-rangesel'))
                        .instance.getValue(),
                ),
            )
            .toEqual([10, 50]);
    });
});

// ---- templates ---------------------------------------------------------------

test.describe('a signal read inside a widget-rendered template', () => {
    test('re-renders on the signal change with no zone', async ({ page }) => {
        const first = page.locator('#cov-template-list .dx-list-item').first();
        await expect(first).toContainText('One × 0');
        await readout(page, 'cov-counter-inc').click();
        await expect(first).toContainText('One × 1');
    });
});
