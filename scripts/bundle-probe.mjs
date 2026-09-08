/**
 * Bundle isolation probe — two assertions on the *built* package (`dist/`).
 *
 * 1. Static: no built entry point imports `devextreme-angular/ui/<widget>` at
 *    runtime. Every directive holds its wrapper class as a type-only import and
 *    resolves the host through `injectDxHost()`; a value import is a
 *    module-level edge from the family's FESM to the widget, and that edge is
 *    the defect this probe exists for.
 *
 * 2. Behavioural: the `probe` app is built through the real Angular pipeline
 *    (linker, then esbuild code splitting and DCE) with six lazily loaded
 *    chunks, and each chunk's *static closure* — the chunk plus everything it
 *    statically imports — is asserted to hold only its own widget while the
 *    heavy siblings are live in another chunk. Several chunks on purpose:
 *    esbuild assigns files to chunks by reachability, not by use, so a widget
 *    that is live for one chunk is reachable from any other chunk sharing a
 *    file that imports it. A single-chunk probe cannot see that — nothing
 *    makes a sibling live — which is how the `data` FESM leaked the grid into a
 *    consumer's shell layout for three releases.
 *
 * Run after `npm run build`:  node scripts/bundle-probe.mjs
 */
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';

// ---- 1. static: runtime wrapper imports in the built entry points ----------
const fesmDir = 'dist/fesm2022';
const wrapperImports = [];
// Only `data-source` may import DevExtreme's data layer: it constructs
// `DataSource`/`CustomStore`, and `devextreme` declares no `sideEffects: false`,
// so the import is unshakeable — in `core` it cost every chunk ~40 KB minified.
const dataLayerImports = [];
for (const file of readdirSync(fesmDir).filter((name) => name.endsWith('.mjs'))) {
    readFileSync(`${fesmDir}/${file}`, 'utf8')
        .split('\n')
        .forEach((line, index) => {
            if (/from ['"]devextreme-angular\/ui\//.test(line)) {
                wrapperImports.push(`  ${file}:${index + 1}  ${line.trim()}`);
            }
            if (/from ['"]devextreme\//.test(line) && file !== 'ngx-devextreme-zoneless-data-source.mjs') {
                dataLayerImports.push(`  ${file}:${index + 1}  ${line.trim()}`);
            }
        });
}
let failed = false;
if (wrapperImports.length > 0) {
    console.error(
        'Isolation regression — a built entry point imports a widget wrapper at runtime\n' +
            '(wrapper classes must be `import type`; take the host from `injectDxHost()`):\n' +
            wrapperImports.join('\n'),
    );
    failed = true;
}
if (dataLayerImports.length > 0) {
    console.error(
        'Isolation regression — an entry point other than `data-source` imports `devextreme/` at runtime\n' +
            '(anything that constructs a DataSource or CustomStore belongs in `data-source`):\n' +
            dataLayerImports.join('\n'),
    );
    failed = true;
}

// ---- 2. behavioural: per-chunk static closures -----------------------------
// Runs even after a static hit, so one red run shows what the import costs.
execSync('npx ng build probe', { stdio: 'inherit' });

const metafile = JSON.parse(readFileSync('dist-probe/stats.json', 'utf8'));
const outputs = metafile.outputs ?? {};
const normalize = (path) => path.replace(/\\/g, '/');

/** Output chunks statically reachable from `chunk`; dynamic imports are not followed. */
function staticClosure(chunk) {
    const seen = new Set();
    const stack = [chunk];
    while (stack.length > 0) {
        const current = stack.pop();
        if (seen.has(current)) {
            continue;
        }
        seen.add(current);
        for (const record of outputs[current]?.imports ?? []) {
            if (record.kind === 'import-statement' && outputs[record.path] !== undefined) {
                stack.push(record.path);
            }
        }
    }
    return [...seen];
}

/** Every module that contributed bytes to any of `chunks`. */
function contributingModules(chunks) {
    const modules = new Set();
    for (const chunk of chunks) {
        for (const [path, meta] of Object.entries(outputs[chunk].inputs ?? {})) {
            if (meta.bytesInOutput > 0) {
                modules.add(normalize(path));
            }
        }
    }
    return [...modules];
}

function chunkFor(entry) {
    return Object.keys(outputs).find(
        (path) => normalize(outputs[path].entryPoint ?? '') === `probe/src/${entry}.ts`,
    );
}

const GRID = ['devextreme/esm/__internal/grids/', 'devextreme-angular-ui-data-grid'];
const DATA_LAYER = ['devextreme/esm/__internal/data/'];
const HTML_EDITOR = ['devextreme/esm/__internal/ui/html_editor', 'devextreme-angular-ui-html-editor'];
// Scheduler is matched on its widget modules, not the whole folder: DevExtreme
// core date utils import shared timezone helpers that live under
// `__internal/scheduler/` — those ~15 KB ship with every DevExtreme app and
// are not a leak of the widget family.
const OTHER_HEAVY = [
    'devextreme/esm/__internal/scheduler/m_scheduler',
    'devextreme/esm/__internal/scheduler/workspaces/',
    'devextreme/esm/__internal/scheduler/appointments/',
    'devextreme/esm/__internal/ui/gantt',
    'devextreme/esm/viz/',
    'devextreme-angular-ui-gantt',
    'devextreme-angular-ui-scheduler',
    'devextreme-angular-ui-chart',
    'devextreme-angular-ui-pie-chart',
];

const cases = [
    {
        entry: 'editor-text-box',
        why: 'one editor directive via the main entry',
        mustInclude: ['devextreme/esm/__internal/ui/text_box/', 'devextreme-angular-ui-text-box'],
        mustExclude: [...GRID, ...HTML_EDITOR, ...OTHER_HEAVY, ...DATA_LAYER],
    },
    {
        entry: 'editor-html-editor',
        why: 'makes the html editor live for the whole build',
        mustInclude: HTML_EDITOR,
        mustExclude: GRID,
    },
    {
        entry: 'data-tree-view',
        why: 'TreeView selection from /data next to a grid page — the shipped leak',
        mustInclude: ['devextreme-angular-ui-tree-view', 'ngx-devextreme-zoneless-data.mjs'],
        mustExclude: [...GRID, ...HTML_EDITOR, ...OTHER_HEAVY],
    },
    {
        entry: 'data-grid',
        why: 'makes the grid live, through the wrapper and a /data directive',
        mustInclude: GRID,
        mustExclude: HTML_EDITOR,
    },
    {
        entry: 'forms-text-box',
        why: '[dxFieldState] on a text box next to one on the html editor',
        mustInclude: ['devextreme-angular-ui-text-box', 'ngx-devextreme-zoneless-forms.mjs'],
        mustExclude: [...GRID, ...HTML_EDITOR, ...OTHER_HEAVY, ...DATA_LAYER],
    },
    {
        entry: 'forms-html-editor',
        why: 'makes the html editor live through /forms as well',
        mustInclude: HTML_EDITOR,
        mustExclude: GRID,
    },
    {
        entry: 'remote-store',
        why: 'dxRemoteStore alone — the data layer must be here and nowhere it is not used',
        mustInclude: [...DATA_LAYER, 'ngx-devextreme-zoneless-data-source.mjs'],
        mustExclude: [...GRID, ...HTML_EDITOR],
    },
];

const report = [];
for (const { entry, why, mustInclude, mustExclude } of cases) {
    const chunk = chunkFor(entry);
    if (chunk === undefined) {
        console.error(
            `Bundle probe is not meaningful — no lazy chunk was emitted for probe/src/${entry}.ts ` +
                '(did the module layout change?)',
        );
        process.exit(1);
    }
    const chunks = staticClosure(chunk);
    const modules = contributingModules(chunks);
    const bytes = chunks.reduce((sum, path) => sum + outputs[path].bytes, 0);
    report.push(
        `  ${entry.padEnd(19)} ${bytes.toLocaleString('en-US').padStart(10)} B  ${String(chunks.length).padStart(2)} chunks  ${why}`,
    );

    const missing = mustInclude.filter((fragment) => !modules.some((m) => m.includes(fragment)));
    if (missing.length > 0) {
        console.error(
            `Bundle probe is not meaningful — ${entry}: expected modules absent from its closure:\n` +
                missing.map((fragment) => `  - ${fragment}`).join('\n') +
                '\n(sample devextreme modules in the closure:\n' +
                modules
                    .filter((m) => m.includes('devextreme'))
                    .slice(0, 20)
                    .map((m) => `  ${m}`)
                    .join('\n') +
                '\n)',
        );
        failed = true;
    }
    const leaked = mustExclude.filter((fragment) => modules.some((m) => m.includes(fragment)));
    if (leaked.length > 0) {
        console.error(`Isolation regression — ${entry}: sibling widgets in its static closure:`);
        for (const fragment of leaked) {
            console.error(`  - ${fragment}, e.g.:`);
            for (const example of modules.filter((m) => m.includes(fragment)).slice(0, 3)) {
                console.error(`      ${example}`);
            }
        }
        failed = true;
    }
}

console.log('Static closures per lazy chunk (minified, uncompressed):\n' + report.join('\n'));
if (failed) {
    process.exit(1);
}
console.log(
    'Bundle probe OK: no runtime wrapper import in dist/, and every lazy chunk keeps only its own ' +
        'widget while the heavy siblings are live in another chunk.',
);
