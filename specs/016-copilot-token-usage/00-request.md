---
runs:
  - step: request
    agent: light-orchestrator
    model: deepseek-v4-flash
    thinking: unknown
    level: medium
---

# Request 016 — Copilot token usage and time are unknown

Date: 2026-10-27
Requested by: light
Branch: `fix/016-copilot-token-usage` from `2097ca7` (`fix/015-copilot-prompt-location`)

## Original request
the tokens and time are unknown for github copilot. Fix it

## Observed
The `token-usage` hook only reads the Claude Code transcript (`usageFromTranscript`) and returns
early for every other client, so artifacts written in VS Code with Copilot keep `Tokens: unknown`
and `Time: unknown`. Copilot in VS Code does record both: each request in
`<User Data>/workspaceStorage/<ws>/chatSessions/<sessionId>.jsonl` carries `promptTokens`,
`completionTokens` and, once finished, `result.timings.totalElapsed`.

## Token usage
Tokens: unknown
Time: unknown
