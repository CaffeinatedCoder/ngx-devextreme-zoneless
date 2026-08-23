import {
    assertInInjectionContext,
    computed,
    DestroyRef,
    inject,
    Injector,
    signal,
    type Signal,
} from '@angular/core';
import type { LangParams, LoadOptions, LoadResult } from 'devextreme/common/data';
import CustomStore from 'devextreme/data/custom_store';
import DataSource from 'devextreme/data/data_source';
import { watchDxSignals } from './watch';

/**
 * Remote data with `resource()` vocabulary: {@link dxRemoteStore} wraps a
 * consumer-supplied load function in a DevExtreme `DataSource` and exposes
 * the loading state the widget cannot show for you — `isLoading` and `error`
 * as signals for outside-the-widget UI, `reload()` for retries, dependency
 * signals for query state that lives outside the widget (search boxes,
 * master selections), and an `AbortSignal` per load so superseded requests
 * are actually cancelled instead of racing the newest one.
 */

/**
 * A remote load function: receives the widget-produced `LoadOptions`
 * (filter/sort/group/skip/take/…) and an `AbortSignal` that fires when the
 * load is superseded or the owning injector is destroyed. Resolve to
 * DevExtreme's `LoadResult` — either a plain array or
 * `{ data, totalCount, summary, groupCount }`.
 */
export type DxRemoteLoader<TItem> = (
    loadOptions: LoadOptions<TItem>,
    abortSignal: AbortSignal,
) => PromiseLike<LoadResult<TItem>>;

/** Options for {@link dxRemoteStore}. */
export interface DxRemoteStoreOptions<TItem, TKey> {
    /** Loads one page of data. See {@link DxRemoteLoader}. */
    readonly load: DxRemoteLoader<TItem>;
    /**
     * Resolves a single item by key — required for lookup editors
     * (`dx-select-box`, `dx-lookup`, …) that must display a value set
     * programmatically before/without loading the containing page. Against a
     * DevExtreme.AspNet.Data endpoint this is a filtered load:
     * `load({ filter: ['id', '=', key], take: 1 })`, taking the first item.
     * `byKey` activity does not drive `isLoading`/`error` — its failures
     * surface through the requesting widget. It is also *not* cancelled by
     * `reload()`: a key lookup is scoped to a key the widget already holds,
     * not to the query, so a new query has no bearing on it. Only injector
     * destruction aborts an in-flight `byKey`.
     */
    readonly byKey?: (key: TKey, abortSignal: AbortSignal) => PromiseLike<TItem>;
    /** Key expression handed to the underlying store (replaces `keyExpr` on the widget). */
    readonly key?: string | string[];
    /**
     * Query dependencies: when any of these signals changes, the store
     * resets to the first page and reloads (the dependencies describe the
     * query, so a change starts a new result set — mirroring `DataSource`'s
     * own `filter()` semantics). The load function reads the current values
     * itself, via `untracked`.
     */
    readonly deps?: readonly Signal<unknown>[];
    /**
     * Debounce for dependency-driven reloads in milliseconds (e.g. a search
     * signal fed from keystrokes). Manual `reload()` is never debounced.
     */
    readonly debounce?: number;
    /**
     * Language-sensitive sorting and filtering (`{ locale, collatorOptions }`),
     * forwarded to the server on every load so it can collate the way the user
     * reads. This lives on the `DataSource` rather than the store, which is why
     * it has to be surfaced here — a store built inside this function cannot be
     * reached from outside it.
     *
     * DevExtreme keeps it in the remote payload only when filtering **and**
     * sorting are both remote; with either handled locally the grid strips it
     * before the store is called, on the reasoning that it has nothing left to
     * send it for. So pair this with `[remoteOperations]="true"` (or an object
     * form setting at least `filtering` and `sorting`) — the grid's default
     * `'auto'` resolves to all-local for a custom store and drops it.
     */
    readonly langParams?: LangParams;
    /** Explicit injector when called outside an injection context. */
    readonly injector?: Injector;
}

