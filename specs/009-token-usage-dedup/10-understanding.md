---
runs:
  - step: understand
    agent: light-orchestrator
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
---

# Understanding

## Restatement
Check whether the token numbers in `specs/` agree with what Claude Code reports, explain any gap, and extend the comparison to Copilot, Codex and Cursor.

## Verification result
The accounting is internally coherent but the numbers are inflated.
- The request total stored for 008 (`7926944`/`111300`) equals exactly the sum of every `message.usage` entry in the session transcript up to the last spec write. Bookkeeping matches the transcript.
- The transcript repeats the same usage on several `assistant` entries per API response: 161 usage-bearing entries for 64 unique `message.id` values in one session. The sum counts each response 2.5 times on average.
- Deduplicated at the same instant: `3199172`/`41053`, a factor of 2.48 lower.
- `/context` (96.4k of a 786.4k window) is a different metric: the current context-window occupancy. The last transcript turn's prompt is 108,338 tokens — the same order. Cumulative usage grows with the number of turns (`turns × context`), so it can never equal `/context`.

## Client comparison (detail in 20-discovery)
| Client | Local record | What it holds | Kit today |
|---|---|---|---|
| Claude Code | `<project>/*.jsonl` transcript | per-assistant-entry `message.usage`; duplicated per content block; ISO timestamps | read, but duplicates counted |
| Codex | `~/.codex/sessions/**/rollout-*.jsonl` | `token_count` events with cumulative and last usage, `model_context_window` | not read |
| Copilot (VS Code) | `workspaceStorage/<ws>/chatSessions/*.jsonl` | per-request `promptTokens` / `completionTokens` | not read |
| Cursor | VS Code-style `state.vscdb` (not installed here) | unverified | not read |

## Requirements
1. Count each Claude Code response once: deduplicate usage by `message.id`, falling back to the entry's own id when absent.
2. Invalidate pre-fix state: a state file without the new version marker restarts the baselines, so the first delta after the fix is not clamped to zero and old inflated totals are not mixed with deduplicated ones.
3. Docs state the metric precisely: cumulative processed tokens, deduplicated, not context-window occupancy; and record what each client exposes and what the kit reads.
4. Tests cover duplicated entries, distinct messages and entries without an id, plus the state migration.
5. This request's own artifacts use deduplicated numbers where the transcript allows it.

## Acceptance criteria
- A transcript with three assistant entries for one `message.id` counts that usage once; three different ids count three times.
- The first hook run after the fix starts from a fresh baseline instead of reporting zero.
- `npm test` passes.
- `docs/usage.md` explains the `/context` difference and has the per-client table.

## In scope / Out of scope
In: Claude Code deduplication, state migration, docs comparison, tests.
Out: reading Codex or Copilot records (documented as follow-ups), Cursor verification (not installed), rewriting numbers already written in earlier artifacts.

## Triage
Scores: scope 2, ambiguity 1, risk 1, novelty 1, impact 2 (total 7)
Workflow: standard
Why: a correctness fix in the usage reader plus documentation; no data or security surface.

## Routing
- discover: easy — files and transcripts analysed.
- plan: easy.
- implement: medium — dedup and migration.
- verify-and-review: medium — accounting invariants.
- conclude: medium — correct this request's own numbers from the transcript.

## Token usage
Tokens: 0/0 (total 0)
Time: 1s
