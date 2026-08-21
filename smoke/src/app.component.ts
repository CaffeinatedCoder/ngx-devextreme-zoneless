import { Component } from '@angular/core';
import { RemoteComponent } from './remote.component';
import { SmokeComponent } from './smoke.component';

/*
 * Two-screen shell without a router dependency: the dev server's SPA
 * fallback serves index.html for any path, and the path picks the screen —
 * `/` is the binding smoke screen, `/remote` the remote-data reference
 * screens. Each e2e spec loads its screen's URL directly.
 */
@Component({
    selector: 'app-root',
    imports: [RemoteComponent, SmokeComponent],
    template: `
        @if (screen === 'remote') {
            <app-remote />
        } @else {
            <app-smoke />
        }
    `,
})
export class AppComponent {
    protected readonly screen = location.pathname.startsWith('/remote') ? 'remote' : 'smoke';
}