/** The handle returned by {@link dxRemoteStore}. */
export interface DxRemoteStore<TItem, TKey = unknown> {
    /** Bind this to any `[dataSource]` input. Disposed on injector destroy. */
    readonly dataSource: DataSource<TItem, TKey>;
    /** `true` while at least one load is in flight — for UI outside the widget. */
    readonly isLoading: Signal<boolean>;
    /**
     * The rejection reason of the most recently *started* load once it
     * settles, or `undefined` after it succeeds. A load that was superseded
     * by a newer one never writes here — even when it settles later — so the
     * signal always describes the newest query. The widget additionally shows
     * its own load-error UI; this signal is for error/retry UI outside the
     * widget.
     */
    readonly error: Signal<unknown>;
    /**
     * Refetches the current query: cancels in-flight loads (DataSource
     * operation + transport `AbortSignal`), keeps the current page, and
     * resolves when the reload settles. Failures land in `error`, so the
     * returned promise never rejects.
     */
    reload(): Promise<void>;
}

/**
 * Wraps a remote load function in a DevExtreme `DataSource` with signal-based
 * loading state:
 *
 * ```ts
 * readonly search = signal('');
 * readonly orders = dxRemoteStore<Order, number>({
 *     key: 'id',
 *     deps: [this.search],
 *     debounce: 300,
 *     load: async (options, signal) => {
 *         const params = dxLoadOptionsParams(options);
 *         params.set('search', untracked(this.search));
 *         const response = await fetch(`/api/orders?${params}`, { signal });
 *         if (!response.ok) throw new Error(`orders load failed: ${response.status}`);
 *         return response.json();
 *     },
 * });
 * // <dx-data-grid [dataSource]="orders.dataSource" [remoteOperations]="true" />
 * // @if (orders.error()) { <button (click)="orders.reload()">retry</button> }
 * ```
 *
 * Semantics, aligned with Angular's `resource()`:
 * - every load gets an `AbortSignal`; a reload (dependency-driven or manual)
 *   aborts whatever is still in flight — last write wins, stale responses
 *   never overwrite newer ones and never surface stale errors;
 * - `error` reflects the most recent settled load and is cleared by the next
 *   successful one; `reload()` is the retry;
 * - dependency changes reset to page 0 (a new query is a new result set);
 *   manual `reload()` keeps the page (same query, fresh data);
 * - widget search options are folded into `LoadOptions.filter` before `load`
 *   runs (`useDefaultSearch`, matching the vendor's own remote client), so
 *   the load function only ever deals in filter expressions.
 *
 * The store is load-only by design: create/update/delete intentionally stay
 * out of this API — pass a full `CustomStore` to the widget where you need
 * editing.
 */
/**
 * Normalizes the counts in a `LoadResult` envelope.
 *
 * DevExtreme types `totalCount` and `groupCount` as `number`, but the wire
 * protocol's reference server implementations aggregate counts into a decimal
 * and spell a decimal as a **quoted JSON string** — so a conformant endpoint
 * may answer `"120"` where the typings promise `120`. Forwarded as-is, the
 * grid's pager arithmetic silently concatenates instead of adding: a measured
 * 120-row result renders as "Page 1 of 120 (1200 items)".
 *
 * Only these two fields are coerced, and only when the string parses as a
 * finite number. `summary` is deliberately left alone: it is positional and
 * may legitimately carry non-numeric aggregates (a `min` over a string or date
 * column), so blind coercion there would corrupt real values.
 */
function normalizeCounts<TItem>(result: LoadResult<TItem>): LoadResult<TItem> {
    if (Array.isArray(result) || result === null || typeof result !== 'object') {
        return result;
    }
    let normalized: Record<string, unknown> | undefined;
    for (const key of ['totalCount', 'groupCount'] as const) {
        const value: unknown = (result as Record<string, unknown>)[key];
        if (typeof value !== 'string') {
            continue;
        }
        const parsed = Number(value);
        if (value.trim() === '' || !Number.isFinite(parsed)) {
            continue;
        }
        normalized ??= { ...(result as Record<string, unknown>) };
        normalized[key] = parsed;
    }
    return (normalized ?? result) as LoadResult<TItem>;
}

