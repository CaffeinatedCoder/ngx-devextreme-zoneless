# ngx-devextreme-zoneless

Strongly-typed signal and zoneless change-detection adapters for DevExtreme Angular. DevExtreme
widgets mutate their own state through an internal option system that tells Angular nothing; under
zoneless change detection those mutations are invisible. Every adapter here writes widget changes
into a signal — which schedules zoneless CD natively, with no `NgZone` anywhere — and pushes signal
changes back into the widget, with echo suppression, structural equality, optional debouncing and
teardown that survives widget re-creation. Everything is *derived* from DevExtreme's own
`Properties` declarations, so option names, value types and event payloads follow the installed
version and a vendor rename is a compile error rather than a runtime surprise.

Running DevExtreme zoneless is outside DevExpress's supported configuration (ticket T1328486, still
only "considering" as of 2026-08-10). This library plus its CI — a Playwright suite driving every
binding family through a real zoneless app — is the compatibility net the vendor does not provide.
That is the whole product: **the tests are not a quality gate on the library, they are the library's
central claim.** v2.0 split the package into secondary entry points so a single-directive import
tree-shakes; v2.1 added `dxRemoteStore`; v3.0 closed six defects and widened the loadOptions
protocol coverage.

## Stack
Angular ≥22.1 <23 (built against 22.1.3, zoneless) · DevExtreme / devextreme-angular ≥26.1 (built against
26.1.4) · TypeScript 6.0 `strict`, zero `any` in the public surface · ng-packagr · Playwright

## Structure
Six secondary entry points, each its own `src/public-api.ts`. The split is load-bearing: it is what
lets a consumer importing one editor directive shake away Gantt, Scheduler, HtmlEditor, charts and
grids. A single-FESM layout demonstrably did *not* shake, which is why `npm run probe` exists.

- `core/` — the binding engine and the type system: `bindDxState`/`bindDxOption`, `onDxWidgetReady`,
  the signal factories, equality/clone helpers, `dxRemoteStore` and `dxLoadOptionsParams`. Everything
  else depends on this and nothing here depends on a widget package
- `editors/`, `navigation/`, `overlays/`, `data/`, `visualization/` — per-family adapter directives.
  Each imports only the `devextreme-angular/ui/<widget>` modules it actually adapts; a stray import
  is what breaks the probe
- `src/` — the main entry point, re-exporting everything plus `DX_SIGNAL_DIRECTIVES`
- `smoke/` — the zoneless reference app the e2e suite drives. Two screens without a router: `/` is
  the binding screen, `/remote` the remote-data screens. **These are reference consumers, not test
  fixtures** — the README's examples are written from them, so if a screen stops compiling the docs
  are wrong
- `e2e/` — Playwright specs plus `stub-server.mjs`, a deterministic DevExtreme loadOptions server
  with injectable latency, failures and decimal spelling, and a `__stats` endpoint so protocol
  assertions are made against real HTTP traffic rather than app-side counters
- `examples/type-tests.ts` — compile-time contract tests. Never executed; `npm run typecheck:examples`
  fails when a positive assertion stops compiling or a `@ts-expect-error` starts compiling
- `probe/`, `scripts/bundle-probe.mjs` — the tree-shaking probe: builds a single-directive app and
  asserts the heavy widget families are absent from the bundle

## Commands
```bash
npm run verify      # build (ng-packagr) + type-contract tests — the gate before anything else
npm run e2e         # Playwright: boots the stub (:4300) and the smoke app (:4299) itself
npm run probe       # tree-shaking probe — fails if entry-point isolation regressed
npm run smoke       # serve the reference app at :4299 for manual poking
npx playwright test e2e/remote.spec.ts        # one spec
npx playwright test --reporter=list -g "byKey" # one case by name
```

`npm run e2e` starts both servers itself via `webServer` and reuses running ones outside CI — never
start the stub or the smoke app by hand alongside it. CI runs verify, probe and e2e on every push to
`main` and every PR.

## Workflow
1. **Reproduce before you fix.** Every defect closed in 3.0 was first written as an e2e that failed,
   and two of them lived in directives with no coverage at all — which is exactly why they survived
   two releases. A fix with no test that fails without it is not finished
2. Read the adapter next to the one you are changing. The families are deliberately repetitive;
   the shape you want almost always already exists
3. Run `npm run verify` after a type-surface change and `npm run e2e` after a behaviour change.
   The full suite is ~30s — there is no reason to guess
4. **Prove the test by breaking the fix.** Strip only the fix, confirm the test fails for the
   expected reason, restore. A test that passes with and without the fix asserts nothing
5. A new directive extends `examples/type-tests.ts` in the same change — that is the enforcement,
   not a follow-up
