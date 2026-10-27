---
step: conclude
runs:
  - agent: light-tech-writer
    model: unknown
    thinking: unknown
    level: easy
usage:
  - step: request
    tokens: unknown
    time: unknown
  - step: understand
    tokens: unknown
    time: unknown
  - step: implement
    tokens: unknown
    time: unknown
  - step: total
    tokens: unknown
    time: unknown
---

# Conclusion

## Summary
The artifact header holds the step once: `step:`, then `runs:` (agent, model, thinking, level) and a
`usage:` block (tokens, time). The conclusion keeps a `- step:` row per step plus `total`, because it
covers every step.

## What changed
Range: `2da5623..773e9e8` on `feat/018-header-step-first`
- Seven templates on the new shape.
- `artifact-header`: step required at the top, still accepted inside a run entry for old headers.
- `token-usage`: reads a block or a row list; suggests a block per step, rows for the conclusion.
- Global rule, `light-model-routing`, `docs/usage.md`, `kit/hooks/README.md` follow.

## Verification evidence
- `npm test`: 130 tests pass.
- The template test pins the header order and the indent of `tokens`/`time`.

## Deferred technical debt and open findings
- None.

## Follow-ups
- The artifacts of `specs/001`–`specs/017` keep the older header; the hooks accept both shapes.
