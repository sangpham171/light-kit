---
step: request
runs:
  - agent: light-orchestrator
    model: deepseek/deepseek-flash
    thinking: high
    level: easy
usage:
  tokens: 1,956,643 input · 0 cache read · 0 cache write · 19,421 output · 1,976,064 total
  time: 2m 29s
---

# Request 023 — The model stays unknown in artifacts

Date: 2026-10-27
Requested by: light

## Original request
in specs specs/020-copilot-thinking-effort, there is model name. but after that the model is unknown. Fix it

## Scope
Make the model in use known to the agent, so every `runs:` header records it, and fill the model in the
artifacts that say `unknown` although the client's own session record states it.
