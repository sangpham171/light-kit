---
runs:
  - step: discover
    agent: light-tech-lead
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
---

# Discovery

## Method
Compared the stored request total for 008 with the session transcript, then recomputed the same total with and without duplicate `message.id` values. Checked what Codex, Copilot and Cursor keep locally.

## Claude Code: incoherent by coincidence
- Stored total for 008: `7926944` input / `111300` output.
- Transcript sum up to the last spec write (`specs/008-step-time/50-implementation.md`, 2026-10-26T20:38:46Z): `7926944` / `111300`. Exact match: the hook records what the transcript says.
- Same window, deduplicated by `message.id`: `3199172` / `41053`. Factor 2.48.
- Whole session now: 163 usage-bearing assistant entries, 0 without `message.id`, all duplicates identical; 64 unique responses. Raw `12276342`/`148369` vs dedup `4912753`/`54975` (factor 2.5).
- Cause: Claude Code writes one `assistant` entry per content block, each repeating the turn's `message.usage`. `usageFromTranscript` sums every entry.
- `/context`: 96.4k–98k of a 786.4k window. Last transcript turn prompt: 108,338. Different metric, same order. Cumulative usage is `turns × context`; it cannot equal the window.

## Clients
### Codex
- `~/.codex/sessions/<yyyy>/<mm>/<dd>/rollout-*.jsonl`, plus `~/.codex/session_index.jsonl` (id, thread name).
- `session_meta.payload.id` is the session id and appears in the rollout file name.
- `event_msg` with `payload.type = "token_count"` carries
  `info.total_token_usage` (`input_tokens`, `cached_input_tokens`, `output_tokens`, `reasoning_output_tokens`, `total_tokens`),
  `info.last_token_usage`, and `info.model_context_window` (258,400 in the sample). One event per turn, no duplicate counting seen.
- Not read by the kit today; the format is enough for a future reader.

### Copilot (VS Code)
- `~/Library/Application Support/Code/User/workspaceStorage/<ws>/chatSessions/<session>.jsonl`; `<ws>` maps to a folder through `workspace.json`.
- Each request object carries `promptTokens` and `completionTokens` with a timestamp and requestId (sample: 32,155 / 1,787). No context-window field.
- `globalStorage/github.copilot-chat/session-store.db` has sessions and turns only, no token columns.
- Not read by the kit today.

### Cursor
- Not installed on this machine; no record to inspect. Cursor uses the VS Code-style `state.vscdb`; token fields are unverified. The kit keeps `unknown`.

## Relevant code
- `kit/hooks/lib/usage.mjs` — `usageFromTranscript` is the summing point; `deltaUsage` already clamps resets.
- `kit/hooks/checks/token-usage.mjs` — state path and baseline handling; needs a version marker so pre-fix baselines are not mixed with deduplicated numbers.
- `tests/usage.test.mjs`, `tests/hooks.test.mjs` — readers and hook scenarios.
- `docs/usage.md`, `kit/hooks/README.md` — metric description and client limits.

## Constraints
- No new dependency; Node built-ins only.
- Existing state files are local and safe to reset; artifacts already written are not rewritten.
- A deduplicated total is smaller than the stored baseline, so the first delta after the fix would clamp to zero without a reset.

## Risks
- Some clients may omit `message.id`; fall back to the entry's own id so unrelated entries are never merged.
- The duplication factor varies with content blocks, so no fixed correction applies to old numbers.

## Token usage
Tokens: 0/0 (total 0)
Time: 1s
