---
step: understand
runs:
  - agent: light-orchestrator
    part: understanding
    model: deepseek-flash[1m]
    thinking: unknown
    level: medium
usage:
  tokens: 0 input · 0 cache read · 0 cache write · 0 output · 0 total
  time: 5s
---

# Understanding

## Restatement
Record in `.light-kit/` how many times each agent and each skill was invoked, per request, as a table whose first column is the request and whose last row totals every request. Store the same data a second time in a format the implementer judges better.

## Prior requests
- `031-session-id-secret-false-positive`, `032-token-usage-rewrite` — established the hook lib pattern (`kit/hooks/lib/usage.mjs`) and the "best-effort, never error" reader style.
- `027-tool-call-log`, `028-tool-log-per-request` — established per-request attribution through `currentRequest(activeRequests(...))` and the "silent write, never block" hook behaviour; `tool-log` is the closest precedent.
- `038-tool-log-stop-commit` — hook state files are local JSON under `.light-kit/`; a stop hook may commit its own files.
- No earlier request records agent or skill counts.

## Assumptions
- Claude Code exposes subagent calls on the `Agent` tool (`subagent_type` in the input) and older builds on `Task`; skills arrive on the `Skill` tool (`skill` in the input). Copilot/Cursor/Codex record nothing until they expose an equivalent tool.
- A call made before a request folder is active belongs to `(no request)`; it is reported, not silently dropped.
- Local stats are committed like `.light-kit/usage.json` already is.

## Requirements
1. After every agent or skill call, increment that name's count for the request the session is working on.
2. Write `.light-kit/agent-skill-usage.md`: one row per request (first column), one column per name used, a final `**All requests**` row with column totals.
3. Write `.light-kit/agent-skill-usage.json` as the source of truth: versioned, per-request agent and skill counts plus first/last use timestamps.
4. Ignore repeated delivery of the same tool call (dedupe by `tool_use_id`).
5. Never break the agent: unreadable state restarts empty, writes are atomic, other tools are ignored.
6. Leave unmanaged (user-level, no `.light-kit`) projects untouched.
7. Make the check configurable (`off`) like every other hook.

## Acceptance criteria
- An `Agent` call for `light-developer` and a `Skill` call for `light-triage` inside request `001-x` produce a JSON entry `001-x` with each count at 1 and a Markdown row `001-x` with 1 in both columns.
- The Markdown's last row is `**All requests**` and equals the sum of every request row.
- Replaying the same `tool_use_id` does not increment the count.
- A call with no active request increment the `(no request)` row.
- Non-agent tools (Bash, Read, Write) create no stats file.
- A user-level install in a project without `.light-kit` creates no stats file.
- `hooks.agent-skill-usage: "off"` disables it.
- `npm test` passes.

## In scope / Out of scope
- In: detection, per-request aggregation, JSON + Markdown writers, config default, generated Claude matcher, tests, hook docs.
- Out: a UI, historical backfill from existing tool logs, per-model or per-duration statistics, clients with no tool event for agents/skills.

## Triage
Scores: scope 1, ambiguity 1, risk 0, novelty 1, impact 1 (total 4)
Workflow: standard
Why: one hook component following existing patterns; the only ambiguity was the second storage, resolved by choosing JSON.

## Routing
- understand: easy — restate a clear request.
- discover: easy — patterns already read.
- plan: easy — one component, known files.
- implement: medium — new hook plus renderer and tests.
- verify-and-review: medium — logic bugs hide in aggregation and dedupe.
- conclude: easy — summarize.

## Agent plan
- understand: light-orchestrator — baseline.
- discover: light-orchestrator — discovery done inline from the existing hook sources; skip `light-tech-lead` + `20-discovery.md` (reason: the three precedent hooks were read directly).
- plan: light-orchestrator — merge plan into this step (after inline discovery).
- implement: light-orchestrator — code written in the main session; no separate developer call needed for a single hook.
- verify-and-review: light-reviewer — independent read of the diff.
- fix: light-orchestrator — apply review findings.
- conclude: light-orchestrator — final summary.
