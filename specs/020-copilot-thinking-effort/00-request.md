---
step: request
runs:
  - agent: light-orchestrator
    model: deepseek/deepseek-v4-flash
    thinking: high
    level: easy
usage:
  tokens: unknown input · unknown cache read · unknown cache write · unknown output · unknown total
  time: unknown
---

# Request 020 — Copilot thinking effort stays unknown

Date: 2026-10-27
Requested by: light

## Original request
The thinking effort is unknown for GitHub Copilot. Fix it.

## Scope
Report the thinking effort recorded in the Copilot session itself (VS Code chat session log and the agent-host event log), not only the model configuration override in `state.vscdb`.
