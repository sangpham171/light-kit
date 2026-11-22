---
step: plan
runs:
  - agent: light-orchestrator
    part: plan
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 340 input · 172,672 cache read · 0 cache write · 1,128 output · 174,140 total
  time: 7s
---

# Plan

- [ ] 1. Add the trigger list to `kit/skills/light-rules/SKILL.md` and `kit/templates/rules.md`, and update core rule 15 in `kit/instructions/core.md` — level: easy — files: those three — verify: `node --test tests/kit.test.mjs` — commit: `docs(kit): record rules at every failure trigger`
- [ ] 2. Wire the same triggers into `kit/agents/light-orchestrator.md`, `kit/skills/light-request/SKILL.md`, `kit/skills/light-implement/SKILL.md`, `kit/agents/light-tester.md` and `kit/skills/light-review-checklist/SKILL.md` — level: easy — files: those five — verify: `node --test tests/kit.test.mjs` — commit: `docs(kit): wire rule triggers into request and implementation`
- [ ] 3. Add a `rules` step before `conclude` in `kit/workflows/{direct,standard,full}.md` and update the flow table in `docs/usage.md` — level: easy — files: those four — verify: `node --test tests/kit.test.mjs` — commit: `docs(workflows): record rules before every conclusion`
- [ ] 4. Add `kit/hooks/checks/rules-reminder.mjs`, register it in `checks/index.mjs`, add its `warn` default in `lib/config.mjs` and `kit/hooks/hooks.config.json` — level: medium — files: those four — verify: `node --test tests/hooks.test.mjs` — commit: `feat(hooks): remind the agent when a user reports a defect`
- [ ] 5. Add hook tests and extend the rules test in `tests/hooks.test.mjs` and `tests/kit.test.mjs` — level: medium — files: those two — verify: `node --test tests/hooks.test.mjs tests/kit.test.mjs` — commit: `test(hooks): cover the rules reminder`
- [ ] 6. Document the hook in `kit/hooks/README.md` and `docs/safety-hooks.md` — level: easy — files: those two — verify: read-back — commit: `docs(hooks): document the rules reminder`
- [ ] 7. Run `npm test`, then review and conclude — level: medium — files: `50-implementation.md`, `60-conclusion.md` — verify: `npm test` — commit: `docs(spec): record request 043`

## Risks
- The prompt heuristic can fire on a feature request that mentions a failure ("add a retry when the request fails"); it is advisory and names the condition, so the agent judges.
- Wording drift between the skill, template, core and hook; the tests assert the same phrases in each.

## Test strategy
Node built-in tests: the installed-kit harness for the prompt hook and the existing `kit.test.mjs` assertions for wording and workflow steps.

## Parallelisable tasks
None: tasks 1–3 change overlapping instruction files; task 4 must land before its tests.
