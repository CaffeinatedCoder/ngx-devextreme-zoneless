# Data loading and remote data

Two-way state is one half of the zoneless problem; the other half is data
loading — DevExtreme components load through `DataSource`/stores, which know
nothing about signals.

## Array data in a signal

`dxArrayStoreSource` wraps a `Signal<readonly T[]>` in a `DataSource` that
reloads whenever the signal changes:

```ts
readonly orders = signal<readonly Order[]>([]);
readonly ordersSource = dxArrayStoreSource(this.orders, { key: 'id' });
// <dx-data-grid [dataSource]="ordersSource" />
```

## Signal-driven reloads

`dxReloadOn` triggers a reload whenever dependency signals change, so external
filter state needs no hand-written `refresh()` plumbing:

```ts
readonly search = signal('');

// e.g. a DevExtreme.AspNet.Data endpoint:
readonly source = new DataSource({
  store: createStore({ loadUrl: '/api/orders', key: 'id' }),
});

constructor() {
  dxReloadOn(this.source, [this.search]);
}
```

The target can also be a callback (`dxReloadOn(() => this.grid()?.refresh(), [deps])`)
for anything that is not a `DataSource`.

## The ecosystem: who does what

A DevExtreme widget never fetches data itself. When a grid needs page two,
filtered and sorted, it writes that request down as a plain object — the
**loadOptions**: rows to skip and take, the filter, the sort order, grouping,
summaries — and hands it to its data source. Everything called "remote data"
is the story of who turns that object into an HTTP request and who executes
it. Four things have to be in place before the server does the heavy lifting,
and no single package provides all four:

1. **The widget must be told to delegate.** That is `remoteOperations`
   (`[remoteOperations]="true"` or a per-operation object). The default,
   `'auto'`, resolves to *all local* for a custom store: the widget fetches
   everything once and pages, filters and sorts in the browser — fine for
   hundreds of rows, wrong for a million.
2. **A store that hands loadOptions through** instead of executing them
   locally.
3. **A serializer** that turns the loadOptions object into query parameters a
   server can read.
4. **A server that executes them** and answers in the shape the widget
   expects: `{ data, totalCount, groupCount, summary }`, a collapsed group as
   `{ key, items: null, count }`.

### What devextreme and devextreme-angular bring

`devextreme-angular` is the component layer only; it contributes nothing to
data loading. The data layer lives in the `devextreme` core package:

- **`ArrayStore`** — in-memory data, no server involved;
- **`ODataStore`** — a complete client for OData services, but its query
  builder has no spelling for grouping, group paging or summaries (verified
  against the installed 26.1.4 source), so those always run in the browser.
  The full `remoteOperations` matrix rides loadOptions only;
- **`CustomStore`** — the raw seam: you write the `load` function, DevExtreme
  passes you the loadOptions object, and everything after that is yours.

So out of the box you get layer 1 and the *hook* for layer 2 — no serializer,
no server, no loading or error state you can render outside the widget, and
nothing signal-aware.

### When you need DevExtreme.AspNet.Data

The vendor's answer to layers 3 and 4 is one project with two halves:

- **The server half** — the `DevExtreme.AspNet.Data` NuGet package.
  `DataSourceLoader.Load(queryable, loadOptions)` applies filter, sort,
  paging, grouping and summaries to an `IQueryable`, so Entity Framework
  translates them into SQL. Use it (or a counterpart for another stack — PHP
  and MongoDB ones exist) whenever the server should execute the operations
  rather than each endpoint hand-writing them. The protocol is the contract,
  not the package: any endpoint that reads the same parameters and answers
  the same shape works — this repo's e2e stub (`e2e/stub-server.mjs`) is one.
