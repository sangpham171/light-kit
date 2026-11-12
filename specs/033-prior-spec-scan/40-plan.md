---
step: plan
runs:
  - agent: light-tech-lead
    part: plan
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 753 input · 135,936 cache read · 0 cache write · 2,238 output · 138,927 total
  time: 10s
---

# Plan

- [ ] 1. Add the prior-request scan to the discovery skill, the orchestrator and the business analyst, and give both templates a `Prior requests` section — level: easy — files: `kit/skills/light-discovery/SKILL.md`, `kit/agents/light-orchestrator.md`, `kit/agents/light-business-analyst.md`, `kit/templates/10-understanding.md`, `kit/templates/20-discovery.md` — verify: grep each file for the `60-conclusion.md` / `Prior requests` guidance — commit: `docs(kit): check earlier requests before understanding and discovery`
- [ ] 2. Cover the guidance in the kit tests — level: easy — files: `tests/kit.test.mjs` — verify: `node --test tests/kit.test.mjs` — commit: `test(kit): cover the prior-request scan`

Each task = one verified, coherent commit.

## Risks
- Wording drift between the skill, agents and templates; the test pins the shared phrases.

## Test strategy
Add one install-based test that reads the generated skill, agents and templates, then run the full suite.

## Parallelisable tasks
None needed.
