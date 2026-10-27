---
step: understand
runs:
  - agent: light-orchestrator
    model: unknown
    thinking: high
    level: medium
usage:
  tokens: unknown input · unknown cache read · unknown cache write · unknown output · unknown total
  time: unknown
---

# Understanding

## Restatement
The `token-usage` hook still prints `unknown` for Copilot. Requests 016 and 019 taught it to read the VS
Code chat-window log (`User/workspaceStorage/<ws>/chatSessions/<sessionId>.jsonl`). Copilot in VS Code
now runs agent sessions on the agent host, which writes no `chatSessions` file: it writes
`~/.copilot/session-state/<sessionId>/events.jsonl`. With no matching chat log the check returns before
reporting, so tokens and time stay `unknown`.

## Evidence
- This session's payload carries `sessionId: eb8553d5-…`; no `workspaceStorage/*/chatSessions/eb8553d5-*.jsonl`
  exists, and `copilotSessionFile('eb8553d5-…')` returns `''`.
- `~/.copilot/session-state/eb8553d5-…/events.jsonl` holds 31 `session.usage_record` events, each with
  `data.usage`: `inputTokens`, `outputTokens`, `cacheReadTokens`, `cacheWriteTokens`, `duration`.
  No other event type carries `data.usage`.
- Three earlier agent-host sessions (`2375c25e`, `3246b665`, `a4494671`) have the same shape; their
  artifacts under `specs/019` and `specs/020` report `unknown`.
- `kit/hooks/lib/effort.mjs` already locates that event log (`copilotEventsFile`, honouring
  `COPILOT_HOME`), so the location is known to the kit.
- Tool names in these sessions are `create`, `edit`, `bash`, `view`, `apply_patch`, `glob`, `rg` —
  the write kinds the check already recognises.

## Assumptions
- `session.usage_record` events are one per model call, so summing them is cumulative processed tokens
  (same meaning as the Claude Code reader: a long session re-reads its prompt each turn).
- Tokens per record are that call's own figures, so no deduplication key is needed.

## Open questions (with proposed defaults)
None.

## Requirements
1. Read Copilot usage from `~/.copilot/session-state/<id>/events.jsonl` when that file exists, honouring
   `COPILOT_HOME`.
2. Report input, output and cache read/write from `session.usage_record`; count each record as one call.
3. Time: sum the gaps between consecutive event timestamps, capped by the same 15-minute idle limit as
   Claude Code, plus the gap to the payload timestamp while a call is still running.
4. Keep the VS Code chat-window log as a fallback when no event log exists; behave as before otherwise.
5. Silent when neither record is readable, as today.
6. Document both record shapes for Copilot.

## Acceptance criteria
- `usageFromCopilotEvents` returns summed tokens, cache figures and gap time on a fixture log.
- `copilotEventsFile` resolves `<COPILOT_HOME>/session-state/<id>/events.jsonl` and rejects an id that
  could escape the folder.
- A Copilot post-tool payload for `specs/001-x/50-implementation.md` with only an event log reports the
  usage and time instead of staying silent.
- The chat-window log still reports when no event log exists (`tests/hooks.test.mjs` unchanged case).
- `npm test` passes.

## In scope / Out of scope
In: the Copilot agent-host event log as a usage source; docs and tests.
Out: Codex and Cursor usage; Copilot CLI history files under other paths; changing the counting version.

## Triage
Scores: scope 2, ambiguity 1, risk 1, novelty 2, impact 2 (total 8)
Workflow: standard
Why: one hook reader plus tests and docs, no interface change for users.

## Routing
- understand: medium — diagnosis of where the record lives
- implement: medium — new reader, wiring, tests, docs
- review: medium — one reviewer pass over a small diff
- conclude: easy — summary of a contained change
