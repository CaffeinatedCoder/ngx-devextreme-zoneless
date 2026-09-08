import { effect, untracked, type Injector, type Signal } from '@angular/core';

/**
 * Internal: invokes `run` whenever one of the dependency signals changes.
 * The first execution only collects dependencies — reloads happen on changes.
 * With `debounceMs > 0` the invocation is trailing-debounced; the pending
 * timer is cleared both by the next change and by injector destruction (the
 * effect's cleanup runs in either case). `run` executes untracked, so it can
 * read signals without creating subscriptions.
 *
 * Returns a function that drops a debounced run still waiting to fire,
 * reporting whether there was one. That lets a caller with its own refetch
 * path *adopt* a pending dependency change instead of racing it — see
 * `dxRemoteStore`'s `reload()`.
 *
 * Not exported from the public API — this is the one implementation behind
 * `dxReloadOn` and `dxRemoteStore`'s dependency-driven reloads.
 */
export function watchDxSignals(
    dependencies: readonly Signal<unknown>[],
    run: () => void,
    options: { readonly debounceMs?: number; readonly injector: Injector },
): () => boolean {
    const debounceMs = options.debounceMs ?? 0;
    let first = true;
    let pending: ReturnType<typeof setTimeout> | undefined;
    effect(
        (onCleanup) => {
            for (const dependency of dependencies) {
                dependency();
            }
            if (first) {
                first = false;
                return;
            }
            if (debounceMs > 0) {
                const timer = setTimeout(() => {
                    pending = undefined;
                    untracked(run);
                }, debounceMs);
                pending = timer;
                onCleanup(() => {
                    clearTimeout(timer);
                    if (pending === timer) {
                        pending = undefined;
                    }
                });
            } else {
                untracked(run);
            }
        },
        { injector: options.injector },
    );
    return () => {
        if (pending === undefined) {
            return false;
        }
        clearTimeout(pending);
        pending = undefined;
        return true;
    };
}
