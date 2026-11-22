---
step: plan
runs:
  - agent: light-tech-lead
    part: implementation plan
    model: deepseek-flash[1m]
    thinking: unknown
    level: medium
usage:
  tokens: 2,047 input · 57,216 cache read · 0 cache write · 2,966 output · 62,229 total
  time: 5s
---

# Plan

- [x] 1. Add the brainstorming agent — level: easy — files: `kit/agents/light-brainstormer.md` — verify: `node -e "import('./tools/build.mjs').then(m=>console.log(m.lint(m.loadKit())))"` prints `[]`, and `npm test` passes — commit: `feat(kit): add the light-brainstormer agent`
- [x] 2. Make the orchestrator own the trigger — level: medium — files: `kit/agents/light-orchestrator.md`, `kit/skills/light-request/SKILL.md`, `kit/skills/light-triage/SKILL.md`, `kit/instructions/core.md` — verify: generated `light-orchestrator`, `light-request` and `light-triage` name `light-brainstormer` before triage; the core role list includes it — commit: `feat(kit): orchestrate brainstorming for uncertain requests`
- [x] 3. Document the role — level: easy — files: `README.md`, `docs/usage.md` — verify: both list `light-brainstormer` and say the orchestrator runs it for vague, novel or high-impact requests — commit: `docs(kit): document the brainstormer agent`
- [x] 4. Cover the wiring with tests — level: medium — files: `tests/kit.test.mjs` — verify: `npm test` passes and the new test fails when the agent or a wiring line is removed — commit: `test(kit): cover the brainstormer agent wiring`

Each task = one verified, coherent commit.

## Risks
- The trigger could become a second, duplicated definition of "uncertain". Keep it one sentence in the orchestrator and one in triage.
- Clients without subagents must still run the brainstormer one step at a time; the agent itself is a normal role, so this is the workflow's concern, not a new mechanism.

## Test strategy
- Kit lint plus the existing per-client generation test cover the new agent file.
- A focused test asserts the agent body, the orchestrator/request/triage wiring and the docs/role-list mentions.

## Parallelisable tasks
None — all tasks touch the same small surface and build on task 1.
