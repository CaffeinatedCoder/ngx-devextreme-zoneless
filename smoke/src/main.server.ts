import {
    ErrorHandler,
    importProvidersFrom,
    provideZonelessChangeDetection,
    type ApplicationRef,
    type EnvironmentProviders,
    type Provider,
} from '@angular/core';
import { bootstrapApplication, type BootstrapContext } from '@angular/platform-browser';
import {
    INITIAL_CONFIG,
    PlatformState,
    platformServer,
    provideServerRendering,
} from '@angular/platform-server';
import { DxServerModule } from 'devextreme-angular/server';
import { AppComponent } from './app.component';

/*
 * Server entry of the smoke app — the same shell and the same screens as
 * `main.ts`, bootstrapped under `@angular/platform-server` and still zoneless.
 * It exists for one measurement, `scripts/ssr-check.mjs`: what a server render
 * of an app that uses every directive of this package does — whether it
 * settles, what it produces, and which errors DevExtreme raises on the way,
 * since devextreme-angular constructs every widget unconditionally in
 * `ngOnInit`, on the server too.
 *
 * The providers are what the vendor's own SSR guide prescribes plus this
 * package's zoneless setup: `DxServerModule` replaces DevExtreme's Inferno
 * renderer with `renderToString` on the server (without it the widgets'
 * Inferno-rendered parts reach for a global `document` and throw), and
 * `provideServerRendering` is the platform-server one — the app has no
 * router, so `@angular/ssr`'s route-driven variant has nothing to configure.
 */
const serverProviders: (Provider | EnvironmentProviders)[] = [
    provideZonelessChangeDetection(),
    provideServerRendering(),
    importProvidersFrom(DxServerModule),
];

const bootstrap = (context: BootstrapContext): Promise<ApplicationRef> =>
    bootstrapApplication(AppComponent, { providers: serverProviders }, context);

export default bootstrap;

/** What one server render of a screen produced. */
export interface ScreenRender {
    /** The serialized document, whether or not the application settled. */
    readonly html: string;
    /** Whether `ApplicationRef.whenStable()` resolved within the wait. */
    readonly settled: boolean;
    /** Every error Angular's `ErrorHandler` received during the render. */
    readonly errors: readonly string[];
}

/**
 * Renders one screen and reports what happened. `renderApplication` would
 * serialize only once the application is stable and reject on the first
 * error, which turns a screen that never settles into a bare timeout; this
 * drives the platform directly so the document, the settle outcome and the
 * errors are all observable, whatever combination occurs. It lives in this
 * bundle rather than in the Node script that calls it so that the platform
 * and the application share one copy of Angular — a second copy imported
 * from `node_modules` would not share the injection tokens.
 */
export async function renderScreen(
    url: string,
    document: string,
    settleMs: number,
): Promise<ScreenRender> {
    const errors: string[] = [];
    const platformRef = platformServer([{ provide: INITIAL_CONFIG, useValue: { document, url } }]);
    try {
        const appRef = await bootstrapApplication(
            AppComponent,
            {
                providers: [
                    ...serverProviders,
                    {
                        provide: ErrorHandler,
                        useValue: {
                            handleError: (error: unknown): void => {
                                errors.push(
                                    error instanceof Error ? (error.stack ?? error.message) : String(error),
                                );
                            },
                        },
                    },
                ],
            },
            { platformRef },
        );
        const settled = await Promise.race([
            appRef.whenStable().then(() => true),
            new Promise<boolean>((resolve) => setTimeout(() => resolve(false), settleMs)),
        ]);
        const html = platformRef.injector.get(PlatformState).renderToString();
        return { html, settled, errors };
    } finally {
        platformRef.destroy();
    }
}
