---
step: plan
runs:
  - agent: light-tech-lead
    part: implementation plan
    model: deepseek-flash[1m]
    thinking: unknown
    level: medium
usage:
  tokens: 0 input · 0 cache read · 0 cache write · 0 output · 0 total
  time: 0s
---

# Plan

- [x] 1. Add the `light-agent-selection` skill — level: medium — files: `kit/skills/light-agent-selection/SKILL.md` — verify: `node --test tests/kit.test.mjs` (kit lints clean, the skill loads) and every required heading/rule grep matches — commit: `feat(kit): add the agent selection skill`
- [x] 2. Make the orchestrator apply it, and state the baseline rule globally — level: medium — files: `kit/agents/light-orchestrator.md`, `kit/instructions/core.md` — verify: `node --test tests/kit.test.mjs` and grep `light-agent-selection` in both generated files — commit: `feat(kit): let the orchestrator adapt the agent roster`
- [x] 3. Mark workflow agent lists as the baseline and add `## Agent plan` to the understanding template — level: easy — files: `kit/workflows/{direct,standard,full,bootstrap,standardize}.md`, `kit/templates/10-understanding.md` — verify: `node --test tests/kit.test.mjs`; each workflow carries the baseline sentence and lint still finds every named agent — commit: `docs(kit): mark workflow agents as a baseline`
- [x] 4. Separate agent choice from model choice in the routing skill and document the dynamic roster — level: easy — files: `kit/skills/light-model-routing/SKILL.md`, `docs/usage.md` — verify: `npm test`; grep `light-agent-selection` in the installed routing skill and the usage doc — commit: `docs(kit): document dynamic agent selection`
- [x] 5. Cover the wiring with a test — level: medium — files: `tests/kit.test.mjs` — verify: `node --test tests/kit.test.mjs` then `npm test` — commit: `test(kit): cover dynamic agent selection`

Each task = one verified, coherent commit.

## Risks
- Workflow prose must not write `agent:`/`agents:` followed by a non-agent word, or `lint` rejects it; write "the agents named in each step" instead.
- The never-skip list must stay simple enough to follow under pressure; keep it to the mandatory steps, reviewer, tester on behavior change, and the security-reviewer on the risk triggers.
- Two skills now touch work planning (selection and routing); each must state the split explicitly to avoid double-rating.

## Test strategy
- Existing kit lint (`npm test`) protects agent names in workflows.
- One new test in `tests/kit.test.mjs` installs into a temp dir and asserts the skill, its orchestrator/core wiring, the template section, every workflow's baseline sentence, the routing cross-reference and the usage doc.
- Run the focused test file first, then the full suite.

## Parallelisable tasks
- Tasks 1 and 3 touch disjoint files and could run together; tasks 2 and 4 both point at the skill from other files and follow 1; task 5 follows all text changes.
