---
step: plan
runs:
  - agent: light-orchestrator
    part: plan
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 3,591 input · 1,210,240 cache read · 0 cache write · 18,390 output · 1,232,221 total
  time: 2m 6s
---

# Plan

- [x] 1. Add `kit/hooks/lib/usage-stats.mjs` — record a call, dedupe by `tool_use_id`, render the Markdown table with a `**All requests**` total row — level: medium — files: `kit/hooks/lib/usage-stats.mjs` — verify: covered by task 3's tests — commit: `feat(hooks): record agent and skill use per request`
- [x] 2. Add `kit/hooks/checks/agent-skill-usage.mjs`, register it in `checks/index.mjs`, add its `warn` default to `lib/config.mjs` — level: medium — files: those three — verify: `node --test tests/agent-skill-usage.test.mjs` — commit: same as task 1
- [x] 3. Add `tests/agent-skill-usage.test.mjs`: counts, total row, dedupe, `(no request)`, non-agent tools, unmanaged project, `off` — level: medium — files: that test — verify: `node --test tests/agent-skill-usage.test.mjs` — commit: `test(hooks): cover agent and skill usage stats`
- [x] 4. Add `Agent|Task|Skill` to the Claude post-tool matcher in `tools/build.mjs` and assert the generated matcher — level: easy — files: `tools/build.mjs`, `tests/agent-skill-usage.test.mjs` — verify: that test file — commit: `feat(hooks): watch agent and skill tool events`
- [x] 5. Document the hook in `kit/hooks/README.md` and `docs/safety-hooks.md` — level: easy — files: those — verify: read-back — commit: `docs(hooks): document agent and skill usage stats`
- [x] 6. Run `npm test`, then review and conclude — level: medium — files: `50-implementation.md`, `60-conclusion.md` — verify: `npm test` — commit: `docs(spec): record request 042`

## Risks
- Client tool names differ by build; the check accepts tool-name aliases and falls back to the input shape (`subagent_type`, `skill`).
- Concurrent hook processes could lose an increment; writes are atomic, and tools run sequentially in practice.

## Test strategy
Node built-in tests with a temporary installed kit, the same harness as `tests/hooks.test.mjs`; one integration test per acceptance criterion.

## Parallelisable tasks
None: tasks 1–4 touch the same new module.
