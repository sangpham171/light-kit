---
step: implement
runs:
  - agent: light-orchestrator
    part: implementation
    model: deepseek-flash[1m]
    thinking: unknown
    level: medium
usage:
  tokens: 4,299 input · 2,065,408 cache read · 0 cache write · 8,749 output · 2,078,456 total
  time: 1m 55s
---

# Implementation

## Summary
`rules-reminder` now matches Vietnamese defect words out of the box and accepts additional languages through `rules.extraDefectPatterns` in `.light-kit/hooks.config.json`. The built-in English and Vietnamese sets are documented as a starter, not a complete list; the `light-rules` instructions remain language-independent.

## Plan execution
| Task | State | Commit | Verification |
|---|---|---|---|
| 1. Record R-003 for English-only user-input heuristics | done | `0a6bdae` | read-back |
| 2. Add `extraDefectPatterns` to the config loader and seeds | done | `617cc11` | `node --test tests/hooks.test.mjs` — 75 pass |
| 3. Add Vietnamese patterns and merge configured patterns | done | `617cc11` | `node --test tests/hooks.test.mjs` — 75 pass |
| 4. Add multilingual hook tests | done | `38b7486` | `node --test tests/hooks.test.mjs tests/kit.test.mjs` — 101 pass |
| 5. Document the language limit and the config key | done | `b3ce603` | read-back; `tests/kit.test.mjs` — 25 pass |
| 6. Full suite, review, conclusion | in progress | — | `npm test` — 207 pass, 0 fail |

## Deviations
- Task 2's planned commit subject was "let a project add defect patterns in any language"; the landed subject is "support defect patterns in other languages". The content matches the task.
- The config key is read only from `rules.extraDefectPatterns`; there is no fallback alias.

## Verification evidence
- `npm test` — 207 tests, 207 pass, 0 fail (includes kit lint).
- `node --test tests/hooks.test.mjs tests/kit.test.mjs` — 101 pass.
- A manual check of the patterns: "xuất dữ liệu vẫn không hoạt động", "bị lỗi khi lưu" and "ứng dụng bị sập" match; "thêm nút xuất" does not.

## Technical debt
None introduced. Accepted: `lỗi` also appears in "xử lý lỗi" (error handling), so that feature request gets the advisory reminder; the message tells the agent to judge, and narrowing it would weaken the reported case. Accepted: the built-in set is a starter, not a translation service; other languages need the config key.

## Earlier open debt (R-001)
- 043's accepted items (instruction-only rules checkpoint, prompt-heuristic false positives): **still accepted**; this request narrows the language gap but does not remove the general false-positive trade-off.
- 037's tool-call-time reminder: **still open** (prompt-time hook only).
- 040's carried 039 TD-1 (init merge prose), 042 TD-1/TD-2, 041 TD-1 to TD-4 and the older 036/038/039 items: **still open**, unchanged.

## Rules
R-003 was added in `0a6bdae` — this request is its incident (`Count: 1`). R-001 applied and is satisfied (the earlier debt is listed above). R-002 does not apply: no best-effort state file is read. `rules: R-003 added`.

## Review rounds
(to be filled by the reviewer)
