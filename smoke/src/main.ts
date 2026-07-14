import { provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { SmokeComponent } from './smoke.component';

/*
 * Deliberately zoneless: zone.js is not even installed in this workspace.
 * Every UI update observed in this app is driven by signal writes alone.
 */
bootstrapApplication(SmokeComponent, {
    providers: [provideZonelessChangeDetection()],
}).catch((err) => console.error(err));
