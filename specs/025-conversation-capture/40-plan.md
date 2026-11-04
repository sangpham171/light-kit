---
step: plan
runs:
  - agent: light-tech-lead
    model: deepseek-flash[1m]
    thinking: unknown
    level: medium
usage:
  tokens: unknown input · unknown cache read · unknown cache write · unknown output · unknown total
  time: unknown
---

# Plan

- [x] 1. Capture the conversation — core rule, audit purpose, `00-request.md` template, new `light-conversation-capture` skill, orchestrator/request references — level: medium — files: `kit/instructions/core.md`, `kit/audit/rules.json`, `kit/templates/00-request.md`, `kit/skills/light-conversation-capture/SKILL.md`, `kit/skills/light-request/SKILL.md`, `kit/agents/light-orchestrator.md`, `tests/kit.test.mjs` — verify: `npm test` — commit: `feat(kit): capture the conversation in the request`
- [x] 2. Always write the plan — `direct` workflow plan step, implement/plan skill fallbacks, developer agent — level: medium — files: `kit/workflows/direct.md`, `kit/skills/light-implement/SKILL.md`, `kit/skills/light-plan/SKILL.md`, `kit/agents/light-developer.md`, `kit/templates/40-plan.md`, `tests/kit.test.mjs` — verify: `npm test` — commit: `feat(kit): always write the plan before implementing`
- [ ] 3. Automatic nudge — `capture-discussion` prompt hook, `planned` flag in the specs reader, default mode, hooks README — level: hard — files: `kit/hooks/checks/capture-discussion.mjs`, `kit/hooks/checks/index.mjs`, `kit/hooks/lib/config.mjs`, `kit/hooks/hooks.config.json`, `kit/hooks/lib/specs.mjs`, `kit/hooks/README.md`, `tests/hooks.test.mjs`, `tests/kit.test.mjs` — verify: `node --test tests/hooks.test.mjs tests/kit.test.mjs` — commit: `feat(hooks): warn when implementing without a written plan`
- [ ] 4. Document — usage and safety-hooks docs — level: easy — files: `docs/usage.md`, `docs/safety-hooks.md` — verify: `npm test` — commit: `docs: document conversation capture and the plan rule`

Each task = one verified, coherent commit.

## Risks
- The prompt matcher may fire on unrelated text; keep it to explicit implement intent and never block.
- Clients' prompt payload key differs; `normalize` already reads `prompt`/`initialPrompt`, so no per-client code is needed.

## Test strategy
- Kit test: rule, template section, skill, direct workflow plan step and config seed.
- Hook test: no request → warn; request without plan → warn; plan present → silent; unrelated prompt → silent.

## Parallelisable tasks
1 and 2 are independent; 3 depends on the `planned` flag only; 4 depends on 1–3.
