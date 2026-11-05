---
step: request
runs:
  - agent: light-orchestrator
    part: request and conversation capture
    model: deepseek-flash
    thinking: unknown
    level: easy
usage:
  tokens: 41,241 input · 659,072 cache read · 0 cache write · 17,495 output · 717,808 total
  time: 14m 14s
---

# Request 029 — Name the agent that actually did each step

Date: 2026-11-05
Requested by: the user

## Original request
> the agent information in header of specs files is not correct. for exemple specs/028-tool-log-per-request/50-implementation.md. Now, the agent is always point to light-orchestrator. Make the correct agent that do the task. If a specs file were doing with multi agent, there must be a logic to show which agent were doing which part

## Conversation context
| # | User turn | What it established |
|---|---|---|
| 1 | The message above | The `runs:` header of request artifacts credits `light-orchestrator` even when the step belongs to another agent (example: 028's implementation log). The header must name the agent that did the work, and must show which agent did which part when several contribute. |

### Decisions
- Record the workflow step's agent, not the agent that invoked it — the header is about who produced the content, not who delegated.
- Add a `part:` field to every run entry when more than one agent contributed — one line per contribution, in the order the work happened.
- Enforce both rules in the `artifact-header` hook, not only in prose, so a wrong header is corrected while the artifact is written.

### Constraints and preferences
- Extend the existing `artifact-header` hook; do not add a new config key or hook id.
- Keep generated-client behavior unchanged apart from the new header content.
- No new dependency.

### References
- `specs/028-tool-log-per-request/50-implementation.md` (all five artifacts credit `light-orchestrator`)
- `kit/instructions/core.md` rule 12, `kit/templates/*.md`, `kit/hooks/checks/artifact-header.mjs`
- `kit/workflows/direct.md`, `standard.md`, `full.md` (step owners)

### Still open
None.
