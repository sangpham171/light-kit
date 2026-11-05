---
step: understand
runs:
  - agent: light-orchestrator
    part: restatement, triage and routing
    model: deepseek-flash
    thinking: unknown
    level: easy
usage:
  tokens: unknown input · unknown cache read · unknown cache write · unknown output · unknown total
  time: unknown
---

# Understanding

## Restatement
The `runs:` header is meant to say which agent produced an artifact. In practice the session that writes the file always credits itself (`light-orchestrator`), so 028's plan, implementation and conclusion all look like orchestrator work even though the workflow assigns those steps to the tech-lead, developer and tech-writer. The fix must (a) make the rule explicit that the entry names the agent that did the step, (b) give an artifact written by several agents a way to say which agent did which part, and (c) check both when an artifact is written.

## Assumptions
- The workflow files are the source of truth for who owns a step; the hook can read the active request's `status.md` for the workflow name and the installed workflow file for the step owners.
- A single-agent artifact needs no `part:`; the requirement applies when two or more distinct agents appear in `runs:`.
- A legitimate orchestrator-run step (a client without usable subagents) is kept readable by adding `part:`; the hook accepts that explanation.

## Open questions (with proposed defaults)
- None. Default: extend `artifact-header` and keep the header fields the same apart from the optional-to-required `part:`.

## Requirements
1. Rule 12 names the performing agent and defines `part:` for multi-agent artifacts.
2. Every artifact template shows the `part:` field.
3. The `artifact-header` hook warns when a request artifact credits an agent outside the workflow step's owners, and when several agents share an artifact without `part:` lines.
4. Documentation (usage, hooks README, model routing, orchestrator) states the same rule.
5. Tests cover both warnings and the template/rule text.

## Acceptance criteria
- Writing `specs/001-x/40-plan.md` with `agent: light-orchestrator` and no `part:` in a `direct` request produces a warning naming `light-tech-lead`.
- Writing the same header with `part:` produces no warning.
- An artifact crediting two agents without `part:` produces a warning; with `part:` it is quiet.
- `npm test` passes.

## In scope / Out of scope
In scope: instructions, templates, `artifact-header` hook, tests, related docs.
Out of scope: rewriting historical request artifacts, changing the workflow files, adding a config key.

## Triage
Scores: scope 2, ambiguity 0, risk 0, novelty 1, impact 1 (total 4)
Workflow: standard
Why: several kit components change, the outcome is clear and internal; a variation of the existing header check.

## Routing
- request: easy — capture the message as it is
- understand: easy — triage and restate
- discover: medium — trace templates, rules and the header check
- plan: medium — two verifiable tasks
- implement: medium — hook parsing plus tests
- review: easy — check the rule, the hook and the tests agree
- conclude: easy — summary only
