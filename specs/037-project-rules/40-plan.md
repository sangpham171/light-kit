---
step: plan
runs:
  - agent: light-tech-lead
    part: implementation plan
    model: deepseek-flash[1m]
    thinking: unknown
    level: medium
usage:
  tokens: 198 input · 76,672 cache read · 0 cache write · 1,827 output · 78,697 total
  time: 9s
---

# Plan

- [x] 1. Add `kit/templates/rules.md` — the two states, the rule table with `Count`, and the before/after procedure — level: easy — files: `kit/templates/rules.md` — verify: file exists and contains `pending`, `confirmed`, `Count`, `R-NNN` — commit: `feat(kit): add the project rules template`
- [x] 2. Add `kit/skills/light-rules/SKILL.md` with `purpose: compensation`, the before/after procedure and the promotion table — level: easy — files: `kit/skills/light-rules/SKILL.md` — verify: `node -e "import('./tools/build.mjs').then(m=>console.log(m.lint(m.loadKit())))"` prints `[]` — commit: `feat(kit): add the light-rules skill`
- [x] 3. Wire the always-loaded layer: core rule 15, the project knowledge bullet, the `Kit files` project-rules pointer in `tools/build.mjs`, and the audit purpose — level: medium — files: `kit/instructions/core.md`, `tools/build.mjs`, `kit/audit/rules.json`, `tests/audit.test.mjs` — verify: `npm test` (audit tests expect 15 rules) — commit: `feat(kit): load the project rules before every task`
- [x] 4. Wire the workflow layer: `light-init` seeds `rules.md`, `light-implement` applies the skill per task, the orchestrator applies it before and after a request, and the review checklist reports violations — level: medium — files: `kit/skills/light-init/SKILL.md`, `kit/skills/light-implement/SKILL.md`, `kit/agents/light-orchestrator.md`, `kit/skills/light-review-checklist/SKILL.md` — verify: `npm test` — commit: `feat(kit): seed and enforce the project rules`
- [x] 5. Add a test that installs into a temp dir and asserts the template, the skill, the init seeding and the enforcement wiring — level: easy — files: `tests/kit.test.mjs` — verify: `node --test tests/kit.test.mjs` — commit: `test(kit): cover the project rules workflow`
- [x] 6. Seed this project's own `.light-kit/rules.md`, add a short user-docs section and refresh the codebase map — level: easy — files: `.light-kit/rules.md`, `docs/usage.md`, `docs/installation.md`, `.light-kit/codebase-map.md` — verify: `npm test` — commit: `docs(kit): document the project rules`
- [x] 7. Review and fix: run the reviewer and tester checks, record findings, fix blockers and should-fix items — level: medium — files: `50-implementation.md` — verify: `npm test` — commit: `fix(kit): address the review for the project rules`

Each task = one verified, coherent commit.

## Risks
- The audit test's hardcoded rule count must move to 15 in both assertions.
- The template is a seed: the install must never overwrite an existing `.light-kit/rules.md`.
- Core rule 15 must stay short; the procedure belongs to the skill.

## Test strategy
- `npm test` after each task; focused `node --test tests/audit.test.mjs` and `tests/kit.test.mjs` while iterating.
- The new test installs into a temp dir, then checks the generated template, skill, init text, orchestrator, implement and review checklist.
- Manual check that `npm run install-kit -- <tmp> --dry-run` lists `rules.md`.

## Parallelisable tasks
- Tasks 1 and 2 are independent; tasks 3 and 4 touch different files but both rely on the audit for verification. Run them in order to keep each commit verified.
