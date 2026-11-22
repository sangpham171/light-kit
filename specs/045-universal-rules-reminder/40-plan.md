---
step: plan
runs:
  - agent: light-orchestrator
    part: plan
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 268 input · 188,288 cache read · 0 cache write · 1,841 output · 190,397 total
  time: 8s
---

# Plan

- [x] 1. Update R-003: Count 2, the repeated language-specific failure and the language-neutral lesson — level: easy — files: `.light-kit/rules.md` — verify: read-back — commit: `docs(rules): record the repeated language-specific failure`
- [x] 2. Rewrite `kit/hooks/checks/rules-reminder.mjs` as a session-start, no-pattern reminder — level: easy — files: that one — verify: `node --test tests/hooks.test.mjs` — commit: `refactor(hooks): make the rules reminder language-neutral`
- [x] 3. Remove `extraDefectPatterns` from `kit/hooks/lib/config.mjs`, `kit/hooks/hooks.config.json`, `kit/templates/project-hooks.config.json` and `kit/skills/light-hooks-config/SKILL.md` — level: easy — files: those four — verify: `node --test tests/kit.test.mjs` — commit: same as task 2
- [x] 4. Update `tests/hooks.test.mjs` and `tests/kit.test.mjs`: session-start fires, prompt does not, no rules file silent, `off` silent, no `extraDefectPatterns` — level: medium — files: those two — verify: `node --test tests/hooks.test.mjs tests/kit.test.mjs` — commit: `test(hooks): cover the session-start rules reminder`
- [x] 5. Update `kit/hooks/README.md` and `docs/safety-hooks.md` to the session-start, language-neutral behaviour — level: easy — files: those two — verify: read-back; `tests/kit.test.mjs` — commit: `docs(hooks): describe the universal rules reminder`
- [ ] 6. Run `npm test`, then review and conclude — level: medium — files: `50-implementation.md`, `60-conclusion.md` — verify: `npm test` — commit: `docs(spec): record request 045`

## Risks
- A session-start reminder may be less timely than a prompt-time one; the workflow `rules` step is the guarantee.
- Removing a config key an existing project already set leaves an ignored key; harmless and documented.
- A stale README or test can keep the old prompt behaviour; the test asserts a prompt emits nothing.

## Test strategy
The installed-kit harness: one session-start event per acceptance case, one prompt event to prove silence.

## Parallelisable tasks
None: tasks 2 and 3 share the same hook/config removal.
