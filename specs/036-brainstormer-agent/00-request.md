---
step: request
runs:
  - agent: light-orchestrator
    part: request capture
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 51,664 input · 297,728 cache read · 0 cache write · 6,131 output · 355,523 total
  time: 3m 43s
---

# Request 036 — Brainstormer agent

Date: 2026-11-22
Requested by: the user

## Original request
> when user make a request, but not sure about it. we need brainsorming agent to cover all use cases. so maybe it's must be orchestrate by orchestrator agent

## Conversation context
| # | User turn | What it established |
|---|---|---|
| 1 | "when user make a request, but not sure about it. we need brainsorming agent to cover all use cases. so maybe it's must be orchestrate by orchestrator agent" | A dedicated brainstorming agent, not only the existing skill; it must cover the use cases the user did not name; the orchestrator decides when to run it. |

### Decisions
- Add a **light-brainstormer** agent that applies the existing `light-brainstorm` skill. Reason: the skill is the method, the agent is the role the orchestrator can hand an uncertain request to, with its own context and a written map. Rejected: keeping it a skill only (no distinct agent run or role).
- The **orchestrator** owns the trigger: after `00-request.md`, it runs the brainstormer when the request is vague, novel or high-impact, before `10-understanding.md` and triage. Reason: the user asked for orchestration, and the orchestrator is the only role that sees the request before the workflow is chosen. Rejected: a workflow step (triage has not chosen a workflow yet) and running it on every request (needless cost on clear, small fixes).
- The map stays in `brainstorms/` and is linked from `00-request.md`; the agent never edits code, plans or commits.

### Constraints and preferences
- Cover all use cases: every actor, lifecycle stage, failure mode, alternative and second-order effect, including cases the user did not mention, each ranked by impact × uncertainty with a proposed default.
- The brainstormer reports back to the orchestrator, which carries the findings into understanding, triage and the plan.

### References
- `kit/skills/light-brainstorm/SKILL.md`
- `specs/034-brainstorm-skill/60-conclusion.md`
- `specs/035-brainstorm-output-file/60-conclusion.md`

### Still open
None — trigger, owner and output are decided.
