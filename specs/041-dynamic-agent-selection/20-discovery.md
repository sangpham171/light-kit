---
step: discover
runs:
  - agent: light-tech-lead
    part: code and convention discovery
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 258 input · 78,592 cache read · 0 cache write · 1,232 output · 80,082 total
  time: 6s
---

# Discovery

## Prior requests
- Scanned `specs/` by folder name; no earlier request implements a dynamic agent roster. The closest behaviour is in `kit/skills/light-model-routing/SKILL.md`, which re-rates model levels when facts change, and the `light-review-cycle` skill, which repeats the `fix` step.
- No earlier decision forbids adding an orchestration skill; `036` added `light-brainstormer` and `034` added the `light-brainstorm` skill using the same wiring.

## Relevant code
- `kit/agents/light-orchestrator.md:15` — step 3: "Load the chosen workflow … execute its steps in order"; the agent set comes from the file, unchanged.
- `kit/agents/light-orchestrator.md:16` — step 4: only `status.md` is updated between steps.
- `kit/agents/light-orchestrator.md:17` — runs header attribution, already able to record extra agents with a `part:`.
- `kit/workflows/direct.md:12`, `standard.md:12`, `full.md:12`, `bootstrap.md:12`, `standardize.md:11` — `steps:` lists fixed agents; `full.md:16` and `full.md:20` are the parallel groups, `bootstrap.md:15`, `bootstrap.md:19` the same.
- `tools/build.mjs:76-79` — lint scans every `agent:`/`agents:` occurrence and rejects unknown names; a new skill under `kit/skills/` needs no build change.
- `tools/build.mjs:61` — `load('skills')` picks up any new folder with `SKILL.md`; `build` emits it for every client.
- `kit/instructions/core.md:38` — the `## Roles` paragraph is the only global statement of how agents are used.
- `kit/templates/10-understanding.md:31-32` — `## Routing` is the only per-request planning section.
- `kit/templates/status.md:1-12` — front matter fields; no roster field.
- `kit/skills/light-model-routing/SKILL.md:24,39,50` — rates all steps at the start, re-rates on changed facts, records actual runs.
- `docs/usage.md:21-32` — workflow table and the artifact list; `docs/usage.md:66-67` — agent list and naming.
- `tests/kit.test.mjs:310-340` — pattern for asserting a skill, its wiring in agents/workflows, and docs.
- `tests/models.test.mjs:43-80` — pattern for asserting routing text in the skill, template and orchestrator.
- `kit/skills/light-review-cycle/SKILL.md` — review turns; a repeated step is already an accepted orchestration move.

## Conventions
- Skills live in `kit/skills/<name>/SKILL.md` with frontmatter `name`, `description`, `purpose`.
- Instructions are terse imperative prose, one rule per bullet; cross-references name skills in backticks.
- Tests install into a temp directory and assert generated text; `npm test` also lints the kit.
- Workflow lint treats any `agent:` or `agents:` token as an agent declaration, so workflow prose must not put a colon after "agent"/"agents" unless it names real agents.

## Constraints
- No new runtime dependency.
- Preserve the shared hook, installer and generated-client behaviour.
- A dynamic roster must not let a request bypass its workflow's mandatory artifacts or the review loop, nor drop a required risk specialist.
- `direct` must stay question-free and lean; the new rule may not turn it into a heavier workflow by itself.

## Reuse candidates
- The rating-on-change pattern from `light-model-routing` (section 3) and its `## Routing` recording.
- The conditional-agent pattern from the brainstormer call in `light-orchestrator.md:13`.
- The `runs:` attribution with `part:` for artifacts produced by several agents.
- The review-cycle repetition instead of inventing a retry mechanism.

## Unknowns / risks
- Naming: `light-agent-selection` could be confused with model routing. Mitigation: its description and first line say it decides **who** runs, routing decides **on which model**.
- Risk of churn: an orchestrator that re-opens the roster at every tool call wastes calls. Mitigation: re-evaluate at step boundaries and on changed facts, and record one line per change.
- Risk of silent shortcuts: a "dynamic" roster could be used to skip review or security on a risky change. Mitigation: an explicit never-skip list and the existing review-cycle escalation.
- Template order: `## Agent plan` must be added without moving existing sections; append after `## Routing` to keep the file's shape stable.
