---
runs:
  - step: understand
    agent: light-orchestrator
    model: deepseek-v4-flash
    thinking: unknown
    level: medium
---

# Understanding

## Restatement
The `token-usage` hook must report tokens and time for GitHub Copilot in VS Code, not
`unknown`.

## Root cause (verified)
`kit/hooks/checks/token-usage.mjs` starts with `if (ctx.tool.kind !== 'write' || ctx.client !== 'claude') return null;`
and only reads `transcript_path`. Copilot hooks send no transcript path and are therefore ignored.

## Source of truth (verified)
A VS Code chat session is an operation log at
`~/Library/Application Support/<edition>/User/workspaceStorage/<ws>/chatSessions/<sessionId>.jsonl`:

- `kind: 0` holds the initial snapshot (`v.requests`).
- `kind: 1|2|3` records carry a key path `k` and a value `v`: `kind: 1` sets a field, `kind: 2`
  pushes onto an array (a new request is pushed onto `requests`), `kind: 3` deletes. Fields are
  updated with paths such as `["requests", 0, "promptTokens"]`.
- A request exposes `timestamp`, `promptTokens`, `completionTokens` and
  `result.timings.totalElapsed` (available once the request finishes).
- `promptTokens` describes the latest model call of that request; `completionTokens` is the request's
  cumulative output. VS Code exposes no per-call prompt sum for this provider.

## Requirements
1. The hook reads Copilot session usage from the chat session log when the client is `copilot` and
   `sessionId` is present, locating the file by session id under the VS Code workspaces.
2. Tokens map to input (`promptTokens`), output (`completionTokens`), cache read/write = 0.
3. Time uses `result.timings.totalElapsed` for finished requests and the elapsed time since the
   request's `timestamp` for the request still running, capped at the idle limit.
4. The per-session baseline still works, so each artifact gets the delta since the previous one.
5. Unreadable or missing session records stay silent, never error.
6. Tests, hook docs and `docs/usage.md` describe the new source; Cursor and Codex stay `unknown`.

## Out of scope
- Copilot CLI session storage.
- A cumulative per-call prompt sum, which VS Code does not expose for this provider.

## Triage
Scores: scope 1, ambiguity 0, risk 0, novelty 1, impact 0 (total 2)
Workflow: direct
Why: one hook and its reading library, following the existing usage pattern; the source of truth is
known and testable.

## Token usage
Tokens: unknown
Time: unknown
