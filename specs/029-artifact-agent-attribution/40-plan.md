---
step: plan
runs:
  - agent: light-tech-lead
    part: task list and verification strategy
    model: deepseek-flash
    thinking: unknown
    level: medium
usage:
  tokens: 0 input · 0 cache read · 0 cache write · 0 output · 0 total
  time: 0s
---

# Plan

- [ ] 1. State the attribution rule and add the `part:` field — level: medium — files: `kit/instructions/core.md`, `kit/templates/*.md`, `kit/skills/light-model-routing/SKILL.md`, `kit/agents/light-orchestrator.md`, `docs/usage.md`, `tests/kit.test.mjs` — verify: `node --test tests/kit.test.mjs` — commit: `docs(attribution): name the agent that did each step`
- [ ] 2. Derive the step owner and warned attribution in the header hook — level: medium — files: `kit/hooks/checks/artifact-header.mjs`, `kit/hooks/README.md`, `tests/hooks.test.mjs` — verify: `node --test tests/hooks.test.mjs` — commit: `feat(hooks): check who did each artifact step`

Each task = one verified, coherent commit.

## Risks
- The workflow parse is line-based; a workflow file with a different step syntax silently disables the attribution warning. Keep the syntax documented in the hook and covered by a test.
- A client with no usable subagents legitimately records `light-orchestrator`; the escape (`part:` on that entry) must be documented so the warning is not noise.

## Test strategy
- Template/rule text: `tests/kit.test.mjs` (installed templates and `CLAUDE.md`).
- Hook behavior: `tests/hooks.test.mjs` with the installed `direct` workflow; one test for missing `part:`, one for a wrong step owner and its `part:` escape, one confirming the owner-agent header stays quiet.
- Full suite: `npm test`.

## Parallelisable tasks
None: task 2's tests depend on task 1's template fields.

## Completion
- All requirements have a check.
- No open question blocks start.
