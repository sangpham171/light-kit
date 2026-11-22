---
step: request
runs:
  - agent: light-orchestrator
    part: request capture
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 62,566 input · 844,416 cache read · 0 cache write · 10,383 output · 917,365 total
  time: 3m 38s
---

# Request 041 — Dynamic agent selection while a request runs

Date: 2026-11-22
Requested by: the user

## Original request
> now, the sub agents are defined by orchestrator agent at the beginning, and never changed after all. i want that orchestrator agent can update the sub agent list to be call based on the current situation of the task. So the sub agent will be dynamic, not just a judgement at the beginning

## References
- `kit/agents/light-orchestrator.md:15` — the workflow's steps are executed as loaded; no rule lets the orchestrator change the agent roster as work unfolds.
- `kit/workflows/direct.md`, `standard.md`, `full.md`, `bootstrap.md`, `standardize.md` — each step names a fixed agent or parallel group.
- `kit/skills/light-model-routing/SKILL.md:24,39` — precedent: model levels are rated at the start and re-rated when facts change; agent choice is not.
- `kit/instructions/core.md:38` — the roles paragraph lists the agents and says the orchestrator runs the workflow.
- `kit/templates/10-understanding.md:31` — `## Routing` records per-step levels, not the agents each step will use.
- `tools/build.mjs:76` — workflow lint validates every agent named after `agent:`/`agents:`.
- `tests/models.test.mjs:43`, `tests/kit.test.mjs:310` — existing expectations for routing and workflow wiring.
- `docs/usage.md:21,66` — describes the workflow table and the agent list as they work today.
