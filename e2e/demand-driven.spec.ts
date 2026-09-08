import { expect, test, type Locator, type Page } from '@playwright/test';

/**
 * The demand-driven bindings 4.0 closed after its first cut — file uploader,
 * calendar zoom level, chat draft text, resizable dimensions, splitter panes,
 * focused row by index, CardView, FileManager and the chart's value axis —
 * driven through the tail of smoke/src/coverage.component.ts. Same contract
 * as smoke.spec.ts: each directive proves both directions under zoneless
 * change detection — a gesture on the widget updates a readout rendered from
 * the signal, and a button that writes the signal moves the widget's DOM.
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

/** Drags from the centre of `handle` by `dx`/`dy` pixels. */
const drag = async (page: Page, handle: Locator, dx: number, dy: number): Promise<void> => {
    await handle.scrollIntoViewIfNeeded();
    const box = (await handle.boundingBox())!;
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + dx, cy + dy, { steps: 6 });
    await page.mouse.up();
};

const numbers = async (locator: Locator): Promise<number[]> =>
    JSON.parse((await locator.textContent()) ?? '[]') as number[];

test.beforeEach(async ({ page }) => {
    await page.goto('/coverage');
    await expect(page.locator('#nb-chat textarea')).toBeVisible();
    // The three widgets that render asynchronously gate the rest.
    await expect(page.locator('#nb-cardview .dx-cardview-card')).toHaveCount(2);
    await expect(page.locator('#nb-fm .dx-data-row')).toHaveCount(2);
    await expect(readout(page, 'nb-splitter-sizes')).not.toHaveText('undefined');
});

// ---- editor state beyond value ---------------------------------------------------

test.describe('file uploader [(dxValue)]', () => {
    test('widget → signal: picking a file', async ({ page }) => {
        await page.locator('#nb-uploader input[type=file]').setInputFiles({
            name: 'picked.txt',
            mimeType: 'text/plain',
            buffer: Buffer.from('picked'),
        });
        await expect(readout(page, 'nb-uploader-readout')).toHaveText('picked.txt');
    });
    test('signal → widget: a written file list renders, and [] clears it', async ({ page }) => {
        await readout(page, 'nb-uploader-set').click();
        await expect(page.locator('#nb-uploader .dx-fileuploader-file-name')).toHaveText('set.txt');
        await readout(page, 'nb-uploader-clear').click();
        await expect(page.locator('#nb-uploader .dx-fileuploader-file-name')).toHaveCount(0);
        await expect(readout(page, 'nb-uploader-readout')).toHaveText('none');
    });
});

test.describe('calendar [(dxZoomLevel)]', () => {
    test('widget → signal: the caption drills up', async ({ page }) => {
        await page.locator('#nb-calendar-zoom .dx-calendar-caption-button').click();
        await expect(readout(page, 'nb-calendar-zoom-readout')).toHaveText('year');
    });
    test('signal → widget', async ({ page }) => {
        await readout(page, 'nb-calendar-zoom-set').click();
        await expect(page.locator('#nb-calendar-zoom')).toHaveClass(/dx-calendar-view-year/);
    });
    test('a level beyond minZoomLevel converges to the clamped one', async ({ page }) => {
        // `minZoomLevel` is the furthest the calendar zooms *out* (the
        // vendor's naming). The widget clamps with a second option write from
        // inside its change handler, which the engine's latch drops; the
        // post-write re-read is what brings the signal back to the level
        // actually shown. Without it the readout would stay 'century' over a
        // year view.
        await readout(page, 'nb-calendar-zoom-clamp').click();
        await expect(readout(page, 'nb-calendar-zoom-readout')).toHaveText('year');
        await expect(page.locator('#nb-calendar-zoom')).toHaveClass(/dx-calendar-view-year/);
    });
});

