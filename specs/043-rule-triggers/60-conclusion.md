---
step: conclude
runs:
  - agent: light-orchestrator
    part: conclusion
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  - step: 00-request
    tokens: 66,852 input · 1,678,080 cache read · 0 cache write · 20,366 output · 1,765,298 total
    time: 4m 47s
  - step: 10-understanding
    tokens: 230 input · 84,736 cache read · 0 cache write · 1,229 output · 86,195 total
    time: 7s
  - step: 40-plan
    tokens: 340 input · 172,672 cache read · 0 cache write · 1,128 output · 174,140 total
    time: 7s
  - step: 50-implementation
    tokens: 20,763 input · 4,122,624 cache read · 0 cache write · 28,381 output · 4,171,768 total
    time: 8m 51s
  - step: 60-conclusion
    tokens: 1,023 input · 536,064 cache read · 0 cache write · 3,773 output · 540,860 total
    time: 23s
  - step: total
    tokens: 89,208 input · 6,594,176 cache read · 0 cache write · 54,877 output · 6,738,261 total
    time: 14m 16s
---

# Conclusion

## Summary
Rules are recorded whenever a failure appears, not only when a reviewer finds something. The triggers are named in `light-rules`, the rules template and the core instructions: a user-reported bug or regression, "still not working", a failed test/build/lint/manual check, a review, tester or security finding, a user correction, a defect found while implementing, and a request caused by earlier work. Every workflow now runs a `rules` step before `conclude`, and a new `rules-reminder` prompt hook catches the conversational case — a user saying something is broken — when no other checkpoint would fire.

## What changed
Range: `832be2a5360c84f132cc1e7b52ca9e3f60ced6a9..HEAD` on `feat/043-rule-triggers`
- `kit/skills/light-rules/SKILL.md`, `kit/templates/rules.md` — a `When rules change` / `When to update` trigger list; the after-task procedure now runs immediately after any trigger.
- `kit/instructions/core.md` — rule 15 and the project-knowledge entry name the non-review triggers.
- `kit/agents/light-orchestrator.md`, `kit/skills/light-request/SKILL.md`, `kit/skills/light-implement/SKILL.md`, `kit/agents/light-tester.md`, `kit/skills/light-review-checklist/SKILL.md` — the same triggers at request intake, per task, in verification and in review.
- `kit/workflows/{direct,standard,full,bootstrap,standardize}.md` — a `rules` step before `conclude`.
- `kit/skills/light-agent-selection/SKILL.md`, `docs/usage.md` — `rules` is a mandatory step and the flow table lists it.
- `kit/hooks/checks/rules-reminder.mjs` (new), `kit/hooks/checks/index.mjs`, `kit/hooks/lib/config.mjs`, `kit/hooks/hooks.config.json` — a prompt-time `warn` hook for defect reports; silent without `.light-kit/rules.md`, `off` disables it.
- `kit/hooks/README.md`, `docs/safety-hooks.md` — the hook and its scope.
- `tests/hooks.test.mjs`, `tests/kit.test.mjs` — hook behaviour, workflow steps and wording coverage.
- `.light-kit/rules.md` — this project's rules file now carries the new trigger section.
- `specs/043-rule-triggers/` — request, understanding, plan, implementation log and this conclusion.

## Verification evidence
- `npm test` — 207 tests, 207 pass, 0 fail (includes kit lint).
- `node --test tests/hooks.test.mjs tests/kit.test.mjs` — 101 pass.
- Review round 1 (independent reviewer): changes requested; 4 should-fix and 4 nits, all fixed in `d71552e`, `09885dc`, `2a28ad7` and `4f7efc7`; no finding remains open.

## Deferred technical debt and open findings
- Accepted: the `rules` checkpoint is instruction-only. `light-agent-selection` now names it as mandatory, but nothing enforces it at runtime (the same accepted pattern as 041 TD-4).
- Accepted: the prompt heuristic can fire on a feature request that mentions a failure; the message is advisory and tells the agent to judge whether earlier work is actually broken.
- Earlier open debt: 037's tool-call-time rules reminder is **still open** (this request adds a prompt-time reminder instead); 040's carried 039 TD-1 (init merge does not refresh prose inside an existing rules section) is **still open**; 042 TD-1/TD-2, 041 TD-1 to TD-4 and the older 036/038/039 items are **still open**, unchanged.
- No review finding remains open.

## Follow-ups
- Reinstall the kit in existing projects (`npm run install-kit -- <dir>`) to get the new skill, instructions, workflow steps and hook.
- Run `light-init` on an existing project to merge the new `## When to update` section into its `.light-kit/rules.md`; the file itself is never overwritten.
- 037's tool-call-time reminder remains a possible separate request.
