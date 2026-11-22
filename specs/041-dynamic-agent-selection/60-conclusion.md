---
step: conclude
runs:
  - agent: light-tech-writer
    part: conclusion
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  - step: 00-request
    tokens: 62,566 input · 844,416 cache read · 0 cache write · 10,383 output · 917,365 total
    time: 3m 38s
  - step: 10-understanding
    tokens: 2,627 input · 293,120 cache read · 0 cache write · 4,823 output · 300,570 total
    time: 24s
  - step: 20-discovery
    tokens: 258 input · 78,592 cache read · 0 cache write · 1,232 output · 80,082 total
    time: 6s
  - step: 40-plan
    tokens: 0 input · 0 cache read · 0 cache write · 0 output · 0 total
    time: 0s
  - step: 50-implementation
    tokens: 15,137 input · 4,155,136 cache read · 0 cache write · 29,093 output · 4,199,366 total
    time: 6m 50s
  - step: 60-conclusion
    tokens: 3,318 input · 850,176 cache read · 0 cache write · 2,492 output · 855,986 total
    time: 24s
  - step: total
    tokens: 83,906 input · 6,221,440 cache read · 0 cache write · 48,023 output · 6,353,369 total
    time: 11m 24s
---

# Conclusion

## Summary
The agents and steps a workflow names are now a baseline, not a fixed roster. Before each step and whenever the work changes shape, the orchestrator applies the new `light-agent-selection` skill: it may add, skip, split, repeat or reorder agents and steps, must keep each workflow's required steps and the specialists the risk requires, and records every change with its reason in `## Agent plan` in `10-understanding.md`. Model choice stays separate and is still rated per step.

## What changed
Range: `1f50a5cc84682a15848bc2ff2ea6d82ee40e8ce2..HEAD` on `feat/041-dynamic-agent-selection`
- `kit/skills/light-agent-selection/SKILL.md` (new) — re-evaluation triggers, six allowed moves, the never-change list, and where each change is recorded.
- `kit/agents/light-orchestrator.md`, `kit/instructions/core.md` — the orchestrator applies the skill before each step and on changed facts; the global roles paragraph states the baseline rule.
- `kit/workflows/{direct,standard,full,bootstrap,standardize}.md` — each says its agents and steps are the baseline (`standardize` within its own rules).
- `kit/templates/10-understanding.md` — new `## Agent plan` section with the baseline and change-line shape.
- `kit/skills/light-model-routing/SKILL.md`, `docs/usage.md`, `docs/model-routing.md` — who runs and on which model are separate; a step added mid-request is rated when it is added.
- `tests/kit.test.mjs` — covers the skill, its generation for every client, the orchestrator and core wiring, the template, all workflows, the routing cross-reference and the docs.
- `specs/041-dynamic-agent-selection/` — request, understanding, discovery, plan, implementation log and this conclusion.

## Verification evidence
- `node --test tests/kit.test.mjs` — 25 pass.
- `node --test tests/models.test.mjs` — 5 pass.
- `npm test` — 195 pass, 0 fail.
- Kit lint — no errors; the workflow baseline prose does not introduce a fake agent name.
- Review round 1 (independent reviewer): 7 findings, all fixed in `9b35c35`, `47367e1` and `8b79890`; no blocker or should-fix remains open.

## Deferred technical debt and open findings
- TD-1: `## Agent plan` and `## Routing` must be kept in step by the orchestrator; no runtime check. Accepted — instructions, not executable state.
- TD-2: the baseline sentence is repeated in five workflow files. Accepted — each workflow is read standalone.
- TD-3: an existing install sees `## Agent plan` only after the kit is reinstalled. Accepted — the installer refreshes template copies, as for any template change.
- TD-4: the never-change and recording rules are enforced by instruction text; the test covers wiring and key clauses, not behaviour. Accepted for instruction content.
- Earlier open debt is unchanged: 036's brainstorm-map header, 039's literal-3 prose for existing rules files (TD-1) and the missing threshold validation in hooks, and 040's accepted merge/format items.
- No review finding remains open.

## Follow-ups
- None required. Reinstalling the kit refreshes the new skill, the workflow text and the understanding template in existing projects.