test.describe('chat [(dxInputFieldText)]', () => {
    test('widget → signal: typing into the message box', async ({ page }) => {
        await page.locator('#nb-chat textarea').pressSequentially('hi');
        await expect(readout(page, 'nb-chat-readout')).toHaveText('hi');
    });
    test('signal → widget', async ({ page }) => {
        await readout(page, 'nb-chat-set').click();
        await expect(page.locator('#nb-chat textarea')).toHaveValue('set-draft');
    });
});

// ---- layout state ---------------------------------------------------------------

test.describe('resizable [(dxWidth)] / [(dxHeight)]', () => {
    test('widget → signal: dragging the right handle', async ({ page }) => {
        await expect(readout(page, 'nb-resizable-readout')).toHaveText('150x50');
        await drag(page, page.locator('#nb-resizable .dx-resizable-handle-right'), 40, 0);
        await expect
            .poll(async () => Number((await readout(page, 'nb-resizable-readout').textContent())?.split('x')[0]))
            .toBeGreaterThan(170);
    });
    test('signal → widget', async ({ page }) => {
        await readout(page, 'nb-resizable-set').click();
        await expect.poll(async () => (await page.locator('#nb-resizable').boundingBox())?.width).toBe(220);
        await expect.poll(async () => (await page.locator('#nb-resizable').boundingBox())?.height).toBe(70);
    });
});

test.describe('splitter [(dxItemSizes)]', () => {
    test('the sizes are known after the first layout, and a drag writes them', async ({ page }) => {
        // The splitter's size write-back is silent (no optionChanged); the
        // adapter reads on contentReady and resizeEnd instead.
        const before = await numbers(readout(page, 'nb-splitter-sizes'));
        expect(before).toHaveLength(2);
        expect(before[0]).toBeGreaterThan(0);
        await drag(page, page.locator('#nb-splitter .dx-resize-handle'), 40, 0);
        await expect.poll(async () => (await numbers(readout(page, 'nb-splitter-sizes')))[0]).toBeGreaterThan(before[0]! + 20);
    });
    test('signal → widget: written sizes lay the panes out, clamped to minSize', async ({ page }) => {
        // 50 is below the first pane's `minSize: 80`. The splitter lays out
        // 80 and stores it back silently, so only the post-write re-read
        // brings the signal to the size the pane actually has.
        await readout(page, 'nb-splitter-set-sizes').click();
        await expect.poll(async () => Math.round((await page.locator('#nb-splitter .dx-splitter-item').first().boundingBox())!.width)).toBe(80);
        await expect.poll(async () => (await numbers(readout(page, 'nb-splitter-sizes')))[0]).toBe(80);
    });
});

test.describe('splitter [(dxCollapsedItems)]', () => {
    test('widget → signal: the collapse handle', async ({ page }) => {
        await page.locator('#nb-splitter .dx-resize-handle-collapse-prev-pane').click();
        await expect(readout(page, 'nb-splitter-collapsed')).toHaveText(/\[\s*0\s*\]/);
    });
    test('signal → widget: collapse then expand', async ({ page }) => {
        await readout(page, 'nb-splitter-collapse').click();
        await expect(page.locator('#nb-splitter .dx-splitter-item').first()).toHaveClass(/dx-splitter-item-hidden-content/);
        await readout(page, 'nb-splitter-expand').click();
        await expect(page.locator('#nb-splitter .dx-splitter-item').first()).not.toHaveClass(/dx-splitter-item-hidden-content/);
        await expect(readout(page, 'nb-splitter-collapsed')).toHaveText('[]');
    });
});

// ---- focused row by index ---------------------------------------------------------

test.describe('data grid [(dxFocusedRowIndex)]', () => {
    test('widget → signal', async ({ page }) => {
        await page.locator('#nb-grid-focusidx .dx-data-row', { hasText: 'Globex' }).click();
        await expect(readout(page, 'nb-grid-focusidx-readout')).toHaveText('1');
    });
    test('signal → widget', async ({ page }) => {
        await readout(page, 'nb-grid-focusidx-set').click();
        await expect(page.locator('#nb-grid-focusidx .dx-row-focused')).toContainText('Initech');
    });
});