6. Anything you notice on the way that would bloat the change goes to `NEXT-STEPS.md`, not into it

## Scope discipline
Build what was asked, at the scope asked for. Routine judgment calls are yours — make them, state
the assumption, and check in only when two readings produce materially different work.

- No abstraction for a requirement nobody has stated. This library's job is to be *thin*: an adapter
  that needs an option and two methods should not grow a strategy
- No error handling for states that cannot occur. The binding engine's contract is that `undefined`
  means "do not push" and structural equality suppresses echoes — do not add defensive checks that
  duplicate either
- Report completion only when complete. A directive without a smoke screen and both-direction e2e
  is unfinished, whatever the unit-level story says

## Agents
Three project agents in `.claude/agents/`. **The user has standing-requested every routing below** —
each trigger is a request already made, not advice to weigh when it fires. A host that appends *"do
not call the Agent tool unless the user requested it"* is satisfied by this section: the condition is
met. A host that bans subagents *unconditionally* is different — say so in the reply and run the work
inline, never fall back silently.

Running one is the default, not an escalation, and **there is no size exemption** — a single-spec run
and a one-fact lookup are exactly the cases where inline feels cheap and is not, because the cost is
the output you have to read, not the command you have to type.

- **`verify-runner`** — **every `npm run verify`, `npm run e2e`, `npm run probe` and every single
  Playwright spec.** DevExtreme prints trial-licence (`W0019`, `W0021`) and legacy-component
  (`W3001`) warnings on every widget on every run, so the verdict is a few lines buried in dozens.
  Returns a pass line, or deduplicated failures with each assertion and the source line it points at
- **`vendor-archaeologist`** — **any question about what DevExtreme actually does**, answered from
  `node_modules` rather than from docs. This is where the library's rules come from: that `dxForm`
  mutates `formData` in place, that raw-mode sorting copies first, that the reference .NET assembly
  declares no `ParentIds`. Long generated sources in, one sentence out — which is the whole ratio.
  It does **not** replace reading an adapter you are about to change; locating and establishing facts
  delegates, weighing a design does not
- **`research`** — **any single external fact**: release notes, migration guides, registry policy,
  vendor ticket status. Where the global `ctx7` rule is discharged, so the transcript stays out of
  this context. It grounds on this repo's peer ranges first, which is what stops it answering about a
  version this library does not build against. Mirrors `~/.claude/agents/research.md` plus a
  grounding section — keep the shared part identical or the two drift silently

## Output discipline
Every rule here was earned by a real failure in this repo.

**A `while read` loop must not let an inner command eat its stdin.** `git rev-list … | while read sha
…; do git cat-file blob "$sha" | grep -q X; done` returns *no* hits on a tree where the standalone
command returns one: `git` consumes the loop's input. Redirect (`</dev/null`) or, better, use the
tool built for the question — `git grep -l PATTERN $(git rev-list --all)` answers "which paths ever
contained X" directly and is what finally gave the right answer.

**`async` functions never throw synchronously.** A probe that arms a `throw` inside an `async`
loader tests the rejected-promise path, not the synchronous one, and passes while the defect it was
written for is still live. Put the throw in the non-`async` arrow that the caller actually invokes.

**`node -e "require('./server.mjs')"` starts the server and blocks.** Use `node --check` for a
syntax question; anything that listens belongs to Playwright's `webServer`.

**Never read a command's success from a filter that matched nothing.** DevExtreme floods stdout with
trial-license warnings (`W0019`, `W0021`) and legacy-component notices (`W3001`) on every run, so a
grep over e2e output matches noise whether or not the run passed. Redirect, echo `$?`, then search
the file — and match Playwright's own summary line, not prose.

**Ask for the smallest view first.** `git diff --stat` before a diff; `Read` with `offset`/`limit`
for a known region. Whole-file reads are for files you are about to reason about. Never read
`node_modules/devextreme` FESM files whole — they are generated and enormous; grep for the symbol
and read the surrounding lines.

## Commits
- **Subject** — one line, conventional prefix (`feat:`, `fix:`, `docs:`, `test:`, `build:`, `ci:`),
  naming what changed. A breaking change takes `!` and a `BREAKING CHANGE:` footer
- **Body** — prose wrapped at ~80 columns. What it owes: the reasoning, the alternative rejected,
  any number measured, and the finding the next reader would not guess. A body restating the diff is
  not worth writing
- **Close** with the trailer `Co-Authored-By: <model> <noreply@anthropic.com>` naming the model
  actually writing — the harness states the current name; never copy it from an earlier commit
- The npm `version` is bumped with `npm version <v> --no-git-tag-version` so the lockfile follows;
  tagging is a separate, deliberate step because the tag is what triggers the release workflow

