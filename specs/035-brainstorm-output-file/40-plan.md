---
step: plan
runs:
  - agent: light-tech-lead
    part: plan
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 1,521 input · 513,024 cache read · 0 cache write · 1,990 output · 516,535 total
  time: 18s
---

# Plan

- [x] 1. Add the brainstorm file template and make the skill write to `brainstorms/<date>-<slug>.md`, with the request reference instead of an appended section — level: easy — files: `kit/templates/brainstorm.md`, `kit/skills/light-brainstorm/SKILL.md`, `kit/skills/light-request/SKILL.md` — verify: grep the skill and template for `brainstorms/`, and confirm the old `## Brainstorm` instruction is gone — commit: `feat(kit): write brainstorms to brainstorms/`
- [x] 2. Explain `brainstorms/` in the core project knowledge and update the user docs — level: easy — files: `kit/instructions/core.md`, `README.md`, `docs/usage.md` — verify: grep each file for `brainstorms/` — commit: `docs(kit): document the brainstorms folder`
- [ ] 3. Update the tests for the file output, the installed template and the absence of the old section — level: easy — files: `tests/kit.test.mjs` — verify: `node --test tests/kit.test.mjs` — commit: `test(kit): cover the brainstorm output file`

Each task = one verified, coherent commit.

## Risks
- The old `## Brainstorm` rule survives in one place; the test pins its absence across the generated skill, `light-request` and the docs.

## Test strategy
Extend the install-based test: read the generated skill, assert the `brainstorms/` path and the file mandate, assert `.light-kit/templates/brainstorm.md` exists with the expected sections, and assert the old section is gone. Run the full suite.

## Parallelisable tasks
None; the tests depend on the final wording.
