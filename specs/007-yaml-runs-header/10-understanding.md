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
Every artifact template starts with a `runs:` front matter block whose entries use ` | ` as a separator (`- step: <step> | agent: <agent> | …`). That is not valid YAML: the first `: ` after `step:` ends the plain scalar, so the parser sees a nested mapping inside a compact mapping. Markdown front matter parsers reject the whole block.

## Root cause
`runs:` is a block sequence of compact mappings. `- step: <step> | agent: <agent>` scans as `step: "<step> | agent"` followed by `: <agent>`, which is a nested mapping — forbidden in a compact mapping.

## Requirements
1. Every artifact template front matter parses as YAML and keeps one structured entry per agent run with `step`, `agent`, `model`, `thinking`, `level`.
2. Real values that already occur must parse: `deepseek-flash[1m]`, `thinking: effort high`.
3. The `artifact-header` hook still accepts and rejects the same cases.
4. Docs and skills describe the new shape; no text still shows the ` | ` one-liner.
5. Existing `specs/` artifacts are migrated to the same shape (their content is unchanged).

## Acceptance criteria
- `ruby -ryaml` (or equivalent) loads each template's front matter without error.
- `npm test` passes with updated fixtures.
- `grep -rn "step: <step> |"` returns nothing under `kit/`, `docs/`, `tests/`.

## In scope / Out of scope
In: templates (7), `docs/usage.md`, `kit/instructions/core.md` wording, skills that mention one line per run, `artifact-header.mjs` and its tests, existing `specs/` front matter.
Out: changing what is recorded, the token-usage hook, installed copies of the kit (the user reinstalls).

## Triage
Scores: scope 1, ambiguity 0, risk 0, novelty 0, impact 1 (total 2)
Workflow: direct
Why: mechanical format fix with a clear, testable outcome, contained to the kit's own files.

## Token usage
Tokens: 0/0 (total 0)
