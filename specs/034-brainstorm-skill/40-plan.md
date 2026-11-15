---
step: plan
runs:
  - agent: light-tech-lead
    part: plan
    model: deepseek-flash[1m]
    thinking: unknown
    level: medium
usage:
  tokens: 4,355 input · 479,104 cache read · 0 cache write · 5,507 output · 488,966 total
  time: 35s
---

# Plan

- [x] 1. Add the `light-brainstorm` skill with the framing step, the exploration directions, divergence before convergence, the idea-map output and the no-implementation rule — level: medium — files: `kit/skills/light-brainstorm/SKILL.md` — verify: the file exists, its frontmatter passes kit lint and it names every required direction and idea-map section — commit: `feat(kit): add the light-brainstorm skill`
- [x] 2. Document the command and point to it from `light-request` for vague ideas — level: easy — files: `kit/instructions/core.md`, `README.md`, `docs/usage.md`, `kit/skills/light-request/SKILL.md` — verify: grep each file for `light-brainstorm` — commit: `docs(kit): document the brainstorming skill`
- [ ] 3. Cover the generated skill and its wiring with tests — level: easy — files: `tests/kit.test.mjs` — verify: `node --test tests/kit.test.mjs` — commit: `test(kit): cover the brainstorming skill`

Each task = one verified, coherent commit.

## Risks
- A skill that only lists topics will not produce divergent output; the output contract and the explicit "do not converge early" rules are the mitigation.

## Test strategy
Add one install-based test that reads the generated skill for Claude, checks its key sections, checks that every client build includes it, and checks the command lists and `light-request` pointer. Run the full suite.

## Parallelisable tasks
None; the tests depend on the skill text.
