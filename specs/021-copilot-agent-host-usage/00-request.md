---
step: request
runs:
  - agent: light-orchestrator
    model: unknown
    thinking: high
    level: easy
usage:
  tokens: unknown input · unknown cache read · unknown cache write · unknown output · unknown total
  time: unknown
---

# Request 021 — Copilot usage stays unknown for agent-host sessions

Date: 2026-10-27
Requested by: light

## Original request
after the specs specs/016-copilot-token-usage and specs/019-copilot-token-usage, the usage token and time are still unknown for github copilot. Fix it

## Scope
Make the `token-usage` hook report tokens and time for Copilot sessions whose record is the agent-host
event log (`~/.copilot/session-state/<id>/events.jsonl`, the one VS Code agent sessions and the CLI
write), while keeping the existing VS Code chat-window log as a fallback.
