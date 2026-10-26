---
runs:
  - step: understand
    agent: light-orchestrator
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
---

# Understanding

## Restatement
Request 011 added cache read and cache write to the hook, the conclusion table and the instructions, but the six step templates still only say `Tokens: unknown`. Show the labelled shape the hook fills in each of them, so an agent writing any artifact names the cache figures.

## Requirements
1. `00-request`, `10-understanding`, `20-discovery`, `30-design`, `40-plan` and `50-implementation` show `Tokens: <input> input · <cache read> cache read · <cache write> cache write · <output> output · <total> total` in their `## Token usage` section; `Time: unknown` stays.
2. The labels and order match `formatUsage` and the conclusion table: input, cache read, cache write, output, total.
3. A test asserts the labelled placeholder in every step template.
4. `docs/usage.md` says the step templates carry the same labels.

## Acceptance criteria
- Every non-conclusion artifact template has the labelled `Tokens:` line.
- `npm test` passes.
- A client without a session record still ends with `Tokens: unknown`, which the templates allow.

## In scope / Out of scope
In: the six templates, the template test, `docs/usage.md`, this request's artifacts.
Out: the conclusion template, the hook, the meaning of the figures (all settled in 011).

## Triage
Scores: scope 1, ambiguity 0, risk 0, novelty 0, impact 1 (total 2)
Workflow: direct
Why: six text templates plus their test and one doc line; the shape already exists in the conclusion template, so no new behaviour.

## Token usage
Tokens: 969 input · 44,928 cache read · 0 cache write · 829 output · 46,726 total
Time: 5s
