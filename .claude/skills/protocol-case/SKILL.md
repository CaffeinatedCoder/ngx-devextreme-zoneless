---
name: protocol-case
description: Adds a loadOptions wire-protocol case — widening the stub server's parser and response shape, adding a reference screen, and pinning the fact with an assertion against real HTTP traffic. Use when extending dxRemoteStore or dxLoadOptionsParams to cover more of the protocol, when a server disagrees with what the client sends, or when a protocol behaviour needs establishing. Triggers on "support X in loadOptions", "the server gets the wrong", "grouping/summaries/hierarchy don't work remotely", "what does the widget actually send". Not for widget-internal behaviour — that is the vendor-archaeologist agent.
---

# /protocol-case — measure the wire, then serve it

Read `.claude/rules/wire-protocol.md` first: it holds the standing constraint (this package speaks
the protocol completely and depends on no server implementation) and the facts already pinned.

## 1. Find out what the widget actually sends

Do not start from the vendor's documentation — it is silent or wrong on every fact currently pinned.
Put the widget on `/remote` bound to a `dxRemoteStore`, load the page, and read the stub's `__stats`:

```ts
const s = await (await request.get(`${STUB}/api/__stats`)).json();
console.log(JSON.stringify(s.history.filter((e) => e.path === '/api/thing'), null, 1));
```

This is how the TreeList's root sentinel turned out to be `0` rather than `null`, and how it came out
that it sends **both** `parentIds` and an equivalent `filter`. Expect to be surprised; write down what
you see before deciding what it means.

## 2. Serialize it, if the client is dropping it

`dxLoadOptionsParams` has one rule: structured members JSON-encoded, scalars plain. Add the member to
the right list. Objects already in `sort`/`group` pass through untouched, which is what keeps
`groupInterval` and `isExpanded` alive — do not "normalize" them.

If a member is deliberately absent (ODataStore-only, Scheduler-only, folded into `filter` by
`useDefaultSearch`), say so in a comment where the omission is, not only in the rules file.

## 3. Teach the stub — both halves

This is the step that gets half-done. `parseLoadOptions` had been silently ignoring `totalSummary`,
`groupSummary` and `parentIds`, so stub code reading them saw `undefined` and the gap was invisible.

- add the key to the parsed list (JSON-decoded for structured members);
- honour it in `loadDataset`, in the shape the protocol actually specifies — a collapsed group is
  `{key, items: null, count}` and carries `summary` **only** when `groupSummary` asked;
- keep it deterministic. No database, no randomness: the fixture's value is that a failure is always
  the client's.

If the case needs a new dataset, add a path rather than overloading an existing one — tests count
requests per path, and `/api/grouped-orders` exists beside `/api/orders` for exactly that reason.

## 4. Add a reference screen

On `/remote`, written the way a consumer would. Remember `beforeEach` must wait for it, or a screen
still loading will eat another test's injected failure.

## 5. Assert against `__stats`, not the app

The claim is about what reached the wire. Assert the exact structure sent — the whole filter
expression, the full group descriptor including `isExpanded`, the `parentIds` array per request —
and, where the envelope shape matters, the rendered consequence too.

## 6. Consider the response half

A response fact is as much protocol as a request fact. If servers may legitimately spell something
differently — decimals as quoted strings is the known one — put the spelling behind a stub switch
(`stringCounts`) and test both. Decide deliberately whether the client normalizes: counts are
coerced, `summary` is not, because it is positional and may hold a non-numeric aggregate.

## 7. Record the fact

`CLAUDE.md`'s wire-protocol Critical Rules, `.claude/rules/wire-protocol.md`, and `CHANGELOG.md`.
State it as measured, and say what proved it — these facts exist precisely because documentation did
not carry them.
