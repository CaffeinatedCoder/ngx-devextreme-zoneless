---
paths:
  - "core/src/lib/remote.ts"
  - "e2e/stub-server.mjs"
  - "e2e/remote.spec.ts"
---

# The loadOptions wire protocol

## The standing constraint

This package must speak the DevExtreme loadOptions protocol **completely**, and must depend on no
particular server implementation — not the vendor's .NET package, not any house-authored engine.
Facts measured against a server are evidence *about the protocol*; they are never a reason to couple
to that server. Anything genuinely implementation-specific (a take ceiling, an error-code vocabulary,
an auth scheme) belongs in the consumer's load function, not here.

The protocol is permanent for these widgets: the full `remoteOperations` matrix rides only a
loadOptions-shaped store, and the one native alternative (ODataStore) performs grouping client-side
and supports no summaries at all.

## Facts pinned by measurement

Each of these was established by driving a real widget and reading the wire, not from vendor
documentation — which is silent or wrong on all four.

- **Counts and summaries may arrive as quoted JSON strings.** Reference implementations aggregate
  into a decimal and spell a decimal as a string, so a conformant endpoint answers `"120"` where
  DevExtreme's own typings promise `number`. Measured consequence: the pager concatenates instead of
  adding and renders *"Page 1 of 120 (1200 items)"* for 120 rows. `totalCount`/`groupCount` are
  coerced in `normalizeCounts` when they parse as finite. **`summary` is deliberately not coerced** —
  it is positional and may legitimately carry a `min` over a string or date column, where coercion
  would corrupt a real value
- **A collapsed group is `{key, items: null, count}`**, and carries no `summary` member unless
  `groupSummary` asked for one. `isExpanded` on the group descriptor decides which shape comes back
- **TreeList asks for roots with `parentIds: [0]`** — `rootValue` defaults to `0`, not `null` — and
  sends both `parentIds` and an equivalent `filter` on the parent-id field
- **A grid asks for `requireGroupCount` only under group paging, and `remoteOperations: true` does
  not enable it.** The bare boolean expands to `filtering/sorting/paging/grouping/summary` — never
  `groupPaging` — and `requireGroupCount` is set in exactly one reachable place, the group-paging
  branch of the collapsed-grouping helper. A second gate sits behind it: `grouping.autoExpandAll`
  defaults to `true`, which ships the group descriptor as `isExpanded: true`, and any expanded level
  forces `remoteOperations.paging` back to `false` before that branch is reached. So a remote grouped
  grid needs **both** the object form with `groupPaging: true` **and** `autoExpandAll: false` before
  a group count ever reaches the wire. Measured: with them the first request carries
  `skip: 0, take: 5, requireTotalCount: true, requireGroupCount: true`; without them it carries none
  of the four. The grouped reference screen is configured this way deliberately — a `groupCount` that
  never arrives cannot exercise the coercion that exists for it
- **`groupCount` corrupts a different number than `totalCount` does.** Both are spelled as quoted
  strings by conformant servers, but the pager reads `totalCount` while `groupCount` feeds
  `totalItemsCount()`, computed as `totalItemsCount - totalCount + groupCount`. A string on the
  right of that `+` concatenates rather than adds — a digit-shifted row count that every downstream
  consumer then treats as a number, with no visible pager symptom to give it away
- **`parentIds` is not part of the reference .NET implementation's parsed surface.** Verified against
  5.1.0 assembly metadata: it declares no `ParentIds` (while `RemoteGrouping`, `PrimaryKey`,
  `TotalSummary` and the rest are all present). A remote hierarchy is therefore a contract between
  the widget and the consumer's endpoint; the client's only job is not to drop what the widget
  produced

## Serializer scope

`dxLoadOptionsParams` follows one rule: structured members are JSON-encoded, scalars are plain.

Carried: `filter`, `sort`, `group`, `select`, `totalSummary`, `groupSummary`, `parentIds`, `skip`,
`take`, `requireTotalCount`, `requireGroupCount`.

Deliberately absent, and why:

- `searchExpr` / `searchOperation` / `searchValue` — folded into `filter` by `useDefaultSearch: true`
  on the store, matching the vendor client, so the load function only ever deals in filter
  expressions
- `expand`, `customQueryParams` — ODataStore only
- `startDate`, `endDate` — Scheduler only

`sort` and `group` entries that are already objects pass through **untouched**, which is what keeps
`groupInterval` and `isExpanded` on a group descriptor alive. Only bare-string entries get normalized
to `{ selector, desc: false }`.

## The stub is the conformance fixture

`e2e/stub-server.mjs` is a deterministic protocol server, not a mock: injectable latency
(`delayMs`), failures (`failCount`/`failStatus`), decimal spelling (`stringCounts`), and `__stats`
recording what actually arrived.

Adding protocol coverage means **both halves** — its parser *and* its response shape. The parser had
been silently ignoring `totalSummary`, `groupSummary` and `parentIds`, so stub code reading them saw
nothing and the gap was invisible. When you add a member, add it to the parsed key list, honour it in
`loadDataset`, and assert it in `remote.spec.ts` against `__stats`.

Its determinism is the point. Do not make it query a database or introduce randomness; the fixture's
value is that a failure is always the client's.
