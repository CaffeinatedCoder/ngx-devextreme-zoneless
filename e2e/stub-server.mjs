/*
 * Deterministic DevExtreme.AspNet.Data protocol stub — the permanent e2e
 * fixture for the remote-data API (not scaffolding). Speaks the loadOptions
 * wire format the vendor's client libraries produce and the .NET
 * `DataSourceLoader` consumes: `filter`/`sort`/`group`/`select` JSON-encoded
 * in the query string, `skip`/`take`/`requireTotalCount`/`requireGroupCount`
 * plain. Latency and failures are injectable per test via `__config`, and
 * `__stats` exposes what the server actually received — so tests assert on
 * real HTTP traffic, not on app-side counters.
 *
 *   GET  /api/orders     grid dataset (id, customerId, customer, status, amount)
 *   GET  /api/customers  lookup/master dataset (id, name)
 *   POST /api/__config   {"delayMs":500,"failCount":2,"failStatus":500} (merged)
 *   POST /api/__reset    reset config and stats
 *   GET  /api/__stats    {"requests","byPath","last" (per path),"history"}
 *
 * Group support is single-level and non-expanded (key + count), which is the
 * shape a grouped grid header row needs; summaries are not implemented.
 */

import { createServer } from 'node:http';

const PORT = process.env.STUB_PORT ? Number(process.env.STUB_PORT) : 4300;

// --- deterministic fixture data ---------------------------------------------

const CUSTOMER_NAMES = [
    'Acme', 'Globex', 'Initech', 'Umbrella', 'Stark Industries', 'Wayne Enterprises',
    'Wonka', 'Tyrell', 'Cyberdyne', 'Soylent', 'Massive Dynamic', 'Hooli',
];
const STATUSES = ['Pending', 'Shipped', 'Delivered'];

const customers = CUSTOMER_NAMES.map((name, index) => ({ id: index + 1, name }));

const orders = Array.from({ length: 120 }, (unused, index) => {
    const id = index + 1;
    const customerId = (id * 7) % customers.length + 1;
    return {
        id,
        customerId,
        customer: customers[customerId - 1].name,
        status: STATUSES[id % STATUSES.length],
        amount: ((id * 37) % 900) + 50,
    };
});

const DATASETS = new Map([
    ['/api/orders', orders],
    ['/api/customers', customers],
]);

// --- injectable behavior + observability -------------------------------------

const defaultConfig = () => ({ delayMs: 0, failCount: 0, failStatus: 500 });
const defaultStats = () => ({ requests: 0, byPath: {}, last: {}, history: [] });
let config = defaultConfig();
let stats = defaultStats();

// --- loadOptions evaluation ---------------------------------------------------

function parseLoadOptions(searchParams) {
    const loadOptions = {};
    for (const key of ['skip', 'take']) {
        const value = searchParams.get(key);
        if (value !== null) loadOptions[key] = Number(value);
    }
    for (const key of ['requireTotalCount', 'requireGroupCount']) {
        const value = searchParams.get(key);
        if (value !== null) loadOptions[key] = value === 'true';
    }
    for (const key of ['filter', 'sort', 'group', 'select']) {
        const value = searchParams.get(key);
        if (value !== null) loadOptions[key] = JSON.parse(value);
    }
    return loadOptions;
}

const OPERATORS = {
    '=': (a, b) => normalize(a) === normalize(b),
    '<>': (a, b) => normalize(a) !== normalize(b),
    '>': (a, b) => a > b,
    '>=': (a, b) => a >= b,
    '<': (a, b) => a < b,
    '<=': (a, b) => a <= b,
    contains: (a, b) => String(a).toLowerCase().includes(String(b).toLowerCase()),
    notcontains: (a, b) => !String(a).toLowerCase().includes(String(b).toLowerCase()),
    startswith: (a, b) => String(a).toLowerCase().startsWith(String(b).toLowerCase()),
    endswith: (a, b) => String(a).toLowerCase().endsWith(String(b).toLowerCase()),
};

function normalize(value) {
    return typeof value === 'string' ? value.toLowerCase() : value;
}

function evaluateFilter(filter, item) {
    if (!Array.isArray(filter)) throw new Error(`unsupported filter: ${JSON.stringify(filter)}`);
    if (filter[0] === '!') return !evaluateFilter(filter[1], item);
    if (Array.isArray(filter[0])) {
        // [expr, 'and'|'or', expr, ...] — group with uniform combinator
        let result = evaluateFilter(filter[0], item);
        for (let index = 1; index < filter.length; index += 2) {
            const combinator = String(filter[index]).toLowerCase();
            const next = () => evaluateFilter(filter[index + 1], item);
            result = combinator === 'or' ? result || next() : result && next();
        }
        return result;
    }
    const [selector, operator, value] =
        filter.length === 2 ? [filter[0], '=', filter[1]] : filter;
    const evaluate = OPERATORS[operator];
    if (!evaluate) throw new Error(`unsupported operator: ${operator}`);
    return evaluate(item[selector], value);
}

