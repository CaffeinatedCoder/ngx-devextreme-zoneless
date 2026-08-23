import {
    assertInInjectionContext,
    DestroyRef,
    inject,
    Injector,
    untracked,
    type Signal,
} from '@angular/core';
import CustomStore from 'devextreme/data/custom_store';
import DataSource from 'devextreme/data/data_source';
import { watchDxSignals } from './watch';

/**
 * The data-in half of the zoneless story: DevExtreme components load their
 * data through `DataSource` / stores, which know nothing about signals. These
 * helpers connect the two — a signal-produced array as a live data source,
 * and signal-driven reload triggers for any remote source.
 */

/** Options for {@link dxArrayStoreSource}. */
export interface DxArrayStoreSourceOptions {
    /** Key expression handed to the underlying store (replaces `keyExpr` on the widget). */
    readonly key?: string | string[];
    /** Explicit injector when called outside an injection context. */
    readonly injector?: Injector;
}

/**
 * Wraps a `Signal<readonly T[]>` in a DevExtreme `DataSource` that reloads
 * whenever the signal changes — bind it to any `[dataSource]` input and the
 * widget follows the signal:
 *
 * ```ts
 * readonly orders = signal<readonly Order[]>([]);
 * readonly ordersSource = dxArrayStoreSource(this.orders, { key: 'id' });
 * // <dx-data-grid [dataSource]="ordersSource" />
 * ```
 *
 * The store loads in `'raw'` mode, so DevExtreme applies filtering, sorting
 * and paging client-side exactly as for a plain array. The source is disposed
 * when the injector is destroyed.
 */
export function dxArrayStoreSource<TItem, TKey = unknown>(
    source: Signal<readonly TItem[]>,
    options: DxArrayStoreSourceOptions = {},
): DataSource<TItem, TKey> {
    if (options.injector === undefined) {
        assertInInjectionContext(dxArrayStoreSource);
    }
    const injector = options.injector ?? inject(Injector);

    const dataSource = new DataSource<TItem, TKey>({
        store: new CustomStore<TItem, TKey>({
            key: options.key,
            loadMode: 'raw',
            // `untracked` — loads must not create reactive subscriptions;
            // reloading is driven by the effect below.
            load: () => untracked(source) as TItem[],
        }),
    });
    dxReloadOn(dataSource, [source], injector);
    injector.get(DestroyRef).onDestroy(() => dataSource.dispose());
    return dataSource;
}

/** A reload target: anything reloadable/refreshable, or a plain callback. */
export type DxReloadTarget =
    | { reload(): unknown }
    | { refresh(): unknown }
    | (() => unknown);

/**
 * Triggers a reload whenever one of the dependency signals changes — the
 * missing link between external filter state held in signals and a
 * remote-loading `DataSource` (or grid), without hand-written `refresh()`
 * plumbing in every component:
 *
 * ```ts
 * readonly search = signal('');
 * readonly source = new DataSource({ store: createStore({ loadUrl: '/api/orders' }) });
 * constructor() {
 *   dxReloadOn(this.source, [this.search]);
 * }
 * ```
 *
 * The first run only collects dependencies; reloads happen on changes. For a
 * target that is not a `DataSource` (e.g. a grid instance living in a
 * signal), pass a callback: `dxReloadOn(() => this.grid()?.refresh(), [deps])`.
 */
export function dxReloadOn(
    target: DxReloadTarget,
    dependencies: readonly Signal<unknown>[],
    injector?: Injector,
): void {
    if (injector === undefined) {
        assertInInjectionContext(dxReloadOn);
    }
    const resolvedInjector = injector ?? inject(Injector);
    const trigger =
        typeof target === 'function'
            ? target
            : 'reload' in target
              ? (): unknown => target.reload()
              : (): unknown => target.refresh();

    watchDxSignals(dependencies, () => void trigger(), { injector: resolvedInjector });
}
