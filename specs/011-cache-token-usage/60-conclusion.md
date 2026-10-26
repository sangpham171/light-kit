---
runs:
  - step: conclude
    agent: light-orchestrator
    model: deepseek-flash[1m]
    thinking: unknown
    level: medium
---

# Conclusion

## Summary
Cache reads and cache writes are now their own figures. `input` counts only uncached prompt tokens, so the kit's input matches the client's `/usage` instead of reporting input plus cache reads as one number; the total adds input, cache read, cache write and output. The step line and the conclusion table show all five, and a state file from the old definition restarts.

## What changed
Range: `1fa8b30ca4bd40b2ba4ecd57363cf24a1cc7a8a9..HEAD` on `feat/011-cache-token-usage`
- `kit/hooks/lib/usage.mjs` — uncached input, separate cache figures, total over all four, delta carrying cache.
- `kit/hooks/checks/token-usage.mjs` — state version 3, cache in sessions/steps/request totals, 7-column rows, a Time column read from the header.
- `kit/templates/60-conclusion.md` — `Step | Input | Cache read | Cache write | Output | Total | Time`.
- `docs/usage.md`, `kit/hooks/README.md`, `kit/instructions/core.md` — the new definition.
- `tests/usage.test.mjs`, `tests/hooks.test.mjs`, `tests/kit.test.mjs` — split, migration, 4/5/7-column tables, header equality with the template.
- Commits: `251bab0`, `f75e26d`.

## Verification evidence
- `npm test`: 118 tests, 118 pass, 0 fail.
- Transcript cross-check: 68 deduplicated messages yield 66,918 input, 4,522,368 cache read, 0 cache write, 40,976 output; the client's `/usage` for the same session reported 63.2k input, 4.4m cache read, 36.7k output. The figures agree; the kit previously reported the 4.4m inside input.
- A `version: 2` state file restarts; a table without a Time column is never counted as filled, while the 5-column 008–010 shape still is.
- Review: `light-reviewer`, round 1, verdict changes requested; one should-fix (a table without a Time column counted as filled) and seven nits fixed in `f75e26d`. No further review turn is configured.

## Token usage
| Step | Input | Cache read | Cache write | Output | Total | Time |
|---|---|---|---|---|---|---|
| 00-request | 4,675 | 586,496 | 0 | 6,338 | 597,509 | 12m 5s |
| 10-understanding | 602 | 208,384 | 0 | 1,527 | 210,513 | 9s |
| 20-discovery | 1,762 | 320,768 | 0 | 1,763 | 324,293 | 12s |
| 40-plan | 1,205 | 329,344 | 0 | 1,302 | 331,851 | 9s |
| 50-implementation | 17,986 | 5,655,552 | 0 | 31,005 | 5,704,543 | 8m 31s |
| 60-conclusion | 488 | 313,728 | 0 | 2,603 | 316,819 | 13s |
| **Total** | 26,718 | 7,414,272 | 0 | 44,538 | 7,485,528 | 21m 22s |

These are recomputed from the transcript at each artifact's write time under the new definition, because the installed hook still folds cache into input during this request. The 00-request row starts at the previous request's last artifact: time away between requests is counted because the gap stayed under the 15-minute idle threshold.

## Deferred technical debt and open findings
- Artifacts from requests 004–010 keep an `input` that includes cache reads; they are not rewritten.
- The installed copy of the kit keeps the old definition until it is reinstalled.
- Subagent transcripts are still not counted.

## Follow-ups
- Reinstall the kit at the user level so the live hooks report cache read and write separately.
- A cache-hit percentage can be derived from these figures if it is ever wanted; it was left out to keep the table readable.
