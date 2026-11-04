---
step: request
runs:
  - agent: light-orchestrator
    model: deepseek-flash[1m]
    thinking: unknown
    level: medium
usage:
  tokens: 59,072 input · 734,592 cache read · 0 cache write · 18,368 output · 812,032 total
  time: 21m 31s
---

# Request 025 — Keep the conversation, the plan and the implementation

Date: 2026-11-04
Requested by: light

## Original request
update kit so that when user is plan mode or in interactive discussion with llm, then user ask to implement. For the actual kit, in 00-request.md, there is only the last request, all the conversation before is not store. Also in this case, the plan and implementation is not stored. I want to store a maximum information in specs files

## Conversation context
| # | User turn | What it established |
|---|---|---|
| 1 | (the original request above; no earlier turn in this session) | A request that grows out of a plan-mode session or a discussion loses its history: only the final "implement" message reaches `00-request.md`, and the plan and the implementation log are skipped. Wanted: keep the maximum information in `specs/`. |

### Decisions
- Keep the exchange in `00-request.md`, not a new artifact — the user pointed at `00-request.md`, and no new artifact name enters the workflow.
- Make `40-plan.md` mandatory in every workflow, including `direct` — the reported gap is a missing plan.

### Constraints and preferences
- Maximum information: the user's turns, not a summary of the last message.
- No new dependency; keep the generated-client behavior.

### References
- `kit/instructions/core.md`, `kit/templates/00-request.md`, `kit/skills/light-request`, `kit/skills/light-implement`, `kit/workflows/direct.md`, `kit/hooks/checks/`.
