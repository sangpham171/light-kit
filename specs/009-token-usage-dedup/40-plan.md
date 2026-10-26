---
runs:
  - step: plan
    agent: light-tech-lead
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
---

# Plan

## Task 1 — Deduplicate usage by message
- `usageFromTranscript`: keep a `seen` set keyed by `message.id`, falling back to the entry's `uuid`/`id`; count a usage object only the first time a key appears. Timestamps still come from every entry.
- Acceptance: `tests/usage.test.mjs` — three entries with one id count once; two ids count twice; entries without an id count individually.

## Task 2 — Version the state file
- `token-usage` writes `version: 2`. Reading a state without that version discards sessions and request totals, so a deduplicated total is never compared with a pre-fix baseline and one-time totals are not mixed.
- Acceptance: `tests/hooks.test.mjs` — an old-format state file yields a fresh step total; a new one keeps accumulating.

## Task 3 — Document the metric and the client comparison
- `docs/usage.md`: state that the figures are cumulative processed tokens per turn (input includes cache reads), deduplicated, not context-window occupancy; explain the `/context` difference; add the Claude Code / Codex / Copilot / Cursor table with what each stores and what the kit reads.
- `kit/hooks/README.md`: same distinction in one paragraph.
- Acceptance: the table and the `/context` sentence are present; no text still implies the numbers are a context size.

## Task 4 — Verify and correct this request
- Run `npm test`.
- Recompute this request's per-step tokens and time from the transcript at each artifact's mtime (deduplicated), and use those in `60-conclusion.md`; note that pre-fix artifacts carry inflated numbers.
- Acceptance: the conclusion table's total equals the deduplicated transcript total at the last artifact write.

## Risks
- Entries without `message.id` from other clients would be counted individually; that matches their one-entry-per-turn shape.
- Resetting state loses local totals for finished requests; they remain in their written artifacts.

## Token usage
Tokens: 288772/1292 (total 290064)
Time: 8s
