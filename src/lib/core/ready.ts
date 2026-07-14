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

/**
 * Invokes `callback` exactly once, as soon as the DevExtreme widget behind a
 * devextreme-angular host component exists.
 *
 * Handles all timing subtleties:
 *  - devextreme-angular creates the widget in `ngAfterViewInit`, long after
 *    directives on the same element are constructed;
 *  - the `onInitialized` event fires *during* widget construction, before the
 *    wrapper's `instance` property is assigned — the widget is therefore taken
 *    from the event payload;
 *  - when the host is provided lazily (e.g. a `viewChild(...)` signal), the
 *    getter is watched reactively until it yields a host.
 *
 * Must be called in an injection context unless an `injector` is provided.
 * The pending wait is cancelled automatically when the injector is destroyed.
 */
export function onDxWidgetReady<THost extends DxHostComponent>(
    hostRef: DxHostRef<THost>,
    callback: (instance: DxInstanceOf<THost> & DxWidget, host: THost) => void,
    injector?: Injector,
): void {
    if (injector === undefined) {
        assertInInjectionContext(onDxWidgetReady);
    }
    const resolvedInjector = injector ?? inject(Injector);
    let done = false;

    type TInstance = DxInstanceOf<THost> & DxWidget;

    const complete = (instance: TInstance | undefined, host: THost): void => {
        if (!done && instance !== undefined && instance !== null) {
            done = true;
            callback(instance, host);
        }
    };

    const attach = (host: THost): void => {
        const subscription = host.onInitialized.subscribe((event) => {
            // `host.instance` is not assigned yet at this point — use the
            // widget carried by the event payload.
            const args = event as DxInitializedArgs<DxWidget>;
            complete((args.component ?? host.instance) as TInstance, host);
        });
        resolvedInjector.get(DestroyRef).onDestroy(() => subscription.unsubscribe());
        // Fallback for hosts whose widget already exists (e.g. late-resolved
        // view children) or whose `initialized` event was missed.
        afterNextRender(
            { read: () => complete(host.instance as TInstance, host) },
            { injector: resolvedInjector },
        );
    };

    if (typeof hostRef !== 'function') {
        attach(hostRef);
        return;
    }

    // Lazy host (viewChild signal or arbitrary getter): watch until available.
    const watcher = effect(
        () => {
            const host = hostRef();
            if (host !== undefined && host !== null) {
                watcher.destroy();
                untracked(() => attach(host));
            }
        },
        { injector: resolvedInjector },
    );
}