- **The client half** — the `devextreme-aspnet-data` npm package.
  `createStore({ loadUrl, insertUrl, … })` is a prebuilt `CustomStore` that
  serializes, sends and parses for you. It predates signals and owns the HTTP
  call: it never reads an `AbortSignal` (its transport is `XMLHttpRequest`,
  so superseded requests cannot be cancelled), exposes no loading or error
  state to your templates, and offers no hook to repair a response envelope.
  Where it still earns its place is **editing**: `insertUrl`/`updateUrl`/
  `deleteUrl` have no counterpart here (see
  [Scope](#scope-load-only-by-design)).

### Where this package fits

`dxRemoteStore` + `dxLoadOptionsParams` are the client half rebuilt for
signals and zoneless change detection, for read paths: the same query-string
format through your own `fetch` (auth headers, interceptors and the
`AbortSignal` stay in your hands), `isLoading`/`error`/`reload()` as signals,
last-write-wins cancellation, dependency-driven reloads, `byKey` for lookup
editors, and count coercion for servers that spell numbers as strings. The
server side stays whatever conformant endpoint you already have.

### The protocol's edges — measured, not assumed

The loadOptions object is wider than what any server parses. The table below
is measured, not quoted from documentation: the client side against the
installed devextreme 26.1.4, the server side against DevExtreme.AspNet.Data's
source at 5.2.0 — whose parser is byte-identical since 5.0.0 and binds
exactly eleven keys.

| Member | Does the client send it? | Reference server | Consequence |
|---|---|---|---|
| `filter`, `sort`, `group`, `select`, `skip`, `take`, `requireTotalCount`, `requireGroupCount`, `totalSummary`, `groupSummary` | yes, as each remote operation needs them | parses all ten | the paved road — nothing to do |
| `parentIds` (TreeList hierarchy) | yes — plus an equivalent `filter` on the parent-id field | ignores it, in every 5.x; the vendor's own demos read it by hand in the controller | remote hierarchy is a contract between the widget and *your* endpoint; `dxLoadOptionsParams` carries it so the choice stays yours |
| `langParams` (sort and filter text the way the user's locale does) | only when filtering *and* sorting are both remote; absent from the public typings | ignores it | your endpoint decides collation; `dxLoadOptionsParams` carries it (see [below](#language-sensitive-sorting)) |
| `searchValue` / `searchExpr` / `searchOperation` | normally never — search is folded into `filter` before your `load` runs | ignores them | `dxRemoteStore` opts into the folding (`useDefaultSearch`), matching the vendor client. A hand-rolled `CustomStore` without `useDefaultSearch: true` receives all three raw — and no server parses them |
| `startDate` / `endDate` (Scheduler) | never — they exist in the typings only; the Scheduler folds its visible range into `filter` | ignores them | nothing to do |
| `userData` | attached to every load, but permanently `{}` in 26.1.4 — no public API fills it | ignores it | nothing to do; not serialized |
| `isLoadingAll` | only on "load everything" operations (export-all) | ignores it | a hint, safe to drop; not serialized |
| `expand`, `customQueryParams` | never to a custom store — ODataStore-only | — | a different protocol |

The asymmetry runs both ways: the reference server also parses an
`isCountQuery` key the JavaScript client never sends. And on the way back,
some conformant servers spell `totalCount`/`groupCount` as quoted strings
(`"120"`) where the .NET reference answers plain numbers — `dxRemoteStore`
coerces the counts when they parse as numbers and deliberately leaves
`summary` values untouched, because a summary may legitimately be a `min`
over a string or date column.

## Remote data (`dxRemoteStore`) <sup>developer preview in 2.1</sup>

For server-side loading, `dxRemoteStore` wraps a load function in a
`DataSource` and exposes the loading state the widget cannot show for you,
using Angular `resource()` vocabulary — no third dialect. This section is
written from the reference screens in `smoke/src/remote.component.ts`, which
run in CI against a DevExtreme.AspNet.Data protocol stub
(`e2e/stub-server.mjs`) including slow- and failing-endpoint cases.

```ts
readonly search = signal('');
readonly status = signal<string | null>(null);

readonly orders = dxRemoteStore<Order, number>({
  key: 'id',
  deps: [this.search, this.status],   // query state living outside the widget
  debounce: 300,                      // for keystroke-fed dependency signals
  load: async (options, signal) => {
    // options: DevExtreme LoadOptions (filter/sort/skip/take/…) from the widget;
    // merge your external filter signals and go to the server:
    const filter = combineFilters(options.filter, myExternalFilter());
    const response = await fetch(`/api/orders?${dxLoadOptionsParams({ ...options, filter })}`, { signal });
    if (!response.ok) throw new Error(`orders failed: ${response.status}`);
    return response.json(); // { data, totalCount } — or a plain array
  },
});
```

```html
<dx-data-grid [dataSource]="orders.dataSource" [remoteOperations]="true">…</dx-data-grid>
@if (orders.isLoading()) { <app-spinner /> }
@if (orders.error(); as error) { <button (click)="orders.reload()">retry</button> }
```

`dxLoadOptionsParams` serializes `LoadOptions` into the exact query-string
format DevExtreme.AspNet.Data server libraries parse (JSON-encoded
`filter`/`sort`/`group`/`select`/summaries, plain `skip`/`take`/
`requireTotalCount`/`requireGroupCount`) — the same wire format the vendor's
`createStore({ loadUrl })` produces, but through your own `fetch`, so auth
headers, interceptors and `AbortSignal` stay in your hands.

**The contract**, aligned with `resource()` and verified by e2e:

- **Cancellation, last write wins.** Every load receives an `AbortSignal`. A
  reload — dependency-driven or manual — aborts whatever is in flight;
  superseded loads never overwrite newer results, never surface stale errors,
  and never trigger the widget's load-error UI.
- **`error` + retry.** `error` holds the rejection of the most recent settled
  load and is cleared by the next successful one; `reload()` is the retry.
  The widget additionally shows its own load-error row — `error` is for UI
  outside the widget.
- **Page ownership.** A dependency change is a new query, so the store resets
  to page 0 (mirroring `DataSource.filter()` semantics). Manual `reload()`
  refetches the same query and keeps the page. You never manage `pageIndex`
  yourself — and a bound `[(dxPageIndex)]` signal follows both cases.
- **Debounce ownership.** The `debounce` option applies to dependency-driven
  reloads only (type-ahead filter signals). Widget-driven search (a lookup's
  `searchTimeout`) is already debounced by the widget — don't stack a second
  debounce on the same keystrokes.
- **Search folds into `filter`.** Widget search options are merged into
  `LoadOptions.filter` before `load` runs (vendor-parity `useDefaultSearch`),
  so your load function only ever deals in filter expressions.

## Dependent queries

A master grid's selection signal drives the detail store; return an empty
result to skip the request entirely:

```ts
readonly detailOrders = dxRemoteStore<Order, number>({
  key: 'id',
  deps: [this.selectedCustomerId],
  load: async (options, signal) => {
    const customerId = untracked(this.selectedCustomerId);
    if (customerId === undefined) return { data: [], totalCount: 0 };
    const filter = combineFilters(options.filter, ['customerId', '=', customerId]);
    return fetchJson(`/api/orders?${dxLoadOptionsParams({ ...options, filter })}`, signal);
  },
});
```

## Lookup editors need `byKey`

A select box showing a programmatically set value must resolve the item behind
the key before any page is loaded. Against a loadOptions endpoint, `byKey` is a
filtered load:

```ts
readonly customerLookup = dxRemoteStore<Customer, number>({
  key: 'id',
  load: (options, signal) =>
    fetchJson(`/api/customers?${dxLoadOptionsParams(options)}`, signal),
  byKey: async (key, signal) => {
    const params = dxLoadOptionsParams({ filter: ['id', '=', key], take: 1 });
    const result = await fetchJson<{ data: Customer[] }>(`/api/customers?${params}`, signal);
    if (result.data[0] === undefined) throw new Error(`customer ${key} not found`);
    return result.data[0];
  },
});
```

## Language-sensitive sorting

Pass `langParams: { locale: 'de' }` and every load carries it to the server,
so it can collate the way the user reads. It belongs to the `DataSource` rather
than the store, which is why the option lives here. DevExtreme only keeps it in
the remote payload when filtering *and* sorting are both remote — the default
`remoteOperations: 'auto'` resolves to all-local for a custom store and strips
it — so pair it with `[remoteOperations]="true"`.

## Scope: load-only, by design

Create/update/delete deliberately stay out of this first cut — editing flows
couple to validation, conflict handling and optimistic-update policy that this
package should not decide for you. For editable grids, hand the widget a full
`CustomStore` (or the vendor's `createStore` with
`insertUrl`/`updateUrl`/`deleteUrl`) and keep `dxRemoteStore` for the read
paths. If real consumer screens produce a shape worth hardening, CRUD can
graduate the same way this API did.
