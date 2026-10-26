---
runs:
  - step: conclude
    agent: light-orchestrator
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
---

# Conclusion

## Summary
Token figures now read `<input> input · <output> output · <total> total` with thousands grouped, in the `Tokens:` line, the conclusion table and the hook's note. The note labels this write, the step total and the request total, and shows the table with its header; for `60-conclusion.md` it asks for the table instead of a `Tokens:` line. The `Tokens:` and `Time:` keys are unchanged, so artifacts written before and after the change are both recognised as filled.

## What changed
Range: `331e5a41feb31bd0ac6b72ba5b7077f195cb3903..HEAD` on `feat/010-token-usage-format`
- `kit/hooks/lib/usage.mjs` — `formatCount` groups thousands and never prints a negative; `formatUsage` labels input, output and total.
- `kit/hooks/checks/token-usage.mjs` — note split into title, this write, step total and request total; grouped rows; a conclusion-aware instruction.
- `docs/usage.md`, `kit/instructions/core.md` — describe the new shape.
- `tests/usage.test.mjs`, `tests/hooks.test.mjs` — formatting, grouping, backward compatibility, table header and conclusion wording.
- Commits: `f7f327b`, `95430d2`.

## Verification evidence
- `npm test`: 116 tests, 116 pass, 0 fail.
- The previous `123/45 (total 168)` shape and the new shape both count as filled; an unfilled section is still nagged.
- Review: `light-reviewer`, round 1, verdict approve; all five nits fixed in `95430d2`.

## Token usage
| Step | Input | Output | Total | Time |
|---|---|---|---|---|
| 00-request | 657,418 | 11,494 | 668,912 | 2m 15s |
| 10-understanding | 56,100 | 745 | 56,845 | 4s |
| 50-implementation | 3,127,704 | 19,603 | 3,147,307 | 5m 30s |
| 60-conclusion | 177,612 | 3,221 | 180,833 | 20s |
| **Total** | 4,018,834 | 35,063 | 4,053,897 | 8m 11s |

Figures are the hook's totals at the moment each artifact was written; the editing turns after that are not counted, as `docs/usage.md` states.

## Deferred technical debt and open findings
- Artifacts from earlier requests keep the old `<input>/<output>` shape; they are not rewritten.
- The installed copy of the kit keeps the old format until it is reinstalled.

## Follow-ups
- Reinstall the kit at the level in use (user, workspace or project) so the live hooks print the new format.
