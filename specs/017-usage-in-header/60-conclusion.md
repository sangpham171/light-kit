---
runs:
  - step: conclude
    agent: light-tech-writer
    model: deepseek-v4-flash
    thinking: unknown
    level: easy
usage:
  - step: request
    tokens: unknown
    time: unknown
  - step: understand
    tokens: unknown
    time: unknown
  - step: discover
    tokens: unknown
    time: unknown
  - step: plan
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
Templates record tokens and time in the YAML header, not in a trailing section.

## What changed
Range: `af0be6b..a574920` on `feat/017-usage-in-header`
- Seven templates: header `usage:` list; the `## Token usage` sections and the conclusion table are gone.
- `token-usage` hook: reads the header rows, suggests the rows to paste, still accepts the old section.
- Tests and docs follow the new shape.

## Verification evidence
- `npm test`: 130 tests pass.

## Deferred technical debt and open findings
- None.

## Follow-ups
- None.
