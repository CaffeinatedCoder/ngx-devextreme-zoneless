# Contributing

Issues and pull requests are welcome. For a vulnerability, use GitHub's
[private advisory form](https://github.com/CaffeinatedCoder/ngx-devextreme-zoneless/security/advisories/new)
rather than a public issue.

## Getting set up

```bash
npm ci
npm run verify   # build + type-contract tests — the gate before anything else
npm run e2e      # Playwright against the zoneless reference app
npm run probe    # tree-shaking / code-splitting probe
npm run ssr      # server render of every reference screen in Node
```

Node 24 or newer: the lockfile is npm-11 generated and npm 10 rejects it as out of sync.
`npm run e2e` starts the stub server (:4300) and the reference app (:4299) itself through
Playwright's `webServer` — never start either by hand alongside it.
[docs/development.md](docs/development.md) describes the layout; the architecture and the rules
that are easy to get wrong are in [CLAUDE.md](CLAUDE.md), which is worth reading before changing an
adapter, the binding engine or an entry point's imports.

## The quality bar

This package's characteristic failure is not a crash. It is a binding that does nothing. The signal
holds a value, the widget shows a value, the types check, nothing throws, nothing warns — and the
two stopped talking to each other. `[(dxFormData)]` shipped that way for two releases, because
`dxForm` edits the bound object in place and the structural comparison guarding widget→signal could
never see a change. Two of the six defects closed in 3.0 lived in directives with no coverage at
all, which is precisely why they survived.

Everything below exists because of that failure mode.

**The tests are not a quality gate on this library — they are its central claim.** Running
DevExtreme under zoneless change detection is outside the vendor's supported configuration
(ticket T1328486). The Playwright suite driving every directive through a real zoneless app is the
compatibility net DevExpress does not provide. A directive without a reference screen and a
both-direction e2e is unfinished, whatever the type-level story says.

**Reproduce before you fix.** Every defect closed in 3.0 was first written as an e2e that failed.
A fix with no test that fails without it is not finished.

**Prove the test by breaking the fix.** Strip only the fix, confirm the test fails *for the expected
reason*, restore. A test that passes with and without the fix asserts nothing. The walk is
[`.claude/skills/prove-defect`](.claude/skills/prove-defect/SKILL.md).

**Establish vendor behaviour from the installed sources, not from the documentation.** The rules in
CLAUDE.md are there because someone read `node_modules/devextreme` and measured: that the splitter
stores its sizes through `Options.silent()`, that a widget's `state()` is `{}` until it has
rendered, that a TreeList defaults to virtual scrolling where a DataGrid does not. A claim about
DevExtreme without a file and a line behind it is a guess.

**Assert protocol claims against real HTTP traffic.** The stub server's `__stats` endpoint proves
what reached the wire. A counter in a component proves only that the component ran.

**Measure the bundle claim.** A single value import of a wrapper class puts that widget in a
consumer's shell closure — 1.7 MB raw, measured. `npm run probe` is what notices; a one-line
`import` in the wrong place is what turns it red.

## Issues

Use the **Bug** or **Enhancement** form. The bug form asks whether the failure is silent or loud,
because a silent one is this library's characteristic defect and gets the `silent` label and a
reproduction before anything else.

Releases and longer themes are tracked as `epic` issues with the work attached as native
sub-issues. The pinned
[Roadmap](https://github.com/CaffeinatedCoder/ngx-devextreme-zoneless/issues/2) lists them, along
with what each label means. A maintainer sets the `entry/*`, `area/*` and `severity/*` labels when
triaging, and a pull request gets the same labels and milestone as the issue it closes.

### Labels

The same scheme as [CodoMetis.ValueRanges](https://github.com/CaffeinatedCoder/CodoMetis.ValueRanges),
on issues and pull requests alike.

| Axis | Labels |
|---|---|
| **Type** — exactly one | `bug`, `enhancement`, `documentation`, `tests`, `chore` |
| **`entry/*`** — the entry points affected | `core`, `data-source`, `editors`, `navigation`, `overlays`, `data`, `visualization`, `forms` |
| **`area/*`** — the concern across them | `binding-engine`, `wire-protocol`, `packaging`, `ssr`, `e2e`, `types`, `release`, `vendor` |
| **`severity/*`** — bugs only | `critical`, `high`, `medium`, `low` |
| **Structure** | `epic`, `roadmap` |

- **`silent`** — a binding that does nothing, or stops emitting, with no error anywhere. The
  defect class this library exists to catch. Its fix carries the e2e that fails without it, proven
  by reverting the fix, and its changelog entry says what a consumer saw while it was live.
- **`breaking`** — anything that changes a directive's name, its model type or its behaviour. Needs
  a major, and a `### Breaking changes` section in the version being prepared that says what a
  consumer has to change.
- **`found-by/gate`** — found by `verify`, `probe`, `ssr` or `e2e` going red on code that had
  already shipped.
- **`found-by/vendor-bump`** — found by moving DevExtreme or Angular. This is the net working, and
  worth counting separately: it is the whole reason the suite exists.
- **`stacked`** (PRs) — the base is another open PR. Merge them in order, and note that
  `Closes #n` is **inert** on such a PR: GitHub registers a closing reference only for a pull
  request targeting the default branch. Merging the base PR does not fix that by itself — GitHub
  retargets an open PR only when its base branch is *deleted*, and this repository has
  `delete_branch_on_merge` off — so retarget it yourself before merging it:

  ```bash
  gh pr edit <n> --base main
  ```

  Then check the issue actually closed. `gh pr view <n> --json closingIssuesReferences` is what
  tells you, and an empty result on a merged stack means closing it is yours to do.
- **`severity/critical`** is reserved for the two failures that cost a consumer something they
  cannot see: a binding that silently stops emitting, and a bundle that gains a widget nobody
  imported.

## Pull requests

- One concern per PR, with the reasoning in the description rather than only the diff.
- Open the description with `Closes #n`. CI fails a PR with no type label, a bug with no
  `severity/*`, or no closing reference ([`.github/scripts/pr-hygiene.sh`](.github/scripts/pr-hygiene.sh)).
- All four gates green: `verify`, `e2e`, `probe`, `ssr`.
- A behaviour change gets a both-direction e2e case; a type-surface change extends
  [`examples/type-tests.ts`](examples/type-tests.ts) in the same change. Neither is a follow-up —
  the type-contract tests are the enforcement.
- A new directive is eight edits: adapter, directive, family array, type tests, reference screen,
  e2e, the table in [docs/directives.md](docs/directives.md), changelog. Missing one is silent.
  The walk is [`.claude/skills/new-adapter`](.claude/skills/new-adapter/SKILL.md).
- No entry point may import `devextreme-angular/ui/<widget>` at runtime, and only `data-source`
  may import `devextreme/`. The probe is what tells you if you did.
- Match the surrounding style. The families are deliberately repetitive: the shape you want almost
  always already exists next door.

## Changelog

A version's section of [CHANGELOG.md](CHANGELOG.md) is the full record of that release, written for
someone deciding whether to upgrade. The GitHub release is a condensed read of it, not a copy
([below](#the-github-release)).

- **The heading** is `## x.y.z (yyyy-mm-dd)`. Write entries under the version being prepared, never
  under `Unreleased`; the first PR of a new version opens its section.
- **Sections, in this order:** `### Breaking changes`, `### Added`, `### Changed`, `### Fixed`,
  `### Removed`, `### Tests`, `### Verified`, `### Docs`, `### Not in this release, by decision`.
  Leave out the ones you don't need. Sections in releases before 4.2.0 are not in this order; they
  are left as they shipped.
- **An entry opens with the surface it changes in bold** — the directive, helper or option, then
  one line of what it is, then its entry point in parentheses:
  ``**`dxGridRows` — a grid's complete row axis, in display order** (`ngx-devextreme-zoneless/data`)``.
  Link the issue it closes.
- **Carry the measurement.** This is where this changelog departs from ValueRanges', which caps an
  entry at 60 words and sends the numbers to a guide. Here the number *is* the claim —
  "`getVisibleRows()` answers 16 of 60 rows", "W3001 is now 0 across all six screens", "1.7 MB raw"
  — because a consumer adopting an unsupported configuration is buying evidence, not a feature
  list. An entry that only restates the diff is not worth writing.
- **Breaking changes say what to change**, not merely what moved.
- **Links are absolute** (`https://github.com/CaffeinatedCoder/ngx-devextreme-zoneless/blob/main/docs/…`),
  because `docs/` does not ship in the npm tarball and a relative link 404s on npmjs.com and on the
  release page.
- **Leave out** test names, internal refactoring with no observable effect, and fixes to something
  introduced in the same release.

### The GitHub release

**Creating it is a manual step.** The release workflow publishes to npm on a `v*` tag and does
nothing else, so a tag plus a published package is not a release — 4.0.0 and 4.1.0 were on npm for
weeks with no release page behind them. Its body is a condensed read of the version's changelog
section, in the shape v3.0.0 set:

- A lede of two to four lines: what this release is for someone who has to decide.
- An `npm i ngx-devextreme-zoneless@x.y.z` block.
- The consumer-facing sections, promoted to `##`: `Breaking changes`, `Added`, `Changed`, `Fixed`,
  and `Tests` as prose rather than bullets. Leave out the sections that describe the project rather
  than the upgrade — `Verified`, `Docs`, `Removed` — and condense what you keep: v3.0.0's release
  body is 89 lines over its section's 309, keeping 20 of 31 entries.
- A closing line pointing at `CHANGELOG.md` for the measurements behind each claim.

```bash
gh release create v4.1.0 --title "v4.1.0" --notes-file notes.md --verify-tag --latest
```

`--verify-tag` is what stops a typo in the tag name creating a new one.

The version is bumped with `npm version <v> --no-git-tag-version`, so the lockfile follows. Tagging
is a separate, deliberate step: the `v*` tag is what triggers the release workflow, which publishes
to npm through trusted publishing with no token involved. The walk is
[`.claude/skills/release-check`](.claude/skills/release-check/SKILL.md).

## Commit trailers

Commits follow the conventional prefixes (`feat:`, `fix:`, `docs:`, `test:`, `build:`, `ci:`), with
a body in prose that owes the reasoning, the alternative rejected, any number measured, and the
finding the next reader would not guess. A fix also says how it was found and what kind it is, as
git trailers after the body:

```
Found-By: VB
Defect-Class: BIND
```

- **`Found-By:`** — `E2E` the Playwright suite, `PRB` the bundle probe, `SSR` the server render,
  `VT` the type-contract tests, `VB` a vendor bump, `RV` code review, `IS` an issue report,
  `US` a user. A defect a gate or a bump found carries the matching `found-by/*` label, so the
  trailer and the label count the same finds from either side.
- **`Defect-Class:`** — `BIND` the binding engine (echo suppression, equality, clone depth,
  teardown), `ADPT` a single adapter's events or option name, `WIRE` the loadOptions protocol,
  `RMT` remote data (cancellation, loading state, pushes), `PKG` packaging or entry-point
  isolation, `SSR` server rendering, `TYPE` the public type surface.

```bash
git log --format='%(trailers:key=Found-By,valueonly)' | grep . | sort | uniq -c
```

## AI-assisted development

A substantial portion of this library — the adapters, the binding engine and the test suite — was
written with AI assistance, using [Claude Code](https://claude.com/claude-code). This is stated
plainly because the package has real consumers who deserve to know how it is built, not because
anything about it is unusual.

- **Direction, architecture and acceptance are the maintainer's.** AI is a tool used under review,
  not an autonomous committer.
- **Nothing is accepted because it looks right.** The verification discipline above exists
  precisely because plausible-looking code is cheap to produce. A fix is proven against the defect
  it claims to fix, by reverting the fix and watching the test fail.
- **The audit trail is public.** Commit bodies record what was wrong, what a consumer would have
  seen, and what was measured. That is the evidence, and it is more informative than any statement
  about authorship.
- **Code is judged on behaviour, not provenance.** A defect is a defect whoever typed it.

If you contribute with AI assistance that is fine — the same bar applies. Please make sure you can
defend what you are submitting, and that it is yours to contribute.
