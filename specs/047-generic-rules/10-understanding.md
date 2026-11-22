---
step: understanding
runs:
  - agent: light-orchestrator
    part: understanding and triage
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 1,349 input · 40,704 cache read · 0 cache write · 1,420 output · 43,473 total
  time: 5s
---

# Understanding

## Restatement
The user rejected rules that are tied to one use case. The rule-writing guidance must require the general failure mode, so a learned rule fires whenever the same class of mistake can happen — in another file, feature or workflow — and the incident itself stays only in the evidence columns.

## Prior requests
- `specs/037-project-rules` — created the template, the skill and the before/after loop; this request changes the guidance inside them, not the loop.
- `specs/039-rules-promotion-threshold` — made the threshold a profile setting; unaffected.
- `specs/043-rule-triggers`, `045-universal-rules-reminder` — rule triggers; unaffected.

## Assumptions
- The user's sentence is guidance for writing every future rule, not a request to delete the existing rows.
- Generalizing a `pending` rule's wording is allowed; the file forbids rewriting only `confirmed` rules.

## Open questions (with proposed defaults)
- None.

## Requirements
1. `kit/templates/rules.md` states that a rule must be the general failure mode and must trigger beyond the incident.
2. `kit/skills/light-rules/SKILL.md` applies that requirement when adding or changing a rule.
3. Core rule 15 keeps the same constraint in one clause, without growing the always-loaded layer much.
4. `.light-kit/rules.md` carries the same guidance, gets a `pending` rule for this correction, and its too-narrow R-004 is generalized.
5. `docs/usage.md` tells the user the same thing.
6. A test pins the guidance so a later edit cannot drop it.

## Acceptance criteria
- A reader of the template or the skill knows an incident alone is not a rule; they must state the recurring class.
- R-004 no longer names three hook files in the `Rule` column; the incident stays in `Prevents`/`Evidence`.
- A new `R-005` row records this correction at `Count: 1`, `pending`.
- `npm test` passes.

## In scope / Out of scope
- In: rule-writing guidance in the template, the skill, core rule 15, docs, this project's rules file, and a test.
- Out: changing the promotion mechanics, the states or the hook that reminds agents.

## Triage
Scores: scope 1, ambiguity 1, risk 1, novelty 1, impact 1 (total 5)
Workflow: direct
Why: one concern, documentation and guidance only, no runtime behavior, verified by `npm test`.

## Routing
- understand: easy — the request is one sentence with a clear target.
- plan: easy — four small file edits.
- implement: easy — text edits plus one test assertion.
- review: easy — self-review against the checklist.

## Agent plan
- request: light-orchestrator — capture the correction and the rule row.
- understand: light-orchestrator — restate and triage.
- plan: light-orchestrator — direct workflow, compact plan.
- implement: light-orchestrator — four text edits and a test; no specialist needed.
- verify: npm test — the existing kit tests cover the template and skill.
- conclude: light-orchestrator — summary and rule update.
