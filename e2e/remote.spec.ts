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
    // Every screen must have finished its initial load before a test body runs:
    // the stub's config (injected failures, latency, count spelling) and its
    // stats are shared, so a screen still loading would eat an injected failure
    // or skew a request count belonging to another screen.
    await expect(page.locator('#grid-remote-orders .dx-data-row').first()).toBeVisible();
    await expect(page.locator('#grid-grouped .dx-group-row').first()).toBeVisible();
    await expect(page.locator('#tree-nodes .dx-data-row').first()).toBeVisible();
    await expect(page.locator('#grid-collated .dx-data-row').first()).toBeVisible();
    await expect(page.locator('#lookup-customer')).toBeVisible();
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

    // A manual reload landing inside the debounce window used to *race* the
    // pending dependency run: the reload fetched, then the debounced run fired
    // anyway with its own page-0 reset, and the grid corrected itself in
    // between — four round trips, measured, where the dependency change alone
    // costs one, and the page moved a few hundred milliseconds after the user
    // had already asked for fresh data. `reload()` now adopts the pending
    // change instead: it takes the page-0 reset and drops the timer.
    //
    // Two requests is the floor here, not one, and the pair is worth naming:
    // resetting the page and refetching are separate `DataSource` operations,
    // so a grid sitting on page 1 issues its current-page load (`skip: 10`)
    // before the page-0 load that carries `requireTotalCount`. Collapsing
    // those would mean reaching into the widget's own paging controller, which
    // this store deliberately does not do — it owns a DataSource, not a grid.
    test('a reload inside the debounce window adopts the pending change', async ({
        page,
        request,
    }) => {
        await page.locator('#grid-remote-orders .dx-pages .dx-page').nth(1).click();
        await expect(readout(page, 'orders-page')).toHaveText('1');
        await stubReset(request);

        await readout(page, 'orders-search').fill('acme');
        await readout(page, 'orders-reload').click();

        await expect(ordersPagerInfo(page)).toHaveText('Page 1 of 1 (10 items)');
        await expect(readout(page, 'orders-page')).toHaveText('0');
        await expect
            .poll(async () => (await stubStats(request)).byPath['/api/orders'])
            .toBe(2);
        // ... and the second of those is the page-0 read, not a repeat of the
        // first — the adopted reset, rather than a duplicated dependency run.
        const sent = (await stubStats(request)).history
            .filter((entry) => entry.path === '/api/orders')
            .map((entry) => entry['skip']);
        expect(sent).toEqual([10, 0]);
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

    // The supersede contract must hold even for a loader that never forwards
    // its AbortSignal to the transport. What protects it then is vendor
    // internals, measured against 26.1.3: the DataSource load queue is FIFO
    // per instance, the grid cancels the superseded operation id on every new
    // load, and _loadFromStore drops any result whose deferred has settled.
    // Those are untyped internals — a version-sensitive spot this suite
    // exists to pin. If this goes red after a DevExtreme bump, a stale
    // response is overwriting the newest query.
    test('a stale resolve from an abort-ignoring loader never overwrites the newest query', async ({
        page,
        request,
    }) => {
        await stubReset(request);
        await page.getByTestId('orders-ignore-abort').click();
        const ordersCount = async (): Promise<number> =>
            (await stubStats(request)).byPath['/api/orders'] ?? 0;

        // Slow load A (status=Pending) sleeps at the stub for 1000ms.
        await stubConfig(request, { delayMs: 1000 });
        await readout(page, 'orders-status').selectOption('Pending');
        await expect.poll(ordersCount).toBe(1);

        // Fast load B (status=Shipped) supersedes A and settles immediately —
        // so A's un-aborted response arrives last.
        await stubConfig(request, { delayMs: 0 });
        await readout(page, 'orders-status').selectOption('Shipped');
        await expect.poll(ordersCount).toBe(2);

        // The ignoring loader keeps isLoading true until A settles; 'idle'
        // therefore means the stale response has fully arrived.
        await expect(readout(page, 'orders-loading')).toHaveText('idle', { timeout: 8000 });
        await page.waitForTimeout(300);

        for (const status of await page
            .locator('#grid-remote-orders .dx-data-row td:nth-child(3)')
            .allInnerTexts()) {
            expect(status).toBe('Shipped');
        }
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

test.describe('cancellation scope', () => {
    // `reload()` supersedes the *query*. A `byKey` lookup is scoped to a key
    // the widget already holds, so aborting it along with the query loads
    // leaves the editor permanently blank: the widget asked for a display
    // text, got a rejection, and never asks again.
    test('reload() does not cancel an in-flight byKey', async ({ page, request }) => {
        await stubConfig(request, { delayMs: 400 });

        await readout(page, 'lookup-set').click();
        await page.waitForTimeout(80);
        await readout(page, 'lookup-reload').click();

        await expect(page.locator('#lookup-customer input.dx-texteditor-input')).toHaveValue(
            'Cyberdyne',
        );
        await stubConfig(request, { delayMs: 0 });
    });
});

test.describe('loader contract', () => {
    // A load function that is not declared `async` throws synchronously. If
    // that escapes the tracking, the in-flight count never comes back down:
    // `isLoading` stays `true` for the rest of the session and the reason
    // never reaches `error`.
    test('a synchronously throwing load function settles isLoading and surfaces the error', async ({
        page,
    }) => {
        await expect(readout(page, 'orders-loading')).toHaveText('idle');

        await readout(page, 'orders-break').click();
        await readout(page, 'orders-reload').click();

        await expect(readout(page, 'orders-error')).toHaveText('sync loader failure');
        await expect(readout(page, 'orders-loading')).toHaveText('idle');
    });

    // The same defect on the key-lookup path, where DevExtreme offers no
    // safety net at all: `invokeUserByKeyFunc` calls the user function bare,
    // and `_renderValue` discards the deferred it would have rejected — so a
    // `byKey` that is not declared `async` throws straight out through the
    // editor's own render. Without the store funnelling that into a rejection
    // it lands as an uncaught error at the Angular boundary.
    test('a synchronously throwing byKey rejects instead of escaping as an uncaught error', async ({
        page,
    }) => {
        // Angular's ErrorHandler intercepts anything that escapes into its
        // call stack and routes it to console.error, so an escaping throw
        // never reaches window.onerror — a `pageerror` probe stays silent
        // whether the guard is there or not. The console is the only channel
        // that can actually see this one.
        const consoleErrors: string[] = [];
        page.on('console', (message) => {
            if (message.type() === 'error') {
                consoleErrors.push(message.text());
            }
        });

        await readout(page, 'lookup-break-bykey').click();
        await readout(page, 'lookup-set-other').click();

        // The value signal still round-trips; only the display text is lost,
        // which is what a rejected lookup is supposed to look like.
        await expect(readout(page, 'lookup-readout')).toHaveText('7');
        await page.waitForTimeout(300);
        expect(consoleErrors.filter((text) => text.includes('sync byKey failure'))).toEqual([]);
    });
});

test.describe('wire protocol conformance', () => {
    // The protocol's reference server implementations aggregate counts into a
    // decimal and spell a decimal as a quoted JSON string, so a conformant
    // endpoint may answer `"120"` where DevExtreme's typings promise `120`.
    // Forwarded untouched the pager concatenates instead of adding — a
    // 120-row result renders as "Page 1 of 120 (1200 items)". `groupCount` is
    // corrupted the same way but lands elsewhere; see the grouping section.
    test('a string-spelled totalCount is read as a number', async ({ page, request }) => {
        await stubConfig(request, { stringCounts: true });
        await page.reload();
        await expect(page.locator('#grid-remote-orders .dx-data-row').first()).toBeVisible();

        await expect(ordersPagerInfo(page)).toHaveText('Page 1 of 12 (120 items)');

        await stubConfig(request, { stringCounts: false });
    });
});

test.describe('remote grouping and summaries', () => {
    // `groupCount` never reaches the pager — that reads a different total.
    // It reaches the data controller's row count, which is where the grid
    // computes `totalItemsCount - totalCount + groupCount`.
    const groupedTotalItemsCount = (page: Page): Promise<number> =>
        page.evaluate(() => {
            const element = document.querySelector('#grid-grouped') as HTMLElement;
            const ng = (
                window as unknown as {
                    ng: {
                        getComponent(e: HTMLElement): {
                            instance: { getController(name: string): { totalItemsCount(): number } };
                        };
                    };
                }
            ).ng;
            return ng.getComponent(element).instance.getController('data').totalItemsCount();
        });
    const groupRequests = (stats: StubStats): readonly StubLoadEntry[] =>
        stats.history.filter((entry) => entry.path === '/api/grouped-orders' && entry['group'] !== undefined);

    test('the group descriptor and both summary expressions reach the wire', async ({
        page,
        request,
    }) => {
        await expect(page.locator('#grid-grouped .dx-group-row').first()).toBeVisible();

        const last = groupRequests(await stubStats(request)).at(-1);
        // `isExpanded` rides on the group descriptor — the member that decides
        // whether the server answers the protocol's collapsed shape
        // (`{key, items: null, count}`) or a populated one.
        expect(last?.['group']).toEqual([
            { selector: 'status', desc: false, isExpanded: false },
        ]);
        expect(last?.['groupSummary']).toEqual([{ selector: 'amount', summaryType: 'sum' }]);
        expect(last?.['totalSummary']).toEqual([{ selector: 'amount', summaryType: 'sum' }]);
    });

    test('a total summary from the envelope renders in the grid footer', async ({ page }) => {
        await expect(page.locator('#grid-grouped .dx-datagrid-total-footer')).toContainText('Sum');
    });

    // `groupCount` is the other half of the decimal-as-string problem, and it
    // feeds the pager exactly as `totalCount` does. Rather than hardcode a
    // number, this pins the invariant the coercion exists for: how the server
    // chooses to spell its decimals must make no difference to what renders.
    test('a string-spelled groupCount is added to the row count, not concatenated', async ({
        page,
        request,
    }) => {
        // Precondition — without a group count on the wire the coercion has
        // nothing to act on and this case would prove nothing.
        const asked = (await stubStats(request)).last['/api/grouped-orders'];
        expect(asked?.['requireGroupCount']).toBe(true);

        const numeric = await groupedTotalItemsCount(page);
        expect(Number.isInteger(numeric)).toBe(true);

        await stubConfig(request, { stringCounts: true });
        await page.reload();
        await expect(page.locator('#grid-grouped .dx-group-row').first()).toBeVisible();

        // Uncoerced, `470 + "3"` yields 4703 rather than 473 — a silently
        // digit-shifted row count that every downstream consumer then treats
        // as a number.
        expect(await groupedTotalItemsCount(page)).toBe(numeric);

        await stubConfig(request, { stringCounts: false });
    });

    // `summary` is deliberately NOT coerced the way the counts are: it is
    // positional and may legitimately carry a non-numeric aggregate, so a
    // string-spelled summary must reach the consumer exactly as sent.
    test('string-spelled summary values pass through untouched', async ({ page, request }) => {
        await stubConfig(request, { stringCounts: true });
        await page.reload();
        await expect(page.locator('#grid-grouped .dx-datagrid-total-footer')).toContainText('Sum');
        await stubConfig(request, { stringCounts: false });
    });
});

test.describe('language-sensitive sorting (langParams)', () => {
    // `langParams` is the one loadOptions member the serializer used to drop
    // outright, and it was unreachable from this package in both directions:
    // it lives on the DataSource, which dxRemoteStore builds internally, and it
    // is absent from DevExtreme's own `LoadOptions` typing so nothing flagged
    // the omission.
    test('langParams reaches the wire, and the server collates with it', async ({
        page,
        request,
    }) => {
        const sent = (await stubStats(request)).last['/api/collated'];
        expect(sent?.['langParams']).toEqual({ locale: 'de' });

        // German collation sorts 'ö' with 'o', so 'Öl' lands second. Code-unit
        // order — what the server falls back to the moment the client drops
        // `langParams` — puts it last, after 'Zebra'. The rendered order is
        // therefore the round-trip proof, not just the recorded request.
        await expect(page.locator('#grid-collated .dx-data-row td')).toHaveText([
            'Apfel',
            'Öl',
            'Osten',
            'Zebra',
        ]);
    });
});

test.describe('remote hierarchy (parentIds)', () => {
    // `parentIds` is the one loadOptions member a TreeList adds, and the
    // protocol's reference .NET server parses no such member — so a remote
    // hierarchy is a contract between the widget and the consumer's endpoint.
    // Dropping it client-side makes that contract unimplementable, which is
    // what this pins.
    test('roots load, and expanding a node requests its children by key', async ({
        page,
        request,
    }) => {
        const rows = page.locator('#tree-nodes .dx-data-row');
        await expect(rows).toHaveCount(2);

        await page.locator('#tree-nodes .dx-treelist-collapsed').first().click();

        await expect(rows).toHaveCount(4);
        const sent = (await stubStats(request)).history
            .filter((entry) => entry.path === '/api/nodes')
            .map((entry) => entry['parentIds']);
        // The root read asks for DevExtreme's root sentinel (0, not null),
        // then the expansion asks for the expanded row's own key.
        expect(sent).toEqual([[0], [1]]);
    });
});
