/**
 * Tree-shaking probe: builds the `probe` app (which imports exactly one
 * editor directive from the built `dist/` package) through the real Angular
 * pipeline — the linker turns the partial declarations into tree-shakeable
 * definitions before esbuild's DCE runs — and asserts on the emitted
 * stats.json (esbuild metafile) that no heavy widget family contributed
 * bytes to the bundle.
 *
 * Run after `npm run build`:  node scripts/bundle-probe.mjs
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

execSync('npx ng build probe', { stdio: 'inherit' });

const metafile = JSON.parse(readFileSync('dist-probe/stats.json', 'utf8'));

// Collect every module that contributed bytes to any output chunk.
const contributing = new Set();
for (const output of Object.values(metafile.outputs ?? {})) {
    for (const [path, meta] of Object.entries(output.inputs ?? {})) {
        if (meta.bytesInOutput > 0) {
            contributing.add(path.replace(/\\/g, '/'));
        }
    }
}
const inputs = [...contributing];

// Sanity: the widget the directive wraps must be in the bundle …
const mustInclude = [
    'devextreme/esm/__internal/ui/text_box/',
    'devextreme-angular-ui-text-box',
];
// … and the heavy families must not be. (Scheduler is matched on its widget
// modules, not the whole folder: DevExtreme core date utils import shared
// timezone helpers that live under `__internal/scheduler/` — those ~15 KB
// ship with every DevExtreme app and are not a leak of the widget family.)
const mustExclude = [
    'devextreme/esm/__internal/grids/',
    'devextreme/esm/__internal/scheduler/m_scheduler',
    'devextreme/esm/__internal/scheduler/workspaces/',
    'devextreme/esm/__internal/scheduler/appointments/',
    'devextreme/esm/__internal/ui/gantt',
    'devextreme/esm/__internal/ui/html_editor',
    'devextreme/esm/viz/',
    'devextreme-angular-ui-gantt',
    'devextreme-angular-ui-scheduler',
    'devextreme-angular-ui-html-editor',
    'devextreme-angular-ui-chart',
    'devextreme-angular-ui-pie-chart',
    'devextreme-angular-ui-data-grid',
];

const missing = mustInclude.filter(
    (fragment) => !inputs.some((input) => input.includes(fragment)),
);
const leaked = mustExclude.filter((fragment) =>
    inputs.some((input) => input.includes(fragment)),
);

if (missing.length > 0) {
    console.error(
        'Bundle probe is not meaningful — expected modules absent from the bundle:\n' +
            missing.map((fragment) => `  - ${fragment}`).join('\n') +
            '\n(Did the module layout change? Sample contributing modules:\n' +
            inputs
                .filter((input) => input.includes('devextreme'))
                .slice(0, 20)
                .map((input) => `  ${input}`)
                .join('\n') +
            '\n)',
    );
    process.exit(1);
}
if (leaked.length > 0) {
    console.error(
        'Tree-shaking regression — heavy widget families leaked into a single-directive bundle:',
    );
    for (const fragment of leaked) {
        const examples = inputs.filter((input) => input.includes(fragment)).slice(0, 3);
        console.error(`  - ${fragment}, e.g.:`);
        for (const example of examples) {
            console.error(`      ${example}`);
        }
    }
    process.exit(1);
}

console.log(
    `Bundle probe OK: ${inputs.length} modules contribute to the bundle — ` +
        'no gantt/scheduler/html-editor/viz/grid modules in a single-directive build.',
);
