---
name: release-check
description: The pre-release walk — gates green, changelog complete and honest about breaking changes, version consistent across package.json and the lockfile, README in step with the exported surface, the release notes written for the workflow to publish, then the tag that triggers publishing. Use before cutting a release, when preparing a version bump, or when checking whether a release is ready. Triggers on "release", "cut a version", "ready to publish", "prepare 3.0". Not for deciding what goes in — that is a scope question.
---

# /release-check — what must be true before the tag

Publishing is triggered by pushing a `v*` tag: the workflow publishes to npm via OIDC trusted
publishing, with provenance. There is no undo — `package@version` can never be reused, even after an
unpublish. Everything below happens **before** the tag.

## 1. Gates, all four

```bash
npm run verify   # build + type contract
npm run e2e      # the full suite, not a subset
npm run probe    # entry-point isolation
npm run ssr      # server render of every screen — the same app, on Node
```

Route them through `verify-runner`. The e2e suite is the release claim — a subset run is not
evidence, and a skipped or `.only`-scoped spec is a broken release. Grep for `test.only` and
`test.skip` explicitly.

## 2. Version, in both files

```bash
npm version <major|minor|patch> --no-git-tag-version
```

`--no-git-tag-version` so the lockfile follows without creating a tag as a side effect — tagging is a
separate, deliberate step because the tag is the trigger. Confirm `package.json` and both version
fields in `package-lock.json` agree, and that `dist/package.json` picks it up after a rebuild.

## 3. Changelog

- A section for this version, dated on release.
- **Breaking changes get their own section**, and each entry says what a consumer has to *change* —
  not what moved internally. A behaviour fix that alters an observable value is breaking even when it
  is unambiguously a fix: 3.0's `[(dxFormData)]` stopped mutating the caller's object and
  `[(dxGridState)]` began yielding a populated layout, and both had to be stated that way.
- Every entry earns its place by being something a consumer can act on. Internal refactors do not
  need a line.

## 4. README and docs parity

The directive tables live in `docs/directives.md` and must match what the entry points actually
export — a directive missing from them does not exist as far as users are concerned. Examples come
from `smoke/src/*.component.ts`; if a screen changed, check the prose still matches, in the README
*and* in the `docs/` page that owns the topic. README links into `docs/` are absolute GitHub URLs
(the tarball ships only the README, so relative links would 404 on npmjs.com) — a renamed or moved
docs page must be re-linked there. Badges are dynamic (shields queries the registry), so they need
no edit.

## 5. Published-artifact check

Build and look at what actually ships:

```bash
npm run build && ls dist && head -20 dist/README.md
```

`dist/` is what `npm publish` uploads — confirm the README carried over, the version is right, and
nothing unintended is in the tarball. Note that an npm README **cannot be edited after publishing**,
so a README defect is only fixable by the next version.

## 6. Peer ranges

If this release adds support for a new Angular or DevExtreme major, the peer range must say so, and
CI must have run green against it. A red run on a version bump is the compatibility net working —
that is the product.

## 7. Release notes, reviewed

`release-notes/<version>.md` must exist, because the workflow publishes it verbatim once npm has
the package. It is the condensed read of the version's changelog section — a lede, an `npm i`
line, the consumer-facing sections at `##`, a closing link to `CHANGELOG.md` — in the shape
`CONTRIBUTING.md`, "The GitHub release", describes. Write it in the release pull request, where it
gets reviewed like anything else.

```bash
ls release-notes/$(node -p "require('./package.json').version").md
```

Missing it does not block the release: the workflow falls back to a **draft** built from the raw
changelog section, which is deliberately visible rather than silent. But a draft is not a release
page, so write the file. Check it locally against a stubbed `gh` if you have changed the script:

```bash
.github/scripts/create-release.sh <version>
```

## 8. Then, and only then

Tag and push. The tag name (`v<version>`) is what the release workflow matches; the trusted-publisher
configuration on npmjs.com matches on owner, repository name and workflow filename, so if any of
those three changed, verify the entry before tagging — a mismatch surfaces only as an auth failure
at publish time.
