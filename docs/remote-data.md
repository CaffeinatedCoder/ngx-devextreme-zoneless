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
