import {
    assertInInjectionContext,
    computed,
    DestroyRef,
    effect,
    inject,
    Injector,
    signal,
    untracked,
    type Signal,
} from '@angular/core';
import type { LoadOptions, LoadResult } from 'devextreme/common/data';
import CustomStore from 'devextreme/data/custom_store';
import DataSource from 'devextreme/data/data_source';

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
     * surface through the requesting widget.
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
     * The rejection reason of the most recent settled load, or `undefined`
     * after a successful load. Superseded (aborted) loads never write here.
     * The widget additionally shows its own load-error UI; this signal is for
     * error/retry UI outside the widget.
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
    const inFlight = new Set<AbortController>();

    const trackedLoad = (loadOptions: LoadOptions<TItem>): Promise<LoadResult<TItem>> => {
        const sequence = ++loadSequence;
        const controller = new AbortController();
        inFlight.add(controller);
        pendingCount.update((count) => count + 1);
        const settle = (): void => {
            inFlight.delete(controller);
            pendingCount.update((count) => count - 1);
        };
        return Promise.resolve(options.load(loadOptions, controller.signal)).then(
            (result) => {
                settle();
                if (sequence === loadSequence) {
                    lastError.set(undefined);
                }
                return result;
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
                  inFlight.add(controller);
                  return Promise.resolve(userByKey(key, controller.signal)).finally(() =>
                      inFlight.delete(controller),
                  );
              };

    const dataSource = new DataSource<TItem, TKey>({
        store: new CustomStore<TItem, TKey>({
            key: options.key,
            loadMode: 'processed',
            useDefaultSearch: true,
            load: trackedLoad,
            byKey: trackedByKey,
        }),
    });

    const abortInFlight = (): void => {
        for (const controller of inFlight) {
            controller.abort();
        }
    };

    const reload = (): Promise<void> => {
        // Abort in-flight transport before starting over — the aborted loads
        // reject as `'canceled'` (see trackedLoad), which DevExtreme drops
        // silently. Deliberately NOT `dataSource.cancelAll()`: that method
        // resets the internal operation-id counter, and the id reuse makes
        // grid adapters discard the results of every subsequent load.
        abortInFlight();
        return Promise.resolve(dataSource.reload()).then(
            () => undefined,
            () => undefined,
        );
    };

    const deps = options.deps ?? [];
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;
    if (deps.length > 0) {
        const debounceMs = options.debounce ?? 0;
        const run = (): void => {
            debounceTimer = undefined;
            dataSource.pageIndex(0);
            void reload();
        };
        let first = true;
        effect(
            () => {
                for (const dependency of deps) {
                    dependency();
                }
                if (first) {
                    first = false;
                    return;
                }
                if (debounceTimer !== undefined) {
                    clearTimeout(debounceTimer);
                }
                if (debounceMs > 0) {
                    debounceTimer = setTimeout(run, debounceMs);
                } else {
                    untracked(run);
                }
            },
            { injector },
        );
    }

    injector.get(DestroyRef).onDestroy(() => {
        if (debounceTimer !== undefined) {
            clearTimeout(debounceTimer);
        }
        abortInFlight();
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
 * `groupSummary`, with string `sort`/`group` entries normalized to
 * `{ selector }` objects), scalars plain (`skip`, `take`,
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
    for (const key of ['filter', 'select', 'totalSummary', 'groupSummary'] as const) {
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
    return params;
}
