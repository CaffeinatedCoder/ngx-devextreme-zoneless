import { expect, test, type APIRequestContext, type Locator, type Page } from '@playwright/test';

/**
 * Runtime contract tests for the remote-data API (`dxRemoteStore` +
 * `dxLoadOptionsParams`), driven through the reference screens at `/remote`
 * against the loadOptions stub (e2e/stub-server.mjs). The stub's `__config`
 * endpoint injects latency and failures per test, and `__stats` exposes the
 * requests it actually received — assertions about the wire protocol are made
 * against real HTTP traffic, not app-side counters.
 */

// The stub's config and stats are shared mutable state, so this file opts out
// of fully-parallel execution: tests run in order in a single worker.
test.describe.configure({ mode: 'default' });

const STUB = 'http://localhost:4300';

type StubLoadEntry = Record<string, unknown> & { path: string };

interface StubStats {
    readonly requests: number;
    readonly byPath: Record<string, number>;
    readonly last: Record<string, StubLoadEntry>;
    readonly history: readonly StubLoadEntry[];
}

const stubReset = (request: APIRequestContext): Promise<unknown> =>
    request.post(`${STUB}/api/__reset`);

const stubConfig = (request: APIRequestContext, config: object): Promise<unknown> =>
    request.post(`${STUB}/api/__config`, { data: config });

const stubStats = async (request: APIRequestContext): Promise<StubStats> => {
    const response = await request.get(`${STUB}/api/__stats`);
    return response.json() as Promise<StubStats>;
};

const readout = (page: Page, id: string): Locator => page.getByTestId(id);
const ordersRows = (page: Page): Locator =>
    page.locator('#grid-remote-orders .dx-data-row td:nth-child(2)');
const ordersPagerInfo = (page: Page): Locator =>
    page.locator('#grid-remote-orders .dx-pager .dx-info');

test.beforeEach(async ({ page, request }) => {
    await stubReset(request);
    await page.goto('/remote');
    await expect(page.locator('#grid-remote-orders .dx-data-row').first()).toBeVisible();
});

test.describe('remote grid', () => {
    test('loads the first page remotely with total count', async ({ page, request }) => {
        await expect(ordersPagerInfo(page)).toHaveText('Page 1 of 12 (120 items)');
        await expect(page.locator('#grid-remote-orders .dx-data-row')).toHaveCount(10);
        const stats = await stubStats(request);
        expect(stats.last['/api/orders']).toMatchObject({
            skip: 0,
            take: 10,
            requireTotalCount: true,
        });
    });

    test('paging is remote: page 2 requests skip=10', async ({ page, request }) => {
        await page.locator('#grid-remote-orders .dx-pages .dx-page').nth(1).click();
        await expect(
            page.locator('#grid-remote-orders .dx-data-row td:first-child').first(),
        ).toHaveText('11');
        await expect(readout(page, 'orders-page')).toHaveText('1');
        const stats = await stubStats(request);
        expect(stats.last['/api/orders']).toMatchObject({ skip: 10, take: 10 });
    });

    test('sorting is remote: header click sends a sort expression', async ({ page, request }) => {
        await page.locator('#grid-remote-orders .dx-header-row td', { hasText: 'Amount' }).click();
        await expect
            .poll(async () => (await stubStats(request)).last['/api/orders']?.['sort'])
            .toEqual([{ selector: 'amount', desc: false }]);
        const amounts = await page
            .locator('#grid-remote-orders .dx-data-row td:nth-child(4)')
            .allInnerTexts();
        const values = amounts.map(Number);
        expect(values).toEqual([...values].sort((a, b) => a - b));
    });
});

test.describe('external filter signals', () => {
    test('filter change resets to page 0 and requests the merged filter', async ({
        page,
        request,
    }) => {
        await page.locator('#grid-remote-orders .dx-pages .dx-page').nth(1).click();
        await expect(readout(page, 'orders-page')).toHaveText('1');

        await readout(page, 'orders-search').fill('acme');
        await expect(ordersPagerInfo(page)).toHaveText('Page 1 of 1 (10 items)');
        await expect(readout(page, 'orders-page')).toHaveText('0');
        for (const customer of await ordersRows(page).allInnerTexts()) {
            expect(customer).toBe('Acme');
        }
        const stats = await stubStats(request);
        expect(stats.last['/api/orders']).toMatchObject({
            skip: 0,
            filter: ['customer', 'contains', 'acme'],
        });
    });

    test('two external filters combine into one expression', async ({ page, request }) => {
        await readout(page, 'orders-search').fill('acme');
        await readout(page, 'orders-status').selectOption('Pending');
        await expect
            .poll(async () => (await stubStats(request)).last['/api/orders']?.['filter'])
            .toEqual([['customer', 'contains', 'acme'], 'and', ['status', '=', 'Pending']]);
    });

    test('debounce collapses keystrokes into a single request', async ({ page, request }) => {
        await stubReset(request);
        await readout(page, 'orders-search').pressSequentially('glo', { delay: 50 });
        await expect(ordersPagerInfo(page)).toHaveText('Page 1 of 1 (10 items)');
        const stats = await stubStats(request);
        expect(stats.byPath['/api/orders']).toBe(1);
    });
});

