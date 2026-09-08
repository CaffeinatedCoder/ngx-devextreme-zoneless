/**
 * Server-side rendering measurement — renders every screen of the smoke app
 * through `@angular/platform-server` in this Node process and reports what
 * happened. Nothing here is a hydration story: the smoke app is never served
 * from a server. The question is narrower and had no answer before this
 * script existed: does a server render of an app that uses every directive of
 * this package *complete*, and what does it produce?
 *
 * What a screen has to do to pass:
 *   1. render without the bootstrap or `renderApplication` rejecting;
 *   2. settle — `ApplicationRef.whenStable()` has to resolve, or a pending
 *      task never finished, which is what an unresolved load would look like
 *      from here. The document is serialized either way so the report can
 *      say what did render;
 *   3. produce the shell and its readouts — `<app-root` with content, and the
 *      `data-testid` readouts the e2e specs assert on, rendered from signals —
 *      and raise no error through Angular's `ErrorHandler` on the way;
 *   4. leave nothing behind: after the last render the process waits a grace
 *      period and fails on any uncaught exception or unhandled rejection that
 *      arrives late — a DevExtreme timer firing into a destroyed platform is
 *      exactly that shape.
 *
 * Run after `ng build smoke --configuration ssr`:  node scripts/ssr-check.mjs
 */
import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';

const SCREENS = ['/', '/remote', '/forms', '/compare', '/coverage', '/forms-coverage'];
const RENDER_TIMEOUT_MS = 60_000;
/** How long a screen gets to become stable before its document is serialized anyway. */
const SETTLE_MS = 10_000;
const GRACE_MS = 1_500;

const late = [];
process.on('uncaughtException', (error) => late.push(['uncaughtException', error]));
process.on('unhandledRejection', (reason) => late.push(['unhandledRejection', reason]));

const document = readFileSync('dist-smoke/server/index.server.html', 'utf8');

let renderScreen;
try {
    ({ renderScreen } = await import('../dist-smoke/server/main.server.mjs'));
} catch (error) {
    console.error('The server bundle did not import:');
    console.error(error);
    process.exit(1);
}

const results = [];
for (const url of SCREENS) {
    const startedAt = performance.now();
    const result = { url, settled: false, ms: 0, bytes: 0, readouts: 0, errors: [], failure: undefined };
    try {
        const render = await Promise.race([
            renderScreen(url, document, SETTLE_MS),
            new Promise((_, reject) =>
                setTimeout(
                    () => reject(new Error(`did not return within ${RENDER_TIMEOUT_MS} ms`)),
                    RENDER_TIMEOUT_MS,
                ),
            ),
        ]);
        result.ms = Math.round(performance.now() - startedAt);
        result.settled = render.settled;
        result.errors = render.errors;
        result.bytes = Buffer.byteLength(render.html);
        result.readouts = (render.html.match(/data-testid="/g) ?? []).length;
        const rootMatch = render.html.match(/<app-root[^>]*>([\s\S]*?)<\/app-root>/);
        if (rootMatch === null) {
            throw new Error('the rendered document has no <app-root> element');
        }
        // The unrendered shell is exactly the index's placeholder text; a
        // screen may legitimately contain that word (a load panel's message).
        if (rootMatch[1].trim() === '' || rootMatch[1].trim() === 'Loading…') {
            throw new Error('<app-root> rendered empty — the shell did not bootstrap');
        }
        if (result.readouts === 0) {
            throw new Error('no data-testid readout rendered — the screen component did not render');
        }
        // The measured state, pinned: every screen settles and DevExtreme raises
        // nothing while rendering with the vendor's server module in place.
        if (!render.settled) {
            throw new Error(`did not become stable within ${SETTLE_MS} ms — a pending task never finished`);
        }
        if (render.errors.length > 0) {
            throw new Error(`${render.errors.length} error(s) reached Angular's ErrorHandler during the render`);
        }
    } catch (error) {
        result.ms = Math.round(performance.now() - startedAt);
        result.failure = error;
    }
    results.push(result);
}

// Late failures: anything DevExtreme or the app scheduled that outlived its render.
await new Promise((resolve) => setTimeout(resolve, GRACE_MS));

console.log('\nServer render of the smoke app (zoneless, @angular/platform-server, DxServerModule):\n');
console.log('  screen            settled   time      html    readouts  errors');
for (const r of results) {
    const settled = r.failure !== undefined ? 'FAIL' : r.settled ? 'yes ' : 'no  ';
    console.log(
        `  ${r.url.padEnd(17)} ${settled}   ${String(r.ms).padStart(6)} ms ${String(r.bytes).padStart(9)} B ${String(r.readouts).padStart(6)}  ${String(r.errors.length).padStart(4)}`,
    );
}
let failed = false;
for (const r of results.filter((r) => r.failure !== undefined)) {
    failed = true;
    console.error(`\n${r.url}: ${r.failure?.stack ?? r.failure}`);
}
const distinct = new Map();
for (const r of results) {
    for (const error of r.errors) {
        const line = error.split('\n')[0];
        distinct.set(line, (distinct.get(line) ?? 0) + 1);
    }
}
if (distinct.size > 0) {
    console.log('\nErrors DevExtreme raised while rendering on the server (distinct first lines):');
    for (const [line, count] of distinct) {
        console.log(`  ${String(count).padStart(3)} × ${line}`);
    }
}
if (late.length > 0) {
    failed = true;
    console.error(`\n${late.length} error(s) arrived after the renders had settled:`);
    for (const [kind, error] of late) {
        console.error(`  ${kind}: ${error?.stack ?? error}`);
    }
}
console.log(failed ? '\nSSR check: FAILED' : '\nSSR check: every screen rendered and settled with no errors, nothing arrived late');
process.exit(failed ? 1 : 0);
