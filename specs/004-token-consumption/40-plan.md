---
runs:
  - step: plan | agent: light-orchestrator | model: deepseek-flash[1m] | thinking: unknown | level: easy
---

# Plan

- [ ] 1. Usage reader and `token-usage` hook — level: medium — files: `kit/hooks/lib/usage.mjs`, `kit/hooks/checks/token-usage.mjs`, `kit/hooks/checks/index.mjs`, `kit/hooks/lib/config.mjs`, `kit/hooks/hooks.config.json`, `tests/usage.test.mjs`, `tests/hooks.test.mjs` — verify: `node --test tests/usage.test.mjs tests/hooks.test.mjs` — commit: `feat(hooks): report per-step token usage`
- [ ] 2. Template sections and the global rule — level: easy — files: `kit/templates/00-request.md`, `10-understanding.md`, `20-discovery.md`, `30-design.md`, `40-plan.md`, `50-implementation.md`, `60-conclusion.md`, `kit/instructions/core.md`, `tests/kit.test.mjs` — verify: `node --test tests/kit.test.mjs` — commit: `docs(templates): record token usage per step and per request`
- [ ] 3. Hook and usage documentation — level: easy — files: `kit/hooks/README.md`, `docs/usage.md`, `docs/safety-hooks.md`, `kit/skills/light-hooks-config/SKILL.md` — verify: `npm test` — commit: `docs: describe token-usage reporting`

Each task = one verified, coherent commit.

## Risks
- Double counting on repeated writes: the hook advances the session baseline on every write, so each token is counted once.
- Missing session id in a payload: fall back to the transcript path as the session key.
- State file growth: one entry per session and per request step; old sessions are kept as small objects.

## Test strategy
- Unit: transcript summation, malformed/missing input, cache tokens included.
- Integration: install into a temp project, write a spec artifact, run `post-tool` with a transcript; assert the message, the state totals, silence after the section is filled, and silence for other clients.
- Templates: assert `## Token usage` in all seven artifacts and the total row in the conclusion.

## Parallelisable tasks
None; each task builds on the previous commit.
