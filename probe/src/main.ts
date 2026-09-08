/**
 * Bundle isolation probe app — six lazily loaded chunks, each importing one
 * directive from the *built* package (`dist/`, see tsconfig.probe.json) next
 * to the wrapper module a real consumer imports for the element, built with
 * the real Angular pipeline (linker, then esbuild code splitting + DCE).
 * `scripts/bundle-probe.mjs` asserts on the emitted stats.json that each
 * chunk's static closure holds only its own widget.
 *
 * The chunks pair a light user of an entry point with a heavy one — a text-box
 * page next to an html-editor page, TreeView selection next to a grid page —
 * because that is the shape that leaks: esbuild assigns files to chunks by
 * reachability, not by use, so a widget that is live for one chunk is
 * reachable from any other chunk sharing a file that imports it. A single
 * chunk cannot show that, because with one entry nothing makes a sibling live.
 */
for (const chunk of [
    import('./editor-text-box'),
    import('./editor-html-editor'),
    import('./data-tree-view'),
    import('./data-grid'),
    import('./forms-text-box'),
    import('./forms-html-editor'),
    import('./remote-store'),
]) {
    chunk.then((loaded) => console.log(loaded));
}