function applySort(data, sort) {
    const sorted = [...data];
    const entries = Array.isArray(sort) ? sort : [sort];
    sorted.sort((left, right) => {
        for (const entry of entries) {
            const selector = typeof entry === 'string' ? entry : entry.selector;
            const desc = typeof entry === 'object' && entry.desc ? -1 : 1;
            const a = normalize(left[selector]);
            const b = normalize(right[selector]);
            if (a < b) return -1 * desc;
            if (a > b) return 1 * desc;
        }
        return 0;
    });
    return sorted;
}

function applyGroup(data, group) {
    const entry = Array.isArray(group) ? group[0] : group;
    const selector = typeof entry === 'string' ? entry : entry.selector;
    const desc = typeof entry === 'object' && entry.desc === true;
    const buckets = new Map();
    for (const item of data) {
        const key = item[selector];
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key).push(item);
    }
    const keys = [...buckets.keys()].sort((a, b) => {
        const left = normalize(a);
        const right = normalize(b);
        return (left < right ? -1 : left > right ? 1 : 0) * (desc ? -1 : 1);
    });
    return keys.map((key) => ({ key, items: null, count: buckets.get(key).length }));
}

function loadDataset(dataset, loadOptions) {
    let data = dataset;
    if (loadOptions.filter !== undefined) {
        data = data.filter((item) => evaluateFilter(loadOptions.filter, item));
    }
    const totalCount = loadOptions.requireTotalCount ? data.length : undefined;
    if (loadOptions.sort !== undefined) {
        data = applySort(data, loadOptions.sort);
    }
    if (loadOptions.group !== undefined) {
        let groups = applyGroup(data, loadOptions.group);
        const groupCount = loadOptions.requireGroupCount ? groups.length : undefined;
        if (loadOptions.skip) groups = groups.slice(loadOptions.skip);
        if (loadOptions.take !== undefined) groups = groups.slice(0, loadOptions.take);
        return { data: groups, totalCount, groupCount };
    }
    if (loadOptions.skip) data = data.slice(loadOptions.skip);
    if (loadOptions.take !== undefined) data = data.slice(0, loadOptions.take);
    if (loadOptions.select !== undefined) {
        const fields = Array.isArray(loadOptions.select) ? loadOptions.select : [loadOptions.select];
        data = data.map((item) => Object.fromEntries(fields.map((field) => [field, item[field]])));
    }
    return { data, totalCount };
}

// --- server -------------------------------------------------------------------

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function sendJson(response, status, body) {
    const payload = JSON.stringify(body);
    response.writeHead(status, { 'content-type': 'application/json' });
    response.end(payload);
}

async function readBody(request) {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    return chunks.length === 0 ? {} : JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

const server = createServer(async (request, response) => {
    const url = new URL(request.url, `http://localhost:${PORT}`);
    try {
        if (url.pathname === '/api/__config' && request.method === 'POST') {
            config = { ...config, ...(await readBody(request)) };
            return sendJson(response, 200, config);
        }
        if (url.pathname === '/api/__reset' && request.method === 'POST') {
            config = defaultConfig();
            stats = defaultStats();
            return sendJson(response, 200, { ok: true });
        }
        if (url.pathname === '/api/__stats') {
            return sendJson(response, 200, stats);
        }

        const dataset = DATASETS.get(url.pathname);
        if (dataset === undefined) {
            return sendJson(response, 404, { message: `no such dataset: ${url.pathname}` });
        }

        const loadOptions = parseLoadOptions(url.searchParams);
        const entry = { path: url.pathname, ...loadOptions };
        stats.requests += 1;
        stats.byPath[url.pathname] = (stats.byPath[url.pathname] ?? 0) + 1;
        stats.last[url.pathname] = entry;
        stats.history.push(entry);
        if (stats.history.length > 100) stats.history.shift();

        if (config.delayMs > 0) await sleep(config.delayMs);
        if (config.failCount > 0) {
            config.failCount -= 1;
            return sendJson(response, config.failStatus, { message: 'injected failure' });
        }
        return sendJson(response, 200, loadDataset(dataset, loadOptions));
    } catch (error) {
        return sendJson(response, 400, { message: String(error?.message ?? error) });
    }
});

server.listen(PORT, () => {
    console.log(`loadOptions stub listening on http://localhost:${PORT}`);
});
