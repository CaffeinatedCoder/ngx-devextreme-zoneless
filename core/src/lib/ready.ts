import {
    afterNextRender,
    assertInInjectionContext,
    DestroyRef,
    effect,
    inject,
    Injector,
    untracked,
} from '@angular/core';
import type {
    DxHostComponent,
    DxHostRef,
    DxInitializedArgs,
    DxInstanceOf,
    DxWidget,
} from './types';

/** Cleanup returned by an {@link onDxWidgetReady} callback; runs when the widget goes away. */
export type DxWidgetReadyCleanup = () => void;

/**
 * Invokes `callback` as soon as the DevExtreme widget behind a
 * devextreme-angular host component exists — once *per widget instance*:
 *
 *  - For a direct host reference the callback fires exactly once (the widget
 *    dies with the host component and its element).
 *  - For a lazily-provided host (a `viewChild(...)` signal or any getter) the
 *    getter is watched for the whole injector lifetime: when the host is
 *    destroyed and a new one appears (`@if`, tab panels, re-created popup
 *    content, ...), the previous attach is disposed and the callback fires
 *    again for the new widget.
 *
 * The callback may return a cleanup function; it runs when the widget goes
 * away — on host re-creation as well as on injector destruction. Errors
 * thrown by cleanups are swallowed, since the widget is routinely already
 * disposed when they run.
 *
 * Handles all timing subtleties:
 *  - devextreme-angular creates the widget in `ngAfterViewInit`, long after
 *    directives on the same element are constructed;
 *  - the `onInitialized` event fires *during* widget construction, before the
 *    wrapper's `instance` property is assigned — the widget is therefore taken
 *    from the event payload;
 *  - `afterNextRender` covers hosts whose widget already exists (late-resolved
 *    view children).
 *
 * Must be called in an injection context unless an `injector` is provided.
 * All pending work is disposed automatically when the injector is destroyed.
 */
export function onDxWidgetReady<THost extends DxHostComponent>(
    hostRef: DxHostRef<THost>,
    callback: (
        instance: DxInstanceOf<THost> & DxWidget,
        host: THost,
    ) => void | DxWidgetReadyCleanup,
    injector?: Injector,
): void {
    if (injector === undefined) {
        assertInInjectionContext(onDxWidgetReady);
    }
    const resolvedInjector = injector ?? inject(Injector);

    type TInstance = DxInstanceOf<THost> & DxWidget;

    /** Disposal scope of the current attach; replaced on host re-creation. */
    let scope: DxWidgetReadyCleanup[] | undefined;
    let destroyed = false;

    const detach = (): void => {
        const cleanups = scope;
        scope = undefined;
        if (cleanups === undefined) {
            return;
        }
        for (let i = cleanups.length - 1; i >= 0; i--) {
            try {
                cleanups[i]?.();
            } catch {
                // The widget is routinely already disposed at this point.
            }
        }
    };
    resolvedInjector.get(DestroyRef).onDestroy(() => {
        destroyed = true;
        detach();
    });

    const attach = (host: THost): void => {
        const cleanups: DxWidgetReadyCleanup[] = [];
        scope = cleanups;
        let done = false;

        const complete = (instance: TInstance | undefined | null): void => {
            // The scope check drops stale completions (afterNextRender or a
            // late `onInitialized`) that race a detach.
            if (done || destroyed || scope !== cleanups || instance === undefined || instance === null) {
                return;
            }
            done = true;
            const cleanup = callback(instance, host);
            if (typeof cleanup === 'function') {
                cleanups.push(cleanup);
            }
        };

        const subscription = host.onInitialized.subscribe((event) => {
            // `host.instance` is not assigned yet at this point — use the
            // widget carried by the event payload.
            const args = event as DxInitializedArgs<DxWidget>;
            complete((args.component ?? host.instance) as TInstance);
        });
        cleanups.push(() => subscription.unsubscribe());
        // Fallback for hosts whose widget already exists (e.g. late-resolved
        // view children) or whose `initialized` event was missed.
        afterNextRender(
            { read: () => complete(host.instance as TInstance) },
            { injector: resolvedInjector },
        );
    };

    if (typeof hostRef !== 'function') {
        attach(hostRef);
        return;
    }

    // Lazy host (viewChild signal or arbitrary getter): watch for the whole
    // injector lifetime. A change of host identity means the widget was
    // destroyed and re-created — dispose the previous attach and re-attach.
    let currentHost: THost | undefined;
    effect(
        () => {
            const host = hostRef() ?? undefined;
            if (host === currentHost) {
                return;
            }
            currentHost = host;
            untracked(() => {
                detach();
                if (host !== undefined) {
                    attach(host);
                }
            });
        },
        { injector: resolvedInjector },
    );
}
