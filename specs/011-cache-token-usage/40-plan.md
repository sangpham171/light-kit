---
runs:
  - step: plan
    agent: light-tech-lead
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
---

# Plan

## Task 1 — Separate cache from input in the reader
- `kit/hooks/lib/usage.mjs`: `input` counts only `input_tokens`; `cacheRead` and `cacheWrite` stay separate; `totalUsage` adds all four; `formatUsage` prints `input · cache read · cache write · output · total`; `deltaUsage` carries the two cache fields.
- Acceptance: `tests/usage.test.mjs` — 10 fresh, 2 write, 3 read, 4 output yields `{ input: 10, cacheRead: 3, cacheWrite: 2, output: 4 }`, total 19, and the formatted line names all five.

## Task 2 — Migrate the state and widen the table
- `kit/hooks/checks/token-usage.mjs`: `STATE_VERSION = 3`; `ZERO` and the per-session/per-step records carry `cacheRead` and `cacheWrite`; deltas accumulate them; step rows and the total row use the 7-column shape `Step | Input | Cache read | Cache write | Output | Total | Time`.
- Acceptance: `tests/hooks.test.mjs` — state records hold the cache fields; a v2 file restarts; the note's rows and total carry seven cells.

## Task 3 — Templates and documentation
- `kit/templates/60-conclusion.md`: 7-column header, row and total row.
- `docs/usage.md`: input is uncached prompt tokens; cache read and cache write are reported separately and added to the total; the line example shows all five.
- `kit/hooks/README.md`: the same definition in the `token-usage` paragraph.
- `kit/instructions/core.md`: name the cache figures.
- Acceptance: `tests/kit.test.mjs` asserts the 7-column header; no text still says input includes cache reads.

## Task 4 — Verify and record this request
- Run `npm test`.
- Recompute this request's steps from the transcript at each artifact's modification time under the new definition and write them in `60-conclusion.md`; say that artifacts written before the change keep the old definition.
- Acceptance: the conclusion's total equals the transcript aggregates at the last artifact write.

## Risks
- Restarting the state loses the in-flight totals of request 011 so far; they are recomputed for the conclusion.
- Artifacts from requests 004–010 keep `input` with cache folded in; the conclusion notes it.

## Token usage
Tokens: 109,250 input · 445 output · 109,695 total
Time: 4s
