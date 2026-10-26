Closes #

<!--
Give this PR the same labels and milestone as the issue it closes: one type (bug, enhancement,
documentation, tests, chore), every entry/* it touches, the area/* concern, severity/* on a bug,
and silent, breaking, found-by/* or stacked where they apply. The legend is in CONTRIBUTING.md
and in the pinned Roadmap. CI fails a PR with no type label, a bug with no severity, or no
closing reference.
-->

## Problem

<!-- What was wrong or missing, and what a consumer would have seen. For a silent defect, say what
     looked fine while it was broken. -->

## Change

<!-- What changed, file by file where it helps. The reasoning, and the alternative rejected. -->

## Tests

<!-- What proves it. For a fix: the e2e case, and that it fails with the fix reverted — say which
     assertion fails and for what reason. For a new directive: the reference screen and the
     both-direction case. For a type-surface change: the examples/type-tests.ts additions. -->

## Gates

<!-- Delete what doesn't apply; a behaviour change needs e2e, an import change needs probe. -->

- [ ] `npm run verify`
- [ ] `npm run e2e`
- [ ] `npm run probe`
- [ ] `npm run ssr`
