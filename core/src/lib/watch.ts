import { effect, untracked, type Injector, type Signal } from '@angular/core';

/**
 * Internal: invokes `run` whenever one of the dependency signals changes.
 * The first execution only collects dependencies — reloads happen on changes.
 * With `debounceMs > 0` the invocation is trailing-debounced; the pending
 * timer is cleared both by the next change and by injector destruction (the
 * effect's cleanup runs in either case). `run` executes untracked, so it can
 * read signals without creating subscriptions.
 *
 * Not exported from the public API — this is the one implementation behind
 * `dxReloadOn` and `dxRemoteStore`'s dependency-driven reloads.
 */
export function watchDxSignals(
    dependencies: readonly Signal<unknown>[],
    run: () => void,
    options: { readonly debounceMs?: number; readonly injector: Injector },
): void {
    const debounceMs = options.debounceMs ?? 0;
    let first = true;
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
                const timer = setTimeout(() => untracked(run), debounceMs);
                onCleanup(() => clearTimeout(timer));
            } else {
                untracked(run);
            }
        },
        { injector: options.injector },
    );
}
