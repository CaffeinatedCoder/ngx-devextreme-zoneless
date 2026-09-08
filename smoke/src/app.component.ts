import { Component } from '@angular/core';
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
    protected readonly screen = location.pathname.startsWith('/remote')
        ? 'remote'
        : location.pathname.startsWith('/forms-coverage')
          ? 'forms-coverage'
          : location.pathname.startsWith('/forms')
          ? 'forms'
          : location.pathname.startsWith('/compare')
            ? 'compare'
            : location.pathname.startsWith('/coverage')
              ? 'coverage'
              : 'smoke';
}
