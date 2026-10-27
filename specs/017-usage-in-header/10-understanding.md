---
runs:
  - step: understand
    agent: light-orchestrator
    model: deepseek-v4-flash
    thinking: unknown
    level: easy
usage:
  - step: 10-understanding
    tokens: unknown
    time: unknown
---

# Understanding

## Restatement
Every artifact template records the step's tokens and time in the YAML header instead of a
trailing `## Token usage` section.

## Requirements
1. All seven artifact templates (`00`–`60`) carry a `usage:` list in the header, each row holding
   `step`, `tokens` and `time`; the `## Token usage` sections are gone.
2. `60-conclusion` keeps one row per step plus a `total` row.
3. The `token-usage` hook reads the header, and its suggestion gives the `usage:` rows to copy.
4. Old artifacts with a `## Token usage` section still count as filled.
5. `docs/usage.md` and the core rule describe the header.

## Acceptance criteria
- `npm test` passes.
- `kit/templates/*.md` show usage in the header only.
- A hook run on an unfilled template prints the `usage:` rows; a filled header prints nothing.

## In scope / Out of scope
In: templates, `token-usage` hook and its tests, `docs/usage.md`, `kit/instructions/core.md`.
Out: historical specs, install/build layout.

## Triage
Scores: scope 2, ambiguity 1, risk 1, novelty 1, impact 1 (total 6)
Workflow: standard
Why: several components (templates, hook, docs, tests) and a shape choice for the conclusion list;
the outcome itself is clear.

## Routing
- understand: easy — read the templates and the hook.
- discover: easy — locate every reader of the section.
- plan: easy — one ordered list.
- implement: medium — parser and tests change together.
- verify: easy — run the suite and a manual hook run.
- conclude: easy — record the outcome.