test.describe('tree list [(dxFocusedRowIndex)]', () => {
    test('widget → signal', async ({ page }) => {
        await page.locator('#nb-treelist-focusidx .dx-data-row', { hasText: 'Apple' }).click();
        await expect(readout(page, 'nb-treelist-focusidx-readout')).toHaveText('1');
    });
    test('signal → widget', async ({ page }) => {
        await readout(page, 'nb-treelist-focusidx-set').click();
        await expect(page.locator('#nb-treelist-focusidx .dx-row-focused')).toContainText('Vegetables');
    });
});

// ---- card view ------------------------------------------------------------------

test.describe('card view [(dxSelectedCardKeys)]', () => {
    test('widget → signal', async ({ page }) => {
        await page.locator('#nb-cardview .dx-cardview-card').first().locator('.dx-checkbox').click();
        await expect(readout(page, 'nb-cardview-keys')).toHaveText(/\[\s*1\s*\]/);
    });
    test('signal → widget', async ({ page }) => {
        await readout(page, 'nb-cardview-set-keys').click();
        await expect(page.locator('#nb-cardview .dx-cardview-card').nth(1).locator('.dx-checkbox')).toHaveClass(/dx-checkbox-checked/);
    });
});

test.describe('card view [(dxPageIndex)] / [(dxPageSize)]', () => {
    test('widget → signal: the pager', async ({ page }) => {
        await page.locator('#nb-cardview .dx-pagination .dx-page', { hasText: '2' }).click();
        await expect(readout(page, 'nb-cardview-page')).toHaveText('1');
        await expect(page.locator('#nb-cardview .dx-cardview-card')).toContainText(['Initech']);
    });
    test('signal → widget: page index', async ({ page }) => {
        await readout(page, 'nb-cardview-set-page').click();
        await expect(page.locator('#nb-cardview .dx-pagination .dx-page.dx-selection')).toHaveText('2');
    });
    test('both directions: page size', async ({ page }) => {
        await readout(page, 'nb-cardview-set-size').click();
        await expect(page.locator('#nb-cardview .dx-cardview-card')).toHaveCount(3);
        // The widget writing its own paging option, the path its page-size
        // selector takes.
        await setOption(page, '#nb-cardview', 'paging.pageSize', 2);
        await expect(readout(page, 'nb-cardview-size')).toHaveText('2');
        await expect(page.locator('#nb-cardview .dx-cardview-card')).toHaveCount(2);
    });
});

test.describe('card view [(dxSearchPanelText)]', () => {
    test('widget → signal: typing into the search panel', async ({ page }) => {
        await page.locator('#nb-cardview .dx-cardview-search-panel input').pressSequentially('Glo');
        await expect(readout(page, 'nb-cardview-search')).toHaveText('Glo');
    });
    test('signal → widget', async ({ page }) => {
        await readout(page, 'nb-cardview-set-search').click();
        await expect(page.locator('#nb-cardview .dx-cardview-search-panel input')).toHaveValue('Ini');
        await expect(page.locator('#nb-cardview .dx-cardview-card')).toHaveCount(1);
        await expect(page.locator('#nb-cardview .dx-cardview-card')).toContainText('Initech');
    });
});

test.describe('card view [(dxFilterValue)]', () => {
    test('widget → signal: the widget writing its filter', async ({ page }) => {
        await setOption(page, '#nb-cardview', 'filterValue', ['customer', 'contains', 'x']);
        await expect(readout(page, 'nb-cardview-filter')).toContainText('contains');
    });
    test('signal → widget: filter, then clear', async ({ page }) => {
        await readout(page, 'nb-cardview-set-filter').click();
        await expect(page.locator('#nb-cardview .dx-cardview-card')).toHaveCount(1);
        await expect(page.locator('#nb-cardview .dx-cardview-card')).toContainText('Globex');
        await readout(page, 'nb-cardview-clear-filter').click();
        await expect(page.locator('#nb-cardview .dx-cardview-card')).toHaveCount(2);
    });
});

