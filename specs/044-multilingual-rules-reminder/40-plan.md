---
step: plan
runs:
  - agent: light-orchestrator
    part: plan
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 230 input · 152,192 cache read · 0 cache write · 866 output · 153,288 total
  time: 4s
---

# Plan

- [x] 1. Add `R-003` to `.light-kit/rules.md`: no English-only heuristic for user input without a configurable list — level: easy — files: `.light-kit/rules.md` — verify: read-back — commit: `docs(rules): record the language gap in the rules reminder`
- [x] 2. Add `extraDefectPatterns` to `kit/hooks/lib/config.mjs`, `kit/hooks/hooks.config.json` and `kit/templates/project-hooks.config.json` — level: easy — files: those three — verify: `node --test tests/hooks.test.mjs` — commit: `feat(hooks): let a project add defect patterns in any language`
- [x] 3. Add the built-in Vietnamese patterns and merge the configured patterns in `kit/hooks/checks/rules-reminder.mjs` — level: easy — files: that one — verify: `node --test tests/hooks.test.mjs` — commit: same as task 2
- [x] 4. Add hook tests: Vietnamese built-in, Vietnamese feature prompt silent, Spanish via config, invalid regex — level: medium — files: `tests/hooks.test.mjs` — verify: `node --test tests/hooks.test.mjs` — commit: `test(hooks): cover multilingual defect patterns`
- [x] 5. Document the language limit and the config key in `kit/hooks/README.md` and `docs/safety-hooks.md` — level: easy — files: those two — verify: read-back; `node --test tests/kit.test.mjs` — commit: `docs(hooks): document multilingual defect patterns`
- [ ] 6. Run `npm test`, then review and conclude — level: medium — files: `50-implementation.md`, `60-conclusion.md` — verify: `npm test` — commit: `docs(spec): record request 044`

## Risks
- Vietnamese words are short and can appear in feature requests; the hook is advisory and the test keeps one common feature prompt silent.
- A user regex could be invalid; `regexes` already drops it.

## Test strategy
The installed-kit harness in `tests/hooks.test.mjs`: one prompt per language, one silent feature prompt, one invalid pattern.

## Parallelisable tasks
Tasks 2 and 3 touch the same hook path; task 4 depends on both.