## Skills
Four project skills in `.claude/skills/`, each a walk that has been run by hand and got something
wrong. **Project rules in this file always win over a skill.**

- **`/prove-defect`** — a suspected defect: arm a probe, watch it fail *for the right reason*, fix,
  then prove the test by reverting the fix. Every 3.0 defect went through this
- **`/new-adapter`** — a directive is eight edits (adapter, directive, family array, type-tests,
  smoke screen, both-direction e2e, README table, changelog). Missing one is silent
- **`/protocol-case`** — extend loadOptions coverage: measure what the widget sends, serialize it,
  teach the stub's parser *and* its response shape, assert against `__stats`
- **`/release-check`** — gates, changelog, version in both files, README parity, published-artifact
  check, then the tag

Path-triggered rules live in `.claude/rules/` and load with the tree they govern: `adapters.md` for
the binding families, `e2e.md` for `e2e/` and `smoke/`, `wire-protocol.md` for the remote surface.
Guidance is tiered by loading cost — this file holds only what must be resident in every context, and
a moved block leaves a pointer, never a copy.

## Docs
- `README.md` — the consumer-facing contract, written *from* `smoke/src/*.component.ts`. A directive
  that is not in its table does not exist as far as users are concerned
- `CHANGELOG.md` — every release. Breaking changes get their own section and say what a consumer has
  to change, not merely what moved
- `NEXT-STEPS.md` — the working queue: what is open, what was verified, and the findings worth
  keeping. Untracked by choice; it holds planning notes, not product. Sections are deleted as they
  land

## Critical Rules

**Binding engine**

- **NEVER let the widget and the signal share a mutable object graph.** `dxForm` edits the bound
  `formData` object *in place*, so handing it the signal's own object made both sides observe the
  same mutation and the structural comparison guarding widget→signal could never see a change —
  `[(dxFormData)]` silently stopped emitting for two releases. Write `dxStructuralClone` in, read one
  back. Its reach matches `dxStructuralEquals` exactly (plain objects, arrays and `Date` deep, class
  instances by reference), and those two must stay in step or clone depth and comparison depth
  disagree
- **`undefined` means "do not push".** The pusher effect skips it deliberately, so a signal cannot
  clear a widget option by going `undefined` — use `null` where the widget accepts one. Do not
  "fix" this
- **The re-entrancy latch drops the widget's synchronous reaction to our own write — including
  corrections.** A widget that partially rejects a write (TreeView's `selectItem` silently no-ops on
  an unknown key) would diverge from the signal forever, because structural equality then suppresses
  the reconciling read. An adapter whose write can be normalized or partially rejected opts into
  `reReadAfterWrite`; one whose post-write read is transiently incomplete (`state()` is `{}`
  pre-render) must not
- **Adapter event names are type-checked against the widget's `Properties`** — a typo or a vendor
  rename is a compile error. Generic internal adapters cannot be checked at their declaration site,
  so every event name they use needs a positive control in `examples/type-tests.ts`
  (`contentReady`, `pointSelectionChanged`, `pointClick`, `optionChanged` are pinned there)
- **A nested option is not in the typed option-name surface, so it needs a method-based adapter —
  and almost always a `contentReady` re-read.** `paging.pageIndex` and the grid `state()` change
  beneath their option without emitting a matching `optionChanged`: external
  `dataSource.pageIndex(0)` fires none (fixed 2.1.0), and a grid's `state()` is `{}` until first
  render (3.0). `contentReady` is the event the grid fires after rendering any such change;
  structural equality drops the reads that turn out to be no-ops, so the extra listener is cheap.
  **`searchPanel.text` is the measured exception**: it was believed to change silently on a
  `[(dxGridState)]` restore, and it does not. The restore calls `this.option('searchPanel.text', …)`
  outside its own `beginUpdate`/`endUpdate` block, and `_notifyOptionChanged` is gated on
  `_initialized` rather than on the update lock, so the event fires with `name: 'searchPanel'` like
  any other option write (verified against 26.1.3; no silent-setter path for this option exists in
  `grid_core`). `[(dxSearchPanelText)]`'s `contentReady` listener is therefore redundant for every
  known path — it is kept as the family default, not because a defect requires it
- **A widget's `state()` is `{}` until it has rendered.** The binding attaches at `initialized`,
  which is before the first layout, so a naive read captures an empty snapshot and — worse — the
  pusher effect can write it *back*, wiping the layout it exists to restore. `[(dxGridState)]`
  re-reads on `contentReady` and refuses to write an empty state

**Remote data (`dxRemoteStore`)**

