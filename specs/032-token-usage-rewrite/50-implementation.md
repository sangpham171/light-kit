---
step: implement
runs:
  - agent: light-developer
    part: rewrite, tests and docs
    model: deepseek-flash
    thinking: unknown
    level: medium
  - agent: light-developer
    part: round 1 review fixes
    model: deepseek-flash
    thinking: unknown
    level: unknown
usage:
  tokens: 19,830 input · 1,422,720 cache read · 0 cache write · 8,958 output · 1,451,508 total
  time: 15m 57s
---

# Implementation

## Progress

| Task | Commit | Subject |
|---|---|---|
| 1 | `1166f91` | feat(hooks): rewrite the step usage in the artifact header |
| 2 | `2183363` | feat(hooks): rewrite the conclusion usage rows |
| 3 | `0b1f3df` | test(hooks): cover usage rewrite fallbacks and preservation |
| 4 | `bf3682b` | docs(hooks): the hook fills usage itself |
| debt | `1bcdd51` | refactor(hooks): keep only the legacy fill check |

## Technical debt

- TD-1 `kit/hooks/checks/token-usage.mjs` — once the header `usage:` entry is rewritten, the header
  branch of the old fill check is unreachable, and `field()`/`filledTokens()` lose their only caller —
  removed, leaving `legacyFilled()` for artifacts without a header entry — status: resolved (`1bcdd51`)
- TD-2 `kit/hooks/checks/token-usage.mjs` — the header rewrite, like `headerOf()` before it, matches
  `\n` only, so a CRLF artifact is left alone — status: noticed (pre-existing; out of scope per the plan)

## Decisions and deviations

- No deviation from the plan.
- The conclusion list is rebuilt from `state.requests[request].steps`, so a row the agent wrote for a
  step the hook never recorded is dropped (accepted risk in `40-plan.md`); a row per recorded step and
  the `total` row are written instead, sorted by step id, including `60-conclusion` itself.
- `rewriteUsage()` replaces the `usage:` line and its indented body up to the next unindented header
  line or the closing `---`; blank lines before a following key are kept, and all other header lines
  and the body are copied unchanged.
- State is saved before the artifact rewrite; a `writeFileSync` failure keeps the state update and
  returns the informational message.
- The hook rewrites a header entry that already holds numbers, because the state is the source of
  truth; an identical result skips the write, so a repeated run is silent and leaves the file alone.
- `.light-kit/usage.json` is local hook state; it is committed in the final checkpoint so the request
  leaves no uncommitted change, as the user asked.

## Verification

- `node --test --test-name-pattern='token-usage' tests/hooks.test.mjs` — 21/21 pass after tasks 1–3;
  23/23 after the round 1 review fixes.
- `npm test` — 172/172 pass after tasks 2, 3, 4 and the debt fix; 174/174 after the round 1 fixes.
- The three doc passages were read against the implemented behaviour: header rewrite, conclusion list,
  and the fallback-only message.

## Review rounds

### Round 1 of 1
- F-1.1 [should-fix] `kit/hooks/checks/token-usage.mjs:78` — The region boundary `/^\S/` stops at
  any unindented line, not just an unindented header key. A conclusion header whose `usage:` rows are
  written at column 0 (valid YAML, and accepted by `usageRows()` and `artifact-header.mjs`) ends the
  region at the first row: the rewrite inserts the sorted rows and leaves the old rows after them,
  producing duplicate/stale steps while returning success. — suggested fix: stop only at unindented
  mapping keys, e.g. `const isKey = (line) => /^\S/.test(line) && !/^-\s/.test(line);`, and add a
  conclusion test with unindented `- step:` rows asserting no duplicates remain — status: fixed
  (`3bf4dd5`)
- F-1.2 [nit] `tests/hooks.test.mjs:954` — No test covers the trailing-blank-line trim in
  `rewriteUsage` (`kit/hooks/checks/token-usage.mjs:79`); a regression there would still pass. —
  suggested fix: add a case with a blank line after the usage body before a following key and before
  `---`, asserting both stay — status: fixed (`535648f`)

Round 1 fixes: the region now ends only at an unindented mapping key, with regression tests for
column-0 rows and for blank lines before a key and before the closing `---`.

Verdict: changes requested

Outcome: every finding is fixed and verified; no finding is open.