// ---- file manager -----------------------------------------------------------------

test.describe('file manager [(dxCurrentPathKeys)]', () => {
    test('widget → signal: opening a folder', async ({ page }) => {
        await page.locator('#nb-fm .dx-data-row', { hasText: 'Docs' }).dblclick();
        await expect(readout(page, 'nb-fm-path')).toHaveText(/\[\s*"Docs"\s*\]/);
    });
    test('signal → widget', async ({ page }) => {
        await readout(page, 'nb-fm-set-path').click();
        await expect(page.locator('#nb-fm .dx-filemanager-breadcrumbs')).toContainText('Docs');
        await expect(page.locator('#nb-fm .dx-data-row', { hasText: 'a.txt' })).toBeVisible();
    });
});

test.describe('file manager [(dxSelectedItemKeys)] and [(dxFocusedItemKey)]', () => {
    test('widget → signal: clicking an item selects and focuses it', async ({ page }) => {
        await readout(page, 'nb-fm-set-path').click();
        await page.locator('#nb-fm .dx-data-row', { hasText: 'a.txt' }).click();
        await expect(readout(page, 'nb-fm-selected')).toHaveText(/\[\s*"Docs\/a\.txt"\s*\]/);
        await expect(readout(page, 'nb-fm-focused')).toHaveText('Docs/a.txt');
    });
    test('signal → widget', async ({ page }) => {
        await readout(page, 'nb-fm-set-path').click();
        await expect(page.locator('#nb-fm .dx-data-row', { hasText: 'a.txt' })).toBeVisible();
        await readout(page, 'nb-fm-set-selected').click();
        await expect(page.locator('#nb-fm .dx-data-row.dx-selection')).toContainText('b.txt');
        await readout(page, 'nb-fm-set-focused').click();
        await expect(page.locator('#nb-fm .dx-data-row.dx-row-focused')).toContainText('a.txt');
    });
});

// ---- chart value axis ----------------------------------------------------------------

test.describe('chart [(dxValueAxisVisualRange)]', () => {
    test('widget → signal: a wheel zoom writes the range', async ({ page }) => {
        // Once rendered the chart reports the value axis' full range, so the
        // signal is already `{ startValue: 0, endValue: 9 }`; a zoom narrows it.
        await expect(readout(page, 'nb-chart-value-readout')).toContainText('"endValue": 9');
        const plot = page.locator('#nb-chart-value svg');
        await plot.scrollIntoViewIfNeeded();
        const box = (await plot.boundingBox())!;
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.wheel(0, -400);
        await expect(readout(page, 'nb-chart-value-readout')).not.toContainText('"endValue": 9');
        await expect(readout(page, 'nb-chart-value-readout')).toContainText('startValue');
    });
    test('signal → widget: a written pair zooms the axis and keeps its shape', async ({ page }) => {
        // Written as a `[2, 6]` pair. The chart applies it verbatim (measured:
        // no shape or bounds normalization on the way in, on either axis), so
        // the proof of the widget side is the axis's own visual range.
        await readout(page, 'nb-chart-value-set').click();
        await expect
            .poll(() =>
                page.evaluate(() =>
                    (window as unknown as { ng: { getComponent(el: Element | null): { instance: { getValueAxis(): { visualRange(): { startValue: unknown; endValue: unknown } } } } } }).ng
                        .getComponent(document.querySelector('#nb-chart-value'))
                        .instance.getValueAxis()
                        .visualRange(),
                ),
            )
            .toMatchObject({ startValue: 2, endValue: 6 });
        await expect(readout(page, 'nb-chart-value-readout')).toHaveText(/\[\s*2\s*,\s*6\s*\]/);
    });
});
