---
step: understand
runs:
  - agent: light-orchestrator
    model: unknown
    thinking: unknown
    level: easy
usage:
  tokens: unknown
  time: unknown
---

# Understanding

## Restatement
Change the artifact header shape in every template: one top-level `step:`, then `runs:` (no `step`
per entry) and `usage:` (no `step` row). Follow through in the two hooks that read or check the
header, the tests, the global rule, the skills and the docs.

## Requirements
1. The seven artifact templates use: `step:`, `runs:` with one entry per run (agent, model, thinking,
   level), then `usage:` with `tokens` and `time`. `60-conclusion.md` keeps a per-step `- step:` row
   list plus the `total` row, because it reports every step.
2. `artifact-header` accepts the new shape and still accepts the old one (artifacts already written).
3. `token-usage` reads a `usage:` block as well as a `usage:` row list, reports the right figures and
   suggests the block for a step, the rows for the conclusion.
4. Docs and skills describe the new shape.

## Assumptions
- `step:` holds the step the artifact belongs to (`request`, `plan`, …), the same value the hook
  derives from the file name.

## Open questions (with proposed defaults)
None.
