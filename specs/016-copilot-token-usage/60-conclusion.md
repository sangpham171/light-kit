---
runs:
  - step: conclude
    agent: light-tech-writer
    model: deepseek-v4-flash
    thinking: unknown
    level: easy
---

# Conclusion

## Summary
The `token-usage` hook now reports tokens and time for GitHub Copilot in VS Code instead of
`unknown`. Claude Code behaviour is unchanged; Cursor and Codex still report `unknown`.

## What changed
Range: `2097ca7..533ff64` on `fix/016-copilot-token-usage`

| Commit | Change |
|---|---|
| `b73f2d4` | Copilot branch in the hook: find the chat session log by `session_id`, read `promptTokens`, `completionTokens` and `result.timings.totalElapsed`, use elapsed time for a request still running; tests and docs |
| `533ff64` | Review fix: `kind: 2` in the operation log appends a request instead of replacing the array, so the earlier request's elapsed time survives |

## Verification evidence
- `npm test` — 128/128.
- `usageFromCopilotSession` on this session's real log:
  `382,994 input · 0 cache read · 0 cache write · 61,655 output · 444,649 total`, time `32m 35s`.
- End-to-end run of the installed hook with a VS Code-shaped payload and a copy of the live log:
  tokens and time reported (`33m 10s`).
- User-level install refreshed; the installed hook bodies match the sources.
- Live check: the Copilot hooks log shows `replace_string_in_file` reaching `token-usage` and the
  hook reporting `421,356 input · 0 cache read · 0 cache write · 76,399 output · 497,755 total`,
  `39m 55s` for step 50-implementation. Later edits raised the recorded step total to `432,957` input,
  `84,957` output, `517,914` total, `41m 32s`.
- VS Code sends a `transcript_path` for Copilot; the check ignores it because that transcript has no
  token fields, and reads `workspaceStorage/<ws>/chatSessions/<sessionId>.jsonl` instead. Tests cover
  that payload shape, the real `create_file` tool name, and append/delete semantics.

## Token usage
| Step | Input | Cache read | Cache write | Output | Total | Time |
|---|---|---|---|---|---|---|
| request | unknown | unknown | unknown | unknown | unknown | unknown |
| understand | unknown | unknown | unknown | unknown | unknown | unknown |
| implement | 432,957 | 0 | 0 | 84,957 | 517,914 | 41m 32s |
| verify-and-review | unknown | unknown | unknown | unknown | unknown | unknown |
| fix | unknown | unknown | unknown | unknown | unknown | unknown |
| conclude | unknown | unknown | unknown | unknown | unknown | unknown |
| **Total** | 432,957 | 0 | 0 | 84,957 | 517,914 | 41m 32s |

The implementation row also carries the session usage from request and understand, which were
written before Copilot write tools were recognised; they cannot be separated retroactively.

## Deferred technical debt and open findings
- Copilot `promptTokens` is the latest model call of a request, not a sum over its tool rounds; VS Code
  exposes no per-call prompt sum for this provider. The docs state the figure's meaning.
- Copilot cache reads and writes are not exposed and stay 0.
- Copilot CLI session storage is out of scope.

## Follow-ups
Restart the AI client after upgrading so the hook files are reloaded; a new Copilot chat then reports
every step from its first artifact. Map the Copilot read tool names (`read_file`, `grep_search`,
`file_search`, `list_dir`) in `KINDS.read` so read-side safety guards cover them too (TD-1).
