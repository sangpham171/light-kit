---
step: understand
runs:
  - agent: light-orchestrator
    part: understanding, triage and agent plan
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 230 input · 84,736 cache read · 0 cache write · 1,229 output · 86,195 total
  time: 7s
---

# Understanding

## Restatement
Rules are currently added in practice only when the reviewer reports a finding. Make every failure a trigger: a user reporting a bug or regression from earlier work, "still not working", a failed test/build/lint/manual check, a tester or security finding, a user correction, and a defect found while implementing. Record the rule in the same request or exchange, with the report and the earlier request as evidence.

## Prior requests
Read `037-project-rules` (the rules file, skill and checkpoints), `039-rules-promotion-threshold` (threshold in the profile), `040-init-updates-existing-kit` (R-001 evidence; init refresh) and `042-agent-skill-usage` (recent hook pattern and prompt-hook tests). Reused: the existing `light-rules` before/after split, the `capture-discussion` prompt-hook pattern and its tests. Contradicted: nothing. Both current rules came from review findings, which confirms the reported gap.

## Assumptions
- A user defect report is a task even when it is a one-line chat message; the core rule applies without a new request folder.
- A prompt-time reminder is advisory; it must never block the agent and must be silent in a project without `.light-kit/rules.md`.
- The workflow `rules` step writes the file only when a rule changes; otherwise the log records `rules: no change`.

## Requirements
1. `light-rules` and the rules template list the triggers, not only "after a task".
2. Core rule 15, the orchestrator, `light-request`, `light-implement`, the tester and the review checklist state the same triggers.
3. Direct, standard and full workflows run a `rules` step before `conclude`.
4. A `rules-reminder` prompt hook warns on a defect-like user message when the project has a rules file.
5. The hook defaults to `warn`, can be set to `off`, and never blocks.
6. Docs list the new hook and the new workflow step.
7. Tests guard the wording, the workflow step and the hook behaviour.

## Acceptance criteria
- A prompt such as "the export still does not work after request 041" produces a `rules-reminder` warning naming `light-rules`; "add an export button" produces nothing.
- The same defect prompt in a project without `.light-kit/rules.md` produces nothing.
- `hooks: {"rules-reminder": "off"}` produces nothing.
- Every workflow has `skill: light-rules` before its `conclude` step.
- `light-rules` matches a user-reported bug and the trigger list;`CLAUDE.md` carries the same wording.
- `npm test` passes.

## In scope / Out of scope
- In: rules skill, template, core instructions, orchestrator, request/implement/tester/review skills, three workflows, one prompt hook and its config/docs/tests, usage docs.
- Out: automatic detection of review findings (the reviewer already reports them), a tool-call hook, historical backfill of rules, demoting or rewriting existing rules.

## Triage
Scores: scope 2, ambiguity 1, risk 1, novelty 1, impact 1 (total 6)
Workflow: standard
Why: several instruction files plus one hook and tests; the failure modes are known and reversible.

## Routing
- understand: easy — restate a clear request.
- discover: easy — the rules system and hook patterns were read directly.
- plan: easy — known files, one new hook.
- implement: medium — hook heuristics, wording consistency across files.
- verify-and-review: medium — false positives and generated-file drift.
- conclude: easy — summarize.

## Agent plan
- understand: light-orchestrator — baseline.
- discover: light-orchestrator — inline; skip `light-tech-lead` and `20-discovery.md` (reason: the rules, workflow and hook sources were read directly).
- plan: light-orchestrator — compact plan (after inline discovery).
- implement: light-orchestrator — edits in the main session; no separate developer call for instruction and hook work.
- verify-and-review: light-reviewer — independent read of the diff.
- fix: light-orchestrator — apply review findings.
- conclude: light-orchestrator — final summary.
