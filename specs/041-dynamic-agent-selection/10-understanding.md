---
step: understand
runs:
  - agent: light-orchestrator
    part: requirements, triage and routing
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 2,627 input · 293,120 cache read · 0 cache write · 4,823 output · 300,570 total
  time: 24s
---

# Understanding

## Restatement
The agents a workflow names per step are a **starting roster**, decided from what is known when the request is triaged. As the request runs, the orchestrator keeps that roster matched to the work: it may add, skip, split, repeat or reorder agent calls and steps when the work's shape changes, with a one-line reason for each change, recorded in the request's artifacts. The workflow's mandatory steps, the review loop and any specialist the risk requires stay.

## Prior requests
- **No earlier request covers a dynamic agent roster.** Folders in `specs/` were judged by name and the closest were read from the end backwards; none implements this, and the current code confirms the roster is fixed by the loaded workflow.
- **Model routing (current `light-model-routing` skill):** already rates each step at the start and re-rates when facts change, but only the model, not the agent. Reused: the pattern of rating when facts change, and the rule that the main session is the one that calls agents.
- **036 (brainstormer agent):** adds a conditional agent call before understanding; its trigger is judged once at the start. Not reused: a decision gate is not a dynamic roster.
- **Review cycle:** already repeats the `fix` step for the configured number of turns. Reused: repetition is a normal orchestration move, not a workflow change.
- **040 (init update):** confirmed the kit regenerates client files from `kit/`; a new skill is picked up automatically by `tools/build.mjs`. This request adds no installer change.

## Assumptions
- "Sub agents" means the light-kit agent roles the orchestrator calls (light-developer, light-reviewer, …), not client-level subagent processes.
- The loaded workflow stays the baseline. Dynamic changes are incremental: add an agent or step, skip work that has nothing to do, split or repeat a step. Escalating the whole workflow stays governed by triage (`direct` → `standard` when a blocker appears).
- Re-evaluation happens at step boundaries and when a fact changes the work, not on every tool call, so the roster does not churn.
- The change log lives in `10-understanding.md` under `## Agent plan`; build-affecting deviations are summarised in `50-implementation.md`; each artifact's `runs:` header records who actually ran.
- Agent choice and model choice stay separate: `light-agent-selection` decides who runs, `light-model-routing` decides the model and level.

## Open questions (with proposed defaults)
- May an agent be skipped, not only added? **Default: yes** for an optional agent whose only contribution no longer applies (for example UX with no user interface), never for a mandatory step or a risk-mandated specialist.
- Where does the method live? **Default: a new `light-agent-selection` skill**, applied by the orchestrator at each step boundary, like its other methods; the orchestrator instructions stay a short pointer.
- Should `status.md` show the current roster? **Default: no new field.** `## Agent plan` is the single source, and `status.md` stays a state file.
- Should the plan-level agent choice be frozen once `40-plan.md` is written? **Default: no.** Tasks can reveal a need for another agent, and the plan task list is already revisited as facts change.

## Requirements
1. A shared instruction states that a workflow's per-step agents are a baseline and that the orchestrator re-evaluates the roster while the request runs.
2. The orchestrator applies it before each step and whenever a fact changes the work, and records each change with a reason in `## Agent plan`.
3. Allowed moves: add an agent to a step, add a step, skip an optional agent, split a step, repeat a finished step, reorder remaining steps.
4. Forbidden moves: bypassing a workflow's mandatory steps (`understand`, a written plan, `implement`, `review`/fix, `conclude`), dropping the reviewer, the tester when behavior changes, or the security-reviewer when the risk requires it, or dropping an agent named by the user or a `confirmed` rule.
5. An added or repeated step gets a `## Routing` line at the moment it is added; a dropped step is marked, never left looking as if it ran.
6. The rule applies to every workflow (`direct`, `standard`, `full`, `bootstrap`, `standardize`).
7. The behaviour is documented for users, and workflow files say the listed agents are the baseline.

## Acceptance criteria
1. `kit/skills/light-agent-selection/SKILL.md` exists, is generated for every client, and states the re-evaluation triggers, allowed and forbidden moves, and the recording rules.
2. `light-orchestrator` applies the skill at step boundaries and on changed facts.
3. Each workflow file says its agent list is a baseline that the orchestrator may adapt.
4. `10-understanding.md` template has an `## Agent plan` section with the baseline-plus-changes shape.
5. `light-model-routing` says agent and model choice are separate and that a step added later is rated then.
6. `docs/usage.md` describes the dynamic roster and where changes are recorded.
7. `npm test` passes, including a test that wires the skill, orchestrator, template, workflows and docs.

## In scope / Out of scope
- In: the new skill, orchestrator and core instructions, workflow baseline note, understanding template, model-routing cross-reference, user docs, tests.
- Out: changing the workflow step lists themselves, installer/build changes, dynamic model-tier changes (already covered), a status field for the roster.

## Triage
Scores: scope 2, ambiguity 1, risk 0, novelty 1, impact 0 (total 4)
Workflow: standard
Why: several kit instruction files change, but the outcome is text with a testable wiring and sensible defaults; no runtime behavior or data is touched.

## Routing
- understand: easy — one message, clear intent.
- discover: easy — affected files are known from the request.
- plan: medium — the guardrails and where each rule lives.
- implement: medium — one new skill plus coordinated instruction, template, docs and test changes.
- review: medium — check that the dynamic rule cannot bypass mandatory steps or risk specialists.
- fix: medium — review findings may touch several instruction files.
- conclude: easy — small, cross-cutting text change.
