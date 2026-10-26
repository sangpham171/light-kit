---
runs:
  - step: implement
    agent: light-developer
    model: deepseek-flash[1m]
    thinking: unknown
    level: medium
---

# Implementation log

## Summary
Claude Code usage is counted once per response, the state file restarts when its counting format changes, and the docs explain that the figures are cumulative processed tokens rather than the context window, with what Codex, Copilot and Cursor keep locally.

## What changed
- `kit/hooks/lib/usage.mjs` — `usageFromTranscript` keeps a `seen` set of `message.id` (falling back to the entry's `uuid`/`id`) and counts each response once. Timestamps still come from every entry, so active time is unchanged.
- `kit/hooks/checks/token-usage.mjs` — state files carry `version: 2`; a file without it is discarded, so the first deduplicated delta is not clamped to zero and old inflated totals do not mix with new ones.
- `docs/usage.md` — the metric is named cumulative processed tokens; the `/context` difference is explained; a table lists what Claude Code, Codex, Copilot and Cursor store and what the kit reads.
- `kit/hooks/README.md` — same distinction in one paragraph.
- `tests/usage.test.mjs`, `tests/hooks.test.mjs` — duplicated blocks count once, distinct ids and entries without an id still count, and a pre-dedup state file restarts.

## Decisions
- Deduplicate by `message.id`, not by timestamp or content hash: the id is stable across the repeated content-block entries and present on every entry in the sampled transcripts.
- Discard pre-fix state on version change rather than keeping request totals: a partial reset would mix counts on different scales. Written artifacts keep their numbers.
- Do not implement Codex or Copilot readers in this request: the user asked for the comparison, and reading their files needs session-to-project mapping and live payload checks. Documented as follow-ups.

## Verification evidence
- `npm test`: 114 tests, 114 pass, 0 fail.
- Bookkeeping check for request 008: the stored `7926944`/`111300` equals the raw transcript sum at its last spec write; deduplicated it is `3199172`/`41053` (factor 2.48).
- Sample transcript: 163 usage entries, 64 unique messages; all duplicates identical; none without `message.id`.

## Technical debt
- Codex and Copilot usage remains unread; Cursor is unverified.
- Numbers in artifacts written before this fix stay inflated; they cannot be re-attributed per step from the state file.

## Review rounds
### Round 1 — self-review
- Checked: dedup key present on all sampled entries; entries without an id never merged; time unaffected; migration cannot produce a negative delta; docs no longer claim other clients expose no record.
- No findings.

## Token usage
Tokens: 1348610/7877 (total 1356487)
Time: 56s
