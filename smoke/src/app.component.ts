import { Component, inject } from '@angular/core';
import { PlatformLocation } from '@angular/common';
import { CompareComponent } from './compare.component';
import { CoverageComponent } from './coverage.component';
import { FormsCoverageComponent } from './forms-coverage.component';
import { FormsComponent } from './forms.component';
import { RemoteComponent } from './remote.component';
import { SmokeComponent } from './smoke.component';

/*
 * Six-screen shell without a router dependency: the dev server's SPA
 * fallback serves index.html for any path, and the path picks the screen —
 * `/` is the binding smoke screen, `/remote` the remote-data reference
 * screens, `/forms` the Signal Forms certification screen, `/compare` the
 * binding-style comparison, `/coverage` and `/forms-coverage` the rows for
 * every directive the binding screens do not place. Each e2e spec loads its screen's URL directly.
 * The path is read through `PlatformLocation` rather than the global
 * `location`, so the same shell renders on the server (`main.server.ts`),
 * where the URL comes from the render call and no global exists.
 */
@Component({
    selector: 'app-root',
    imports: [
        CompareComponent,
        CoverageComponent,
        FormsComponent,
        FormsCoverageComponent,
        RemoteComponent,
        SmokeComponent,
    ],
    template: `
        @switch (screen) {
            @case ('remote') {
                <app-remote />
            }
            @case ('forms') {
                <app-forms />
            }
            @case ('compare') {
                <app-compare />
            }
            @case ('coverage') {
                <app-coverage />
            }
            @case ('forms-coverage') {
                <app-forms-coverage />
            }
            @default {
                <app-smoke />
            }
        }
    `,
})
export class AppComponent {
    private readonly pathname = inject(PlatformLocation).pathname;
    protected readonly screen = this.pathname.startsWith('/remote')
        ? 'remote'
        : this.pathname.startsWith('/forms-coverage')
          ? 'forms-coverage'
          : this.pathname.startsWith('/forms')
          ? 'forms'
          : this.pathname.startsWith('/compare')
            ? 'compare'
            : this.pathname.startsWith('/coverage')
              ? 'coverage'
              : 'smoke';
}