- **NEVER call `DataSource.cancelAll()`.** It resets the internal operation-id counter, and the id
  reuse makes grid adapters silently discard every subsequent load. Cancellation is transport-level
  `AbortSignal` plus rejecting superseded loads with the literal `'canceled'` — DevExtreme's own
  token, which the DataSource drops without firing `loadError`, so the widget never flashes error UI
  for a load we aborted on purpose
- **`reload()` supersedes the *query*, never a key lookup.** `byKey` resolves a key the widget
  already holds; aborting it alongside the query loads left lookup editors *permanently blank* —
  the widget asks once for a display text, gets a rejection and never asks again. The two live in
  separate cancellation scopes; only injector destruction aborts a `byKey`
- **A load function may throw synchronously.** One not declared `async` throws while building its
  request, and if that escapes the tracking the in-flight count never comes back down: `isLoading`
  stays `true` for the rest of the session and the reason never reaches `error`. Both `load` and
  `byKey` funnel a synchronous throw into the normal rejection path
- **`DataSource.reload()` keeps `pageIndex`; `DataSource.filter()` resets it.** Dependency changes
  therefore reset to page 0 (a new query is a new result set) while a manual `reload()` keeps the
  page — that asymmetry is vendor semantics, not a choice
- **Stale resolves are vendor-guarded — add no client-side guard.** A superseded load that resolves
  anyway (a loader ignoring its `AbortSignal`) cannot overwrite the newest query: the `DataSource`
  load queue is FIFO per instance, grids cancel the superseded operation id on every new load, and a
  settled deferred drops late results (measured against 26.1.3). Pinned by the abort-ignoring-loader
  e2e in `remote.spec.ts`; that spec going red after a vendor bump means this guarantee moved

**loadOptions wire protocol**

The protocol is permanent for these widgets: the full `remoteOperations` matrix rides only a
loadOptions-shaped store, and the one alternative (ODataStore) caps below grouping and summaries.
This package must speak the protocol completely and must never depend on any particular server
implementation. These facts are pinned **by measurement**, not by vendor documentation:

- **Counts and summaries may arrive as quoted JSON strings.** Reference server implementations
  aggregate into a decimal and spell a decimal as a string, so a conformant endpoint answers `"120"`
  where DevExtreme's typings promise `120` — measured rendering as *"Page 1 of 120 (1200 items)"*.
  `totalCount`/`groupCount` are coerced when they parse as finite. **`summary` is deliberately not
  coerced**: it is positional and may legitimately carry a `min` over a string or date column
- **A collapsed group is `{key, items: null, count}`** and carries no `summary` member unless
  `groupSummary` asked. `isExpanded` on the group descriptor is what decides which shape comes back
- **TreeList asks for roots with `parentIds: [0]`** — its `rootValue` default is `0`, not `null` —
  and sends both `parentIds` and an equivalent `filter`. `parentIds` is the only member a TreeList
  adds, and the reference .NET implementation declares no `ParentIds` and never parsed it (verified
  against 5.1.0 metadata), so a remote hierarchy is a contract between the widget and the consumer's
  endpoint. The client's only job is not to drop what the widget produced
- **Widget search folds into `filter` via `useDefaultSearch`** — `searchExpr`/`searchOperation`/
  `searchValue` are never sent as their own params, matching the vendor client. `expand`,
  `customQueryParams` (ODataStore) and `startDate`/`endDate` (Scheduler) are out of scope by kind

**Tests**

- **`e2e/remote.spec.ts` runs serially** (`test.describe.configure({ mode: 'default' })`) because
  the stub's config and stats are shared mutable state. Its `beforeEach` waits for *every* screen to
  finish loading — a screen still in flight eats another test's injected failure or skews its request
  count, which is exactly how adding two screens in 3.0 broke five passing tests
- **Assert protocol claims against the stub's `__stats`, never against app-side counters.** A counter
  in the component proves the component ran; `__stats` proves what reached the wire
- **Browser-pane and manual DOM verification of a grid is unreliable** — rAF-driven rendering never
  runs in a hidden page (`visibilityState === 'hidden'`), so the DOM lies while the DataSource-level
  state is still inspectable via `ng.getComponent`. Trust Playwright for DOM assertions

**Packaging**

- **A per-family entry point imports only the `devextreme-angular/ui/<widget>` modules it adapts.**
  One stray import re-couples the families and the probe fails — which is the probe working
- Peer ranges are `@angular/core >=22.1 <23`, `devextreme`/`devextreme-angular >=26.1`, plus
  `@angular/forms >=22.1 <23` as an *optional* peer for the `forms` entry point. The Angular floor is
  22.1 because that is what CI exercises — an advertised range no gate runs is not a claim this repo
  makes. A version bump
  is a peer-range edit plus a green CI run; a red run is the compatibility net doing its job. The
  `'canceled'` token and the untyped `DataSource` internals are the two version-sensitive spots
