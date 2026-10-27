---
step: understand
runs:
  - agent: light-orchestrator
    model: deepseek/deepseek-flash
    thinking: high
    level: medium
usage:
  tokens: 155,331 input · 0 cache read · 0 cache write · 915 output · 156,246 total
  time: 6s
---

# Understanding

## Restatement
`runs:` headers must record the model that actually ran the step. Today the `session-context` hook reports
only the thinking effort, so an agent that does not reliably know its own model id writes `model: unknown`.

## Evidence
- `specs/020-copilot-thinking-effort` says `deepseek/deepseek-v4-flash`, which matches the model recorded by
  its session (`~/.copilot/session-state/<id>/events.jsonl`, `session.start.data.selectedModel`).
- `specs/021-copilot-agent-host-usage/00-request.md` and `10-understanding.md`, and all four artifacts of
  `specs/022-copilot-cache-read-zero`, say `model: unknown` although their sessions record
  `deepseek/deepseek-v4-flash` and `deepseek/deepseek-flash`.
- `kit/hooks/lib/normalize.mjs` already exposes `ctx.model`, and `kit/hooks/checks/session-context.mjs`
  ignores it; it reports only `detectEffort`.

## Root cause
The model is never handed to the agent, and the kit has no reader for the model in the client's session
record (only `kit/hooks/lib/effort.mjs` reads that record, and only for the effort).

## Requirements
1. Report the model in the session-start context, next to the thinking effort.
2. Read it from the source the client already writes: the hook payload first, then the Copilot session
   record (`session.start.data.selectedModel`, then `selectedModel.identifier` in the chat session log),
   then the Claude Code transcript (`message.model`). Cursor and Codex stay silent.
3. Stay best-effort and silent: an unsafe session id or an unreadable record returns nothing, and the hook
   never throws.
4. Fill `model:` in request 021 and 022 artifacts where the recorded session states the value.
5. Keep the existing effort behavior and messages for clients that report only an effort.

## Triage
Scores: scope 2, ambiguity 1, risk 0, novelty 1, impact 0 (total 4)
Workflow: standard
Why: one new reader library, one hook line, docs, tests, plus a historical backfill.

## Routing
- understand: easy — the session record was already located for the effort
- implement: medium — new reader module, shared record helpers, hook message, tests
- review: medium — check precedence, silence and path safety
- conclude: easy — summarize

## Out of scope
- Requests 018 and 019: their sessions selected `auto` (a router), so no model id is recorded and `unknown`
  is the truthful value.
- Token usage and elapsed time.
