---
step: understand
runs:
  - agent: light-orchestrator
    part: understanding and triage
    model: deepseek-flash
    thinking: unknown
    level: easy
usage:
  tokens: 0 input · 0 cache read · 0 cache write · 0 output · 0 total
  time: 2s
---

# Understanding

## Restatement
`token-usage` currently updates `.light-kit/usage.json` and then asks the agent, in its message, to
copy the suggested numbers into the artifact that was just written. Instead, after updating the state
the hook must edit that artifact itself: replace the `tokens:` and `time:` values of the header's
`usage:` block, and in `60-conclusion.md` replace the `usage:` list with one row per step plus the
total row. The message is kept only for the cases the hook cannot fix, such as an artifact with no
`usage:` entry in its header.

## Assumptions
- The hook may write the matched `specs/<id>/<step>.md` file: it already reads it and is the only
  writer at that point.
- The header `usage:` entry is the source of truth for the step; the hook rewrites it on every write
  so it stays current as the step accumulates usage.
- The conclusion's `usage:` is a list of `- step:` rows plus `total`. Other artifacts use a single
  `tokens`/`time` block.
- Legacy artifacts with a trailing `## Token usage` section are left as they are: only a filled
  legacy section is accepted, otherwise the message falls back to the old instruction.

## Open questions (with proposed defaults)
None.

## Requirements
1. After a write to a request artifact, update `.light-kit/usage.json` (or the user-level state) as
   today, then rewrite the artifact's header `usage:` entry with the step totals.
2. In `60-conclusion.md`, rewrite the `usage:` list with one row per step (sorted) plus the `total`
   row; include the conclusion step itself.
3. Return no message when the rewrite succeeds, so the agent has nothing to copy.
4. Fall back to the existing message when the header has no `usage:` entry or the rewrite fails.
5. Preserve the rest of the header and the body byte for byte.
6. Cover the new behaviour in `tests/hooks.test.mjs` and update the hook documentation.

## Acceptance criteria
- Writing a step artifact with `tokens: unknown` / `time: unknown` leaves the file with the step
  totals after the hook runs, and the hook emits nothing.
- Writing `60-conclusion.md` leaves a `usage:` list with a row per step plus `total`, and the hook
  emits nothing.
- An artifact with no header `usage:` entry still gets the informational message.
- A legacy trailing `## Token usage` section keeps its old handling.
- `npm test` passes.

## In scope / Out of scope
- In: `kit/hooks/checks/token-usage.mjs`, `tests/hooks.test.mjs`, `kit/hooks/README.md`,
  `docs/usage.md`, `kit/instructions/core.md`.
- Out: how usage is read from each client, the state file format, and the message contents for the
  fallback.

## Triage
Scores: scope 1, ambiguity 0, risk 1, novelty 0, impact 0 (total 2)
Workflow: direct
Why: one hook file and its tests, a precise instruction, and a small, revertible behaviour change;
the hook already locates the artifact and computes the values.

## Routing
- understand: easy — restates a precise instruction
- plan: easy — one file, a short ordered task list
- implement: medium — rewrite the YAML entry without disturbing the rest of the file
- review: medium — never below the implementation tier
- fix: medium — fixes follow the review tier
- conclude: easy — short summary
