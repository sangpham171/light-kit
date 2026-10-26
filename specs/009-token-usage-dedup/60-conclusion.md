---
runs:
  - step: conclude
    agent: light-orchestrator
    model: deepseek-flash[1m]
    thinking: unknown
    level: medium
---

# Conclusion

## Summary
The token numbers in `specs/` were coherent with the transcript but inflated about 2.5 times: Claude Code writes one assistant entry per content block, each repeating the response's usage, and the reader summed every entry. Usage is now counted once per `message.id`; a state file from the old count restarts. `/context` is a different metric — current window occupancy — so the two should agree only in the last turn's prompt, not in the cumulative total. Codex and Copilot keep readable usage locally, Cursor is unverified; the kit still reads Claude Code only.

## Verification result
- Stored 008 total `7926944` / `111300` equals the raw transcript sum at its last spec write, exactly.
- Deduplicated at the same instant: `3199172` / `41053` (2.48× lower).
- Sample transcript: 163 usage entries, 64 unique messages, no missing ids, all duplicates identical.
- `/context` at the time: 96.4k of a 786.4k window. Last transcript turn prompt: 108,338. Same order; a different measure.

## What changed
Range: `57d3b6d2f097762acd724c65c7820836a3836acb..HEAD` on `fix/009-token-usage-dedup`
- `kit/hooks/lib/usage.mjs` — deduplicate usage by `message.id` (fallback: the entry's own id).
- `kit/hooks/checks/token-usage.mjs` — state `version: 2`; an older file is discarded so the first deduplicated delta is not zero and scales are not mixed.
- `docs/usage.md` — cumulative metric, `/context` distinction, per-client table.
- `kit/hooks/README.md` — the same distinction.
- `tests/usage.test.mjs`, `tests/hooks.test.mjs` — duplicate blocks, distinct messages, missing ids, state migration.
- Commits: `9411d23`, `902b7ee`.

## Client comparison
| Client | Local record | Usage data | Kit |
|---|---|---|---|
| Claude Code | session transcript | per-entry `message.usage`, repeated per content block; timestamps | tokens (deduplicated) and active time |
| Codex | rollout JSONL | `token_count` events: cumulative and last usage, `model_context_window` | `unknown` (reader is feasible) |
| Copilot in VS Code | workspace `chatSessions/*.jsonl` | per-request `promptTokens` / `completionTokens` | `unknown` (reader is feasible) |
| Cursor | VS Code-style `state.vscdb` | not verified (not installed) | `unknown` |

## Verification evidence
- `npm test`: 114 tests, 114 pass, 0 fail.
- Hook tests prove a repeated block counts once, distinct ids count, entries without ids count individually, and an old state file restarts.

## Token usage
| Step | Input | Output | Total | Time |
|---|---|---|---|---|
| 00-request | 5731870 | 62833 | 5794703 | 15m 58s |
| 10-understanding | 282319 | 1217 | 283536 | 9s |
| 20-discovery | 285545 | 1205 | 286750 | 7s |
| 40-plan | 288772 | 1292 | 290064 | 8s |
| 50-implementation | 1348610 | 7877 | 1356487 | 56s |
| 60-conclusion | 786518 | 6238 | 792756 | 34s |
| **Total** | 8723634 | 80662 | 8804296 | 17m 53s |

These are deduplicated values recomputed from the transcript at each artifact's write time, because the installed hook still counts repeated entries during this request. They are cumulative processed tokens; the 00-request row includes the session usage before the request began, per the existing rule.

## Deferred technical debt and open findings
- Codex and Copilot usage is not read yet; the formats are known (see the table). Cursor needs a machine where it is installed.
- Artifacts from requests 004–008 keep their inflated numbers; the state file cannot re-attribute them per step.
- Numbers in any project using the kit restart on the first run after this fix; written artifacts are not rewritten.

## Follow-ups
- Add a Codex reader (`token_count` cumulative plus `model_context_window`) and a Copilot reader (session file per workspace), in a later request.
- Reinstall the kit so the fix and the deduplicated baseline take effect.
