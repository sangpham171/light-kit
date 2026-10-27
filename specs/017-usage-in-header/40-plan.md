---
runs:
  - step: plan
    agent: light-tech-lead
    model: deepseek-v4-flash
    thinking: unknown
    level: easy
usage:
  - step: 40-plan
    tokens: unknown
    time: unknown
---

# Plan

- [x] 1. Move usage into the header of all seven templates — level: easy — files: `kit/templates/*.md` — verify: `grep -rn 'Token usage' kit/templates` is empty and each header has a `usage:` list — commit: `feat(templates): record token usage in the artifact header`
- [x] 2. Read and suggest the header in the `token-usage` hook, keeping the old section as a filled fallback — level: medium — files: `kit/hooks/checks/token-usage.mjs` — verify: hook tests — commit: `feat(hooks): read token usage from the artifact header`
- [x] 3. Update the hook and template tests — level: medium — files: `tests/hooks.test.mjs`, `tests/kit.test.mjs` — verify: `npm test` — commit: `test(hooks): cover usage in the header`
- [x] 4. Update the rule and docs — level: easy — files: `kit/instructions/core.md`, `docs/usage.md` — verify: `npm test` (lint) and a read-through — commit: `docs: describe usage in the artifact header`

Each task = one verified, coherent commit.

## Risks
- The conclusion shape changes from a table to YAML rows; suggestion text must match it exactly.
- A filled check that misses a row keeps warning on every write.

## Test strategy
- Template test asserts the new header and the absence of `## Token usage`.
- Hook tests: unfilled template warns with `usage:` rows; filled header is silent; legacy section is
  still silent; conclusion list filled/unfilled; no `time` row is unfilled.

## Parallelisable tasks
None; the hook and tests change together.
