---
step: understand
runs:
  - agent: light-orchestrator
    part: restatement and triage
    model: deepseek-flash[1m]
    thinking: unknown
    level: medium
usage:
  tokens: 0 input · 0 cache read · 0 cache write · 0 output · 0 total
  time: 3s
---

# Understanding

## Restatement
An uncertain request needs more than the `light-brainstorm` skill being mentioned: the orchestrator must decide that the idea is unclear and hand it to a dedicated brainstorming agent before understanding, triage and planning start. That agent explores every direction — actors, lifecycle, alternatives, failure, scale, second-order effects, precedent — and every case the user did not name, writes the map to `brainstorms/`, and returns the few decisions the orchestrator must carry forward.

## Prior requests
- `034-brainstorm-skill` — added the `light-brainstorm` skill and its divergent method; reused as the brainstormer's method.
- `035-brainstorm-output-file` — made the map a durable file in `brainstorms/`; reused as the agent's only artifact.
- Verified against the current code: the orchestrator and `light-request` still say "apply the skill"; no agent role exists.

## Assumptions
- The trigger is conditional: vague, novel or high-impact requests. Clear, small fixes pay no brainstorm cost.
- `light-brainstorm` remains the single source of the method; the agent does not duplicate it.
- The brainstormer is a peer agent the orchestrator can invoke manually or through `light-request`.

## Open questions (with proposed defaults)
- None blocking. Default: the orchestrator may skip the brainstormer when the request is precise and familiar, and says so in `10-understanding.md`.

## Requirements
1. A `light-brainstormer` agent exists in `kit/agents/`, with a role description and the `light-brainstorm` skill as its method.
2. It covers all use cases, including the ones the user did not mention, and writes only `brainstorms/<YYYY-MM-DD>-<slug>.md`.
3. The orchestrator explicitly decides and invokes it after `00-request.md` and before `10-understanding.md`/triage, and says when it skipped it.
4. `light-request` and `light-triage` name the agent, not only the skill, so every client routes uncertain requests through it.
5. The role is listed in the core instructions, README, usage docs and tests.
6. The agent never edits code, writes plan tasks or commits.

## Acceptance criteria
- `kit/agents/light-brainstormer.md` loads and lints, and is generated for all four clients.
- `light-orchestrator` and `light-request` invoke `light-brainstormer` for vague/novel/high-impact requests; triage triggers it when ambiguity is 2.
- The core role list, README, `docs/usage.md` and `tests/kit.test.mjs` cover the new agent.
- `npm test` passes.

## In scope / Out of scope
- In: the new agent, orchestrator/triage/request wiring, role lists, docs, tests.
- Out: changing the `light-brainstorm` method or the `brainstorms/` file format; running the brainstormer on every request.

## Triage
Scores: scope 2, ambiguity 1, risk 0, novelty 1, impact 1 (total 5)
Workflow: standard
Why: several kit files change together, but the outcome is clear and internal; no data, security or public API risk.

## Routing
- understand: medium — restating an open idea and triage
- discover: easy — the kit structure and the existing skill are already known
- plan: medium — wiring across agents, skills, docs and tests
- implement: medium — new role plus behaviour changes in several files
- verify-and-review: medium — test the generated output of every client
- fix: easy — expected small review findings
- conclude: easy — short summary
