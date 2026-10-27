---
runs:
  - step: request
    agent: light-orchestrator
    model: deepseek-v4-flash
    thinking: unknown
    level: easy
usage:
  - step: 00-request
    tokens: unknown
    time: unknown
---

# Request 017 — Token usage in the header

Date: 2026-10-27
Requested by: light
Branch: `feat/017-usage-in-header` from `af0be6b` (`fix/016-copilot-token-usage`)

## Original request
move the tokens and time to header for all templates

## Interpretation
The `## Token usage` section at the end of every artifact template moves into the YAML header
(frontmatter) as a `usage:` list. One row per artifact step, `tokens:` and `time:` per row; the
conclusion template carries one row per step plus a `total` row.

## Out of scope
- Rewriting the historical artifacts in `specs/001`–`specs/016` (they keep their `## Token usage`
  sections; the hook still reads them).