export function dxRemoteStore<TItem, TKey = unknown>(
    options: DxRemoteStoreOptions<TItem, TKey>,
): DxRemoteStore<TItem, TKey> {
    if (options.injector === undefined) {
        assertInInjectionContext(dxRemoteStore);
    }
    const injector = options.injector ?? inject(Injector);

    const pendingCount = signal(0);
    const lastError = signal<unknown>(undefined);
    let loadSequence = 0;
    /** Query-scoped loads: superseded by `reload()`, aborted on destroy. */
    const inFlightLoads = new Set<AbortController>();
    /** Key-scoped lookups: aborted on destroy only — see `byKey` above. */
    const inFlightByKey = new Set<AbortController>();

    const trackedLoad = (loadOptions: LoadOptions<TItem>): Promise<LoadResult<TItem>> => {
        const sequence = ++loadSequence;
        const controller = new AbortController();
        inFlightLoads.add(controller);
        pendingCount.update((count) => count + 1);
        const settle = (): void => {
            inFlightLoads.delete(controller);
            pendingCount.update((count) => count - 1);
        };
        // A load function that is not declared `async` can throw *synchronously*
        // while it builds its request (a bad dependency, a filter that will not
        // serialize, …). Funnel that into the same rejection path — otherwise
        // the tracking never settles and `isLoading` stays `true` forever while
        // the reason never reaches `error`.
        let pending: PromiseLike<LoadResult<TItem>>;
        try {
            pending = options.load(loadOptions, controller.signal);
        } catch (reason) {
            pending = Promise.reject(reason);
        }
        return Promise.resolve(pending).then(
            (result) => {
                settle();
                if (sequence === loadSequence) {
                    lastError.set(undefined);
                }
                return normalizeCounts(result);
            },
            (reason: unknown) => {
                settle();
                if (controller.signal.aborted) {
                    // Superseded load: reject with DevExtreme's own
                    // cancellation token (the literal `'canceled'`), which the
                    // DataSource recognizes and drops without firing
                    // `loadError` — the widget never flashes its error UI for
                    // a load this store aborted on purpose.
                    throw 'canceled';
                }
                if (sequence === loadSequence) {
                    lastError.set(reason);
                }
                throw reason;
            },
        );
    };

    const userByKey = options.byKey;
    const trackedByKey =
        userByKey === undefined
            ? undefined
            : (key: TKey): PromiseLike<TItem> => {
                  const controller = new AbortController();
                  inFlightByKey.add(controller);
                  // Same synchronous-throw guard as `trackedLoad`, so a
                  // non-`async` `byKey` cannot leak its controller.
                  let pending: PromiseLike<TItem>;
                  try {
                      pending = userByKey(key, controller.signal);
                  } catch (reason) {
                      pending = Promise.reject(reason);
                  }
                  return Promise.resolve(pending).finally(() =>
                      inFlightByKey.delete(controller),
                  );
              };

    const dataSource = new DataSource<TItem, TKey>({
        langParams: options.langParams,
        store: new CustomStore<TItem, TKey>({
            key: options.key,
            loadMode: 'processed',
            useDefaultSearch: true,
            load: trackedLoad,
            byKey: trackedByKey,
        }),
    });

    /** Aborts the query-scoped loads only — `byKey` deliberately survives. */
    const abortInFlightLoads = (): void => {
        for (const controller of inFlightLoads) {
            controller.abort();
        }
    };

    const reload = (): Promise<void> => {
        // Abort in-flight transport before starting over — the aborted loads
        // reject as `'canceled'` (see trackedLoad), which DevExtreme drops
        // silently. Deliberately NOT `dataSource.cancelAll()`: that method
        // resets the internal operation-id counter, and the id reuse makes
        // grid adapters discard the results of every subsequent load.
        abortInFlightLoads();
        return Promise.resolve(dataSource.reload()).then(
            () => undefined,
            () => undefined,
        );
    };

    const deps = options.deps ?? [];
    if (deps.length > 0) {
        // Dependencies describe the query, so a change starts a new result
        // set: reset to the first page (mirroring `DataSource.filter()`
        // semantics) and reload. The helper owns the debounce timer,
        // including clearing it on injector destruction.
        watchDxSignals(
            deps,
            () => {
                dataSource.pageIndex(0);
                void reload();
            },
            { debounceMs: options.debounce, injector },
        );
    }

    injector.get(DestroyRef).onDestroy(() => {
        abortInFlightLoads();
        for (const controller of inFlightByKey) {
            controller.abort();
        }
        dataSource.dispose();
    });

    return {
        dataSource,
        isLoading: computed(() => pendingCount() > 0),
        error: lastError.asReadonly(),
        reload,
    };
}

