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
 *   GET  /api/collated   collation dataset (id, name) — honours `langParams`
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

// A small hierarchy for the TreeList's remote lazy loading. `parentId` is the
// hierarchy's own field; the *protocol* member that carries the expanding rows
// is `parentIds`, which the endpoint below answers on.
// Roots carry `parentId: 0`, not null: DevExtreme's TreeList defaults
// `rootValue` to 0 and asks for the roots as `parentIds: [0]`.
const nodes = [
    { id: 1, parentId: 0, name: 'Europe', kind: 'region' },
    { id: 2, parentId: 0, name: 'Americas', kind: 'region' },
    { id: 3, parentId: 1, name: 'Germany', kind: 'country' },
    { id: 4, parentId: 1, name: 'France', kind: 'country' },
    { id: 5, parentId: 2, name: 'Canada', kind: 'country' },
    { id: 6, parentId: 3, name: 'Berlin', kind: 'city' },
    { id: 7, parentId: 3, name: 'Hamburg', kind: 'city' },
    { id: 8, parentId: 4, name: 'Paris', kind: 'city' },
    { id: 9, parentId: 5, name: 'Toronto', kind: 'city' },
];

// Language-sensitive sorting. Code-unit order puts 'Öl' (U+00D6) last, after
// 'Zebra'; German collation sorts 'ö' with 'o', putting it second. That gap is
// what makes `langParams` observable in rendered output rather than only on the
// wire — its own path, since the row order here is nobody else's business.
const collated = [
    { id: 1, name: 'Zebra' },
    { id: 2, name: 'Öl' },
    { id: 3, name: 'Apfel' },
    { id: 4, name: 'Osten' },
];

const DATASETS = new Map([
    ['/api/orders', orders],
    // Same rows on a second path: the grouped/summarized screen must not add
    // traffic to `/api/orders`, whose request counts and injected failures the
    // paging, debounce and error tests assert against.
    ['/api/grouped-orders', orders],
    ['/api/customers', customers],
    ['/api/nodes', nodes],
    ['/api/collated', collated],
]);

// --- injectable behavior + observability -------------------------------------

