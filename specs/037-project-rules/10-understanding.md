---
step: understand
runs:
  - agent: light-orchestrator
    part: understanding, triage and routing
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 221 input · 75,136 cache read · 0 cache write · 1,326 output · 76,683 total
  time: 8s
---

# Understanding

No brainstorm run: the request is precise, familiar in shape and touches only the kit's own instructions; its missing details are defaulted below and recorded in `00-request.md`.

## Restatement
Add a persistent per-project rules file that stops the same error or bug from repeating. A rule starts `pending` and is advisory; each task in which it is violated adds one to its count; at three violations it becomes `confirmed`, a critical rule that agents must not break. Every agent reads the file before a task and updates it after one.

## Prior requests
Checked by name: `034-brainstorm-skill`, `035-brainstorm-output-file`, `036-brainstormer-agent` (brainstorming), `029-artifact-agent-attribution` (agent naming in artifacts), `025-conversation-capture`. None touches a rules file. Verified against the current code: `kit/instructions/core.md` has 14 rules and no rules-file entry, `kit/audit/rules.json` has no rule 15, `kit/templates/` has no `rules.md`, and `kit/skills/light-rules/` exists but is empty (which currently makes `npm test` fail in `tests/audit.test.mjs`).

## Assumptions
- The file lives at `.light-kit/rules.md` at project level and is seeded by `light-init`, like `project-profile.md`; in a multi-project workspace each project keeps its own.
- Rule ids are never reused; `R-NNN` names them.
- "Any task" means a request, one plan task, or a standalone change the user asked for.
- Evidence is short: request id, file, test or commit.

## Open questions (with proposed defaults)
- None blocking. Defaults are recorded in `00-request.md` (file location, table shape, counting rule, promotion edit, enforcement points).

## Requirements
1. `kit/templates/rules.md` defines the two states, the table with a count, and the before/after procedure.
2. `kit/skills/light-rules/SKILL.md` gives agents the before/after procedure, including promotion at three violations and the ban on deleting, demoting or rewriting a confirmed rule.
3. Core rule 15 tells every client to read the file before a task and update it after, and the project knowledge section points at it.
4. `light-init` seeds `.light-kit/rules.md` once and never overwrites it.
5. The orchestrator applies the skill before the first task and records the outcome after the request; `light-implement` does the same per plan task; the review checklist reports violations.
6. The audit classifies the new rule and the new skill, and the generated instruction block lists the project rules file.
7. Tests cover the template, the skill, the seeding and the enforcement wiring; the whole suite passes.

## Acceptance criteria
- A fresh install puts `rules.md` in `.light-kit/templates/` and `light-rules` in each client's skill folder; `light-init` copies the template to `.light-kit/rules.md` once.
- The core block contains rule 15 and the project knowledge bullet; the generated `Kit files` line names `.light-kit/rules.md`.
- `npm test` passes, including the audit inventory (15 core rules) and the new wiring assertions.
- The template and the skill agree on: two states, count semantics, promotion at 3, agent cannot demote/delete a confirmed rule.

## In scope / Out of scope
- In: template, skill, core rule, init seeding, orchestrator/implement/review wiring, audit purposes, generated path line, tests, this repo's own `.light-kit/rules.md`, user docs.
- Out: a hook that enforces rules automatically at tool-call time; automatic rule creation from every bug; per-rule severity beyond pending/confirmed; a UI or report.

## Triage
Scores: scope 2, ambiguity 1, risk 0, novelty 1, impact 1 (total 5)
Workflow: standard
Why: several kit components change together (core, skill, template, installer, init, agents, tests), but the outcome is clear, internal and reversible; no discovery beyond the existing files is needed.

## Routing
- understand: easy — restate a precise request.
- discover: easy — read existing skill, template and audit wiring.
- plan: medium — several files must stay consistent.
- implement: medium — new files plus changes in five existing components.
- review: medium — check wording consistency and generated output.
- fix: easy — small wording or wiring corrections.
- conclude: easy — summarize changes and verification.