/** `sort`/`group` entries normalized to the object form remote servers expect. */
interface DxSortingInfo {
    readonly selector: unknown;
    readonly desc?: boolean;
}

function normalizeSorting(value: unknown): readonly DxSortingInfo[] {
    const list = Array.isArray(value) ? value : [value];
    return list.map((entry: unknown): DxSortingInfo => {
        if (typeof entry === 'object' && entry !== null && 'selector' in entry) {
            return entry as DxSortingInfo;
        }
        return { selector: entry, desc: false };
    });
}

/**
 * Serializes `LoadOptions` into the query parameters understood by the
 * DevExtreme.AspNet.Data server libraries — the same wire format the
 * vendor's own `createStore({ loadUrl })` client produces: structured
 * options JSON-encoded (`filter`, `sort`, `group`, `select`, `totalSummary`,
 * `groupSummary`, `langParams`, with string `sort`/`group` entries normalized
 * to `{ selector }` objects), scalars plain (`skip`, `take`,
 * `requireTotalCount`, `requireGroupCount`).
 *
 * ```ts
 * const response = await fetch(`/api/orders?${dxLoadOptionsParams(options)}`, { signal });
 * ```
 */
export function dxLoadOptionsParams(loadOptions: LoadOptions): URLSearchParams {
    const params = new URLSearchParams();
    for (const key of ['skip', 'take', 'requireTotalCount', 'requireGroupCount'] as const) {
        const value = loadOptions[key];
        if (value !== undefined && value !== null) {
            params.set(key, String(value));
        }
    }
    // `parentIds` carries the keys of the rows being expanded — the only
    // loadOptions member a TreeList adds, and the one the protocol's reference
    // .NET server does not parse (verified against 5.1.0: it declares no
    // `ParentIds`). A remote hierarchy is therefore a contract between the
    // widget and *your* endpoint; the client's job is simply not to drop what
    // the widget produced, which is what this line guarantees.
    for (const key of ['filter', 'select', 'totalSummary', 'groupSummary', 'parentIds'] as const) {
        const value = loadOptions[key];
        if (value !== undefined && value !== null) {
            params.set(key, JSON.stringify(value));
        }
    }
    for (const key of ['sort', 'group'] as const) {
        const value = loadOptions[key];
        if (value !== undefined && value !== null) {
            params.set(key, JSON.stringify(normalizeSorting(value)));
        }
    }
    // `langParams` rides the loadOptions object at runtime but is absent from
    // DevExtreme's `LoadOptions` typing — it is declared on `DataSourceOptions`
    // only — so it is read through an explicit cast rather than from the typed
    // lists above. Dropping it silently changes collation between client and
    // server, which is why it is carried even though the typings do not admit
    // it exists.
    const langParams: unknown = (loadOptions as { langParams?: unknown }).langParams;
    if (langParams !== undefined && langParams !== null) {
        params.set('langParams', JSON.stringify(langParams));
    }
    return params;
}
