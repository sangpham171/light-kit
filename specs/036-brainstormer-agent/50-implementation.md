---
step: implement
runs:
  - agent: light-developer
    part: implement tasks 1–4
    model: deepseek-flash[1m]
    thinking: unknown
    level: medium
  - agent: light-developer
    part: review round 1 fixes
    model: deepseek-flash[1m]
    thinking: unknown
    level: medium
usage:
  tokens: 15,796 input · 2,164,352 cache read · 0 cache write · 17,969 output · 2,198,117 total
  time: 9m 29s
---

# Implementation

## What changed
- `kit/agents/light-brainstormer.md` — new role; applies `light-brainstorm`, covers every use case, writes `brainstorms/<date>-<slug>.md`, returns cases/options/decisions; reads and writes only, never edits code, plans or commits.
- `kit/agents/light-orchestrator.md` — after `00-request.md`, decides whether the request is vague, novel or high-impact and invokes `light-brainstormer` before `10-understanding.md` and triage; adds the map path under `### References`, carries the findings into the understanding, and records the call as `brainstorm` in the routing section.
- `kit/skills/light-request/SKILL.md` — invokes the agent before understanding and triage, not only the skill.
- `kit/skills/light-triage/SKILL.md` — Ambiguity, Novelty or Impact 2 without a map triggers the agent before the workflow is fixed, and its cases go into `10-understanding.md`.
- `kit/skills/light-brainstorm/SKILL.md` — description narrowed to the user-initiated brainstorm and its use as the agent's method; it no longer competes for the request-level trigger.
- `kit/skills/light-model-routing/SKILL.md`, `docs/model-routing.md` — the pre-triage brainstormer call is rated like the understand step.
- `kit/instructions/core.md`, `docs/usage.md` — role list and behaviour documented.
- `README.md` — command table names the agent as the writer.
- `tests/kit.test.mjs` — focused test for the agent body, the full gate clauses and ordering, the role lists, the model rule and the docs.

## Decisions and deviations
- Created `feat/036-brainstormer-agent` from `feat/035-brainstorm-output-file` instead of keeping the 035 branch, so the branch name follows `<type>/<NNN-slug>`; base recorded in `status.md`.
- Did not run the brainstormer on this request itself: its ambiguity is 1 (clear outcome, internal change), below the gate. Recorded here instead of `00-request.md`.
- The gate lives in the orchestrator, not in a workflow step: triage has not chosen a workflow when the request must be widened yet.
- The reference line in `00-request.md` is written by the orchestrator, so the agent's declared output is exactly the map; this also keeps the agent's tools to read and write.
- Review round 1: aligned the triage fallback with the orchestrator's trigger (Ambiguity, Novelty or Impact 2), narrowed the skill description, declared the model rule, strengthened the test to assert the gates and ordering, and removed the agent's duplicated rules.

## Verification
- Kit lint: `[]`.
- Generated files for all four clients contain the agent and the wiring.
- `npm test`: 177 tests pass.
- Tester: generation for four clients, negative mutations, idempotent re-install — all pass.

## Technical debt
- None outstanding. `docs/usage.md` and `README.md` restate the trigger in user-facing prose; that repetition is documentation, not a second rule.
- Deferred: the brainstorm map has no `runs:` header, so its model and level are only recorded in the request's routing and implementation entries. The skill's file format predates the header rule and is out of scope here.
