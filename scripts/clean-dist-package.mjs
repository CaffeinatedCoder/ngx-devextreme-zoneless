/**
 * Strips workspace-only fields from the built package manifest.
 *
 * ng-packagr copies unknown top-level fields from the source `package.json`
 * into `dist/package.json` verbatim, and offers no field filter (its schema
 * has `keepLifecycleScripts` and `allowedNonPeerDependencies`, nothing for
 * arbitrary fields) — so anything the workspace keeps for its own tooling
 * ships in the tarball.
 *
 * `allowScripts` is npm's per-project record of which dependencies may run
 * install scripts. npm reads it from the *consuming* project's manifest and
 * never from a dependency's, so ours is inert for consumers and merely
 * misleading in the published metadata.
 *
 * Run after ng-packagr:  node scripts/clean-dist-package.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';

/** Fields that describe this workspace, not the package consumers install. */
const WORKSPACE_ONLY = ['allowScripts'];

const path = 'dist/package.json';
const manifest = JSON.parse(readFileSync(path, 'utf8'));
const removed = WORKSPACE_ONLY.filter((field) => field in manifest);

for (const field of removed) {
    delete manifest[field];
}
writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(
    removed.length > 0
        ? `dist/package.json: stripped ${removed.join(', ')}`
        : 'dist/package.json: no workspace-only fields present',
);