const defaultConfig = () => ({ delayMs: 0, failCount: 0, failStatus: 500, stringCounts: false });
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
    for (const key of ['filter', 'sort', 'group', 'select', 'totalSummary', 'groupSummary', 'parentIds', 'langParams']) {
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

function applySort(data, sort, langParams) {
    // `langParams` carries the protocol's language-sensitive sorting contract
    // ({locale, collatorOptions}). Honoured rather than merely recorded, so a
    // client that drops it produces visibly different row order — which is what
    // lets an e2e prove the forwarding instead of trusting it.
    const collator =
        langParams && langParams.locale
            ? new Intl.Collator(langParams.locale, langParams.collatorOptions)
            : undefined;
    const sorted = [...data];
    const entries = Array.isArray(sort) ? sort : [sort];
    sorted.sort((left, right) => {
        for (const entry of entries) {
            const selector = typeof entry === 'string' ? entry : entry.selector;
            const desc = typeof entry === 'object' && entry.desc ? -1 : 1;
            const a = normalize(left[selector]);
            const b = normalize(right[selector]);
            if (collator && typeof a === 'string' && typeof b === 'string') {
                const compared = collator.compare(a, b);
                if (compared !== 0) return compared * desc;
                continue;
            }
            if (a < b) return -1 * desc;
            if (a > b) return 1 * desc;
        }
        return 0;
    });
    return sorted;
}

/**
 * Positional summary values, in the order the descriptors were given —
 * the protocol never echoes a selector back, so position is the only key.
 */
function computeSummary(rows, descriptors) {
    const list = Array.isArray(descriptors) ? descriptors : [descriptors];
    return list.map((descriptor) => {
        const selector = typeof descriptor === 'string' ? descriptor : descriptor.selector;
        const type = typeof descriptor === 'string' ? 'count' : descriptor.summaryType ?? 'count';
        const values = rows.map((row) => row[selector]);
        const numbers = values.filter((value) => typeof value === 'number');
        let result;
        switch (type) {
            case 'count': result = rows.length; break;
            case 'sum': result = numbers.reduce((total, value) => total + value, 0); break;
            case 'avg': result = numbers.length === 0 ? null : numbers.reduce((t, v) => t + v, 0) / numbers.length; break;
            case 'min': result = numbers.length === 0 ? null : Math.min(...numbers); break;
            case 'max': result = numbers.length === 0 ? null : Math.max(...numbers); break;
            default: result = null;
        }
        // A decimal-backed server spells an aggregate as a quoted string; the
        // `stringCounts` switch reproduces that spelling here too.
        return config.stringCounts && typeof result === 'number' ? String(result) : result;
    });
}

function applyGroup(data, group, groupSummary) {
    const entry = Array.isArray(group) ? group[0] : group;
    const selector = typeof entry === 'string' ? entry : entry.selector;
    const desc = typeof entry === 'object' && entry.desc === true;
    // A group is collapsed unless the widget says otherwise: the protocol's
    // collapsed shape is `{key, items: null, count}`.
    const expanded = typeof entry === 'object' && entry.isExpanded === true;
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
    return keys.map((key) => {
        const rows = buckets.get(key);
        const groupItem = { key, items: expanded ? rows : null, count: rows.length };
        // `summary` is absent unless `groupSummary` asked for it.
        if (groupSummary !== undefined) {
            groupItem.summary = computeSummary(rows, groupSummary);
        }
        return groupItem;
    });
}

function loadDataset(dataset, loadOptions, path) {
    let data = dataset;
    // Hierarchical read: answer the children of the expanding rows. Absent
    // `parentIds` the widget is asking for the roots. The reference .NET
    // server parses no such member — a remote hierarchy is a contract between
    // the widget and this endpoint, which is exactly what it is proving here.
    if (path === '/api/nodes') {
        const parentIds = loadOptions.parentIds;
        const wanted = Array.isArray(parentIds) ? parentIds : parentIds === undefined ? [0] : [parentIds];
        data = data.filter((node) => wanted.some((parent) => node.parentId === parent));
        return { data: data.map((node) => ({ ...node, hasItems: dataset.some((c) => c.parentId === node.id) })) };
    }
    if (loadOptions.filter !== undefined) {
        data = data.filter((item) => evaluateFilter(loadOptions.filter, item));
    }
    const totalCount = loadOptions.requireTotalCount ? data.length : undefined;
    if (loadOptions.sort !== undefined) {
        data = applySort(data, loadOptions.sort, loadOptions.langParams);
    }
    if (loadOptions.group !== undefined) {
        let groups = applyGroup(data, loadOptions.group, loadOptions.groupSummary);
        const groupCount = loadOptions.requireGroupCount ? groups.length : undefined;
        if (loadOptions.skip) groups = groups.slice(loadOptions.skip);
        if (loadOptions.take !== undefined) groups = groups.slice(0, loadOptions.take);
        const groupedSummary =
            loadOptions.totalSummary === undefined
                ? undefined
                : computeSummary(data, loadOptions.totalSummary);
        return spellCounts({ data: groups, totalCount, groupCount, summary: groupedSummary });
    }
    if (loadOptions.skip) data = data.slice(loadOptions.skip);
    if (loadOptions.take !== undefined) data = data.slice(0, loadOptions.take);
    if (loadOptions.select !== undefined) {
        const fields = Array.isArray(loadOptions.select) ? loadOptions.select : [loadOptions.select];
        data = data.map((item) => Object.fromEntries(fields.map((field) => [field, item[field]])));
    }
    const summary =
        loadOptions.totalSummary === undefined
            ? undefined
            : computeSummary(dataset, loadOptions.totalSummary);
    return spellCounts({ data, totalCount, summary });
}

// DevExtreme.AspNet.Data spells decimals as quoted JSON strings, so a server whose
// counts/summaries come back as decimal answers `"42"` where the typings promise 42.
function spellCounts(result) {
    if (!config.stringCounts) return result;
    const out = { ...result };
    if (out.totalCount !== undefined) out.totalCount = String(out.totalCount);
    if (out.groupCount !== undefined) out.groupCount = String(out.groupCount);
    return out;
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
        return sendJson(response, 200, loadDataset(dataset, loadOptions, url.pathname));
    } catch (error) {
        return sendJson(response, 400, { message: String(error?.message ?? error) });
    }
});

server.listen(PORT, () => {
    console.log(`loadOptions stub listening on http://localhost:${PORT}`);
});
