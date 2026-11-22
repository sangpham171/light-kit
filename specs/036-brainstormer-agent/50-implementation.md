---
step: implement
runs:
  - agent: light-developer
    part: implement tasks 1–4
    model: deepseek-flash[1m]
    thinking: unknown
    level: medium
usage:
  tokens: 5,276 input · 1,089,664 cache read · 0 cache write · 7,822 output · 1,102,762 total
  time: 1m 41s
---

# Implementation

## What changed
- `kit/agents/light-brainstormer.md` — new role; applies `light-brainstorm`, covers every use case, writes `brainstorms/<date>-<slug>.md`, returns cases/options/decisions; never edits code, plans or commits.
- `kit/agents/light-orchestrator.md` — after `00-request.md`, decides whether the request is vague, novel or high-impact and invokes `light-brainstormer` before understanding and triage; carries its findings into `10-understanding.md`.
- `kit/skills/light-request/SKILL.md` — invokes the agent, not only the skill.
- `kit/skills/light-triage/SKILL.md` — Ambiguity 2 without a map triggers the agent before the workflow is fixed.
- `kit/instructions/core.md`, `docs/usage.md` — role list and behaviour documented.
- `README.md` — command table names the agent.
- `tests/kit.test.mjs` — focused test for the agent body, wiring, role list and docs.

## Decisions and deviations
- Created `feat/036-brainstormer-agent` from `feat/035-brainstorm-output-file` instead of keeping the 035 branch, so the branch name follows `<type>/<NNN-slug>`; base recorded in `status.md`.
- Did not run the brainstormer on this request itself: its ambiguity is 1 (clear outcome, internal change), below the gate. Recorded here instead of `00-request.md`.
- The gate lives in the orchestrator, not in a workflow step: triage has not chosen a workflow when the request must be widened yet.
- The trigger is stated once in the orchestrator, once in `light-request` and once in triage; no further duplication.

## Verification
- Kit lint: `[]`.
- Generated files for all four clients contain the agent and the wiring.
- `npm test`: 177 tests pass.

## Technical debt
- None introduced. The existing `light-brainstorm` skill still describes itself as client-invoked; it now also serves as the agent's method, which the agent states explicitly.
