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
Range: `2097ca7..b73f2d4` on `fix/016-copilot-token-usage`

| Commit | Change |
|---|---|
| `b73f2d4` | Copilot branch in the hook: find the chat session log by `session_id`, read `promptTokens`, `completionTokens` and `result.timings.totalElapsed`, use elapsed time for a request still running; tests and docs |

## Verification evidence
- `npm test` — 128/128.
- `usageFromCopilotSession` on this session's real log:
  `149,175 input · 0 cache read · 0 cache write · 34,666 output · 183,841 total`, time `10m 33s`.
- User-level install refreshed; the installed hook bodies match the sources.
- The hook was installed after this chat session started, so VS Code did not reload it here: the
  artifacts of this request keep `unknown`. A new Copilot chat session (or a window reload) loads it.
- VS Code sends a `transcript_path` for Copilot; the check ignores it because that transcript has no
  token fields, and reads `workspaceStorage/<ws>/chatSessions/<sessionId>.jsonl` instead. A test now
  covers that payload shape.

## Token usage
| Step | Input | Cache read | Cache write | Output | Total | Time |
|---|---|---|---|---|---|---|
| request | unknown | unknown | unknown | unknown | unknown | unknown |
| understand | unknown | unknown | unknown | unknown | unknown | unknown |
| implement | unknown | unknown | unknown | unknown | unknown | unknown |
| verify-and-review | unknown | unknown | unknown | unknown | unknown | unknown |
| fix | unknown | unknown | unknown | unknown | unknown | unknown |
| conclude | unknown | unknown | unknown | unknown | unknown | unknown |
| **Total** | | | | | unknown | unknown |

Reason: the hook was not active in this chat session when the artifacts were written; it could not
report a per-step split.

## Deferred technical debt and open findings
- Copilot `promptTokens` is the latest model call of a request, not a sum over its tool rounds; VS Code
  exposes no per-call prompt sum for this provider. The docs state the figure's meaning.
- Copilot cache reads and writes are not exposed and stay 0.
- Copilot CLI session storage is out of scope.

## Follow-ups
Start a new Copilot chat after installing so the updated hook is loaded, then write an artifact: its
`## Token usage` section should now be suggested with real figures.
