import { defineConfig, devices } from '@playwright/test';

/**
 * Runtime verification of the binding engine against the smoke app
 * (`smoke/src/smoke.component.ts`), which resolves `ngx-devextreme-zoneless`
 * to the live sources via tsconfig paths — the suite therefore exercises the
 * uncompiled library code under real zoneless change detection.
 */
export default defineConfig({
    testDir: 'e2e',
    fullyParallel: true,
    forbidOnly: !!process.env['CI'],
    retries: process.env['CI'] ? 2 : 0,
    reporter: process.env['CI'] ? [['list'], ['github']] : 'list',
    use: {
        baseURL: 'http://localhost:4299',
        trace: 'on-first-retry',
    },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
    webServer: [
        {
            // DevExtreme.AspNet.Data protocol stub — the deterministic remote
            // fixture behind the smoke app's `/api` proxy (smoke/proxy.conf.json).
            command: 'node e2e/stub-server.mjs',
            url: 'http://localhost:4300/api/__stats',
            reuseExistingServer: !process.env['CI'],
            timeout: 30_000,
        },
        {
            command: 'npm run smoke',
            url: 'http://localhost:4299',
            reuseExistingServer: !process.env['CI'],
            timeout: 180_000,
        },
    ],
});
