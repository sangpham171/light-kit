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
Make the token figures the kit writes and reports easy to read: label input, output and total, and group thousands, in the step section, the conclusion table and the hook's note.

## Current format
- Step artifact: `Tokens: 5731870/62833 (total 5794703)` — a slash separates two unlabelled numbers, seven-digit values have no grouping, and the total sits in parentheses.
- Conclusion row: `| 00-request | 5731870 | 62833 | 5794703 | 15m 58s |` — ungrouped numbers.
- Hook note: five dense lines mixing step delta, request totals, the text to copy and the table.

## Requirements
1. Step artifacts read `Tokens: 5,731,870 input · 62,833 output · 5,794,703 total`, with `Time:` on its own line as today.
2. The conclusion table keeps its columns and gains thousands separators in Input, Output and Total.
3. The hook note labels this write, the step total and the request total, and shows the rows to copy in the same readable form.
4. `Tokens:` and `Time:` stay the keys, so a section written by the previous kit version is still recognised as filled.

## Acceptance criteria
- A step artifact written from the hook's suggestion reads `Tokens: <n> input · <n> output · <n> total`.
- Values of 1,000 or more carry separators everywhere they appear (step section, conclusion rows and total, hook note).
- The existing `filled()` check still accepts a section written in the new format, and still rejects an unfilled one.
- `npm test` passes; `docs/usage.md` describes the new shape.

## In scope / Out of scope
In: `kit/hooks/lib/usage.mjs`, `kit/hooks/checks/token-usage.mjs`, their tests, `docs/usage.md`, `kit/instructions/core.md`.
Out: changing how usage is measured or stored (request 009), the conclusion table's columns, and artifacts already written with the old shape (not rewritten).

## Triage
Scores: scope 1, ambiguity 0, risk 0, novelty 0, impact 0 (total 1)
Workflow: direct
Why: a formatting change in one component, with the desired shape stated in the request; no user data or public behaviour beyond the text the kit prints.

## Routing
- understand: easy.
- implement: easy — one formatter, one message, template text and tests.
- review: easy — format and backward compatibility of the parser.
- conclude: easy.

## Token usage
Tokens: 0 input · 0 output · 0 total
Time: 1s
