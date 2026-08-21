import { provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app.component';

/*
 * Deliberately zoneless: zone.js is not even installed in this workspace.
 * Every UI update observed in this app is driven by signal writes alone.
 */
bootstrapApplication(AppComponent, {
    providers: [provideZonelessChangeDetection()],
}).catch((err) => console.error(err));