test.describe('slow endpoint', () => {
    test('isLoading tracks the in-flight load', async ({ page, request }) => {
        await stubConfig(request, { delayMs: 500 });
        await readout(page, 'orders-search').fill('stark');
        await expect(readout(page, 'orders-loading')).toHaveText('loading');
        await expect(readout(page, 'orders-loading')).toHaveText('idle');
        await expect(ordersRows(page).first()).toHaveText('Stark Industries');
    });

    test('superseded load is aborted: last write wins, no error surfaces', async ({
        page,
        request,
    }) => {
        await stubReset(request);
        await stubConfig(request, { delayMs: 500 });
        // First query: debounce fires at ~300ms, request in flight for 500ms.
        await readout(page, 'orders-search').fill('acme');
        await page.waitForTimeout(400);
        // Second query while the first is still in flight — supersedes it.
        await readout(page, 'orders-search').fill('globex');
        await expect(ordersRows(page).first()).toHaveText('Globex');
        for (const customer of await ordersRows(page).allInnerTexts()) {
            expect(customer).toBe('Globex');
        }
        // Both requests reached the server; the app shows neither an error
        // signal nor the grid's own load-error UI for the aborted one.
        const stats = await stubStats(request);
        expect(stats.byPath['/api/orders']).toBe(2);
        await expect(readout(page, 'orders-error')).toHaveText('');
        await expect(page.locator('#grid-remote-orders .dx-error-row')).toHaveCount(0);
    });
});

test.describe('failing endpoint', () => {
    test('load failure lands in the error signal; reload retries and clears it', async ({
        page,
        request,
    }) => {
        await stubConfig(request, { failCount: 1 });
        await readout(page, 'orders-reload').click();
        await expect(readout(page, 'orders-error')).toHaveText('injected failure');
        // The stub is healthy again — retry through the same reload() handle.
        await readout(page, 'orders-reload').click();
        await expect(readout(page, 'orders-error')).toHaveText('');
        await expect(ordersPagerInfo(page)).toHaveText('Page 1 of 12 (120 items)');
    });

    test('manual reload keeps the current page', async ({ page }) => {
        await page.locator('#grid-remote-orders .dx-pages .dx-page').nth(1).click();
        await expect(readout(page, 'orders-page')).toHaveText('1');
        await readout(page, 'orders-reload').click();
        await expect(
            page.locator('#grid-remote-orders .dx-data-row td:first-child').first(),
        ).toHaveText('11');
        await expect(readout(page, 'orders-page')).toHaveText('1');
    });
});

test.describe('master-detail', () => {
    test('selection signal drives the detail query without a request when empty', async ({
        page,
        request,
    }) => {
        // No selection: the detail load short-circuits client-side.
        await expect(page.locator('#grid-detail-orders .dx-datagrid-nodata')).toBeVisible();
        const before = await stubStats(request);

        await page.locator('#grid-customers .dx-data-row', { hasText: 'Acme' }).click();
        await expect(readout(page, 'detail-customer')).toHaveText('1');
        await expect(page.locator('#grid-detail-orders .dx-data-row')).toHaveCount(6);
        const stats = await stubStats(request);
        expect(stats.last['/api/orders']).toMatchObject({
            take: 6,
            filter: ['customerId', '=', 1],
        });
        expect(stats.byPath['/api/orders']).toBe((before.byPath['/api/orders'] ?? 0) + 1);

        // Switching the master selection re-queries the detail.
        await page.locator('#grid-customers .dx-data-row', { hasText: 'Globex' }).click();
        await expect(readout(page, 'detail-customer')).toHaveText('2');
        await expect
            .poll(async () => (await stubStats(request)).last['/api/orders']?.['filter'])
            .toEqual(['customerId', '=', 2]);
    });
});

test.describe('lookup editor', () => {
    test('search goes to the server as a filter expression', async ({ page, request }) => {
        const input = page.locator('#lookup-customer input.dx-texteditor-input');
        await input.click();
        await input.pressSequentially('wonka', { delay: 50 });
        // The unfiltered dropdown already contains Wonka, so wait for the
        // server-side search to actually narrow the list before picking —
        // otherwise the click can land before the widget's search timeout.
        await expect(page.locator('.dx-list-item')).toHaveCount(1);
        await page.locator('.dx-list-item-content', { hasText: 'Wonka' }).click();
        await expect(readout(page, 'lookup-readout')).toHaveText('7');
        const stats = await stubStats(request);
        // The widget's search phrase arrived as a protocol filter (folded via
        // useDefaultSearch, which wraps the clause in a group array), not as
        // searchValue/searchExpr parameters. After the pick the widget
        // reloads without the search text, so assert against the request
        // history rather than the newest request.
        expect(
            stats.history.some(
                (entry) =>
                    entry.path === '/api/customers' &&
                    JSON.stringify(entry['filter']) ===
                        JSON.stringify([['name', 'contains', 'wonka']]),
            ),
        ).toBe(true);
    });

    test('programmatic value resolves its display text through byKey', async ({
        page,
        request,
    }) => {
        await stubReset(request);
        await readout(page, 'lookup-set').click();
        await expect(page.locator('#lookup-customer input.dx-texteditor-input')).toHaveValue(
            'Cyberdyne',
        );
        await expect(readout(page, 'lookup-readout')).toHaveText('9');
        const stats = await stubStats(request);
        expect(stats.last['/api/customers']).toMatchObject({
            take: 1,
            filter: ['id', '=', 9],
        });
    });
});

test.describe('widget re-creation', () => {
    test('a re-created grid re-attaches to the surviving store and its query', async ({
        page,
    }) => {
        await readout(page, 'orders-search').fill('acme');
        await expect(ordersPagerInfo(page)).toHaveText('Page 1 of 1 (10 items)');

        await readout(page, 'orders-toggle').click();
        await expect(page.locator('#grid-remote-orders')).toHaveCount(0);

        await readout(page, 'orders-toggle').click();
        await expect(ordersRows(page).first()).toHaveText('Acme');
        await expect(ordersPagerInfo(page)).toHaveText('Page 1 of 1 (10 items)');
        await expect(readout(page, 'orders-error')).toHaveText('');
    });
});
