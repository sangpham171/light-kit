---
step: implement
runs:
  - agent: light-orchestrator
    part: implementation
    model: deepseek-flash[1m]
    thinking: unknown
    level: medium
  - agent: light-reviewer
    part: review
    model: unknown
    thinking: unknown
    level: medium
usage:
  tokens: 8,592 input · 3,239,040 cache read · 0 cache write · 13,718 output · 3,261,350 total
  time: 4m 39s
---

# Implementation

## Summary
`rules-reminder` now matches Vietnamese defect words out of the box and accepts additional languages through `rules.extraDefectPatterns` in `.light-kit/hooks.config.json`. The built-in English and Vietnamese sets are documented as a starter, not exhaustive, with a config example for another language; the `light-rules` instructions remain language-independent.

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
None introduced. Accepted: the Vietnamese list is broad — `lỗi` also appears in "xử lý lỗi" (error handling) and `thất bại` in "xử lý khi thất bại" — so those feature requests get the advisory reminder; the message tells the agent to judge, and narrowing the list would weaken the reported case. Accepted: the built-in set is a starter, not a translation service; other languages need the config key.

## Earlier open debt (R-001)
- 043's accepted items (instruction-only rules checkpoint, prompt-heuristic false positives): **still accepted**; this request narrows the language gap but does not remove the general false-positive trade-off.
- 037's tool-call-time reminder: **still open** (prompt-time hook only).
- 040's carried 039 TD-1 (init merge prose), 042 TD-1/TD-2, 041 TD-1 to TD-4 and the older 036/038/039 items: **still open**, unchanged.

## Rules
R-003 was added in `0a6bdae` — this request is its incident (`Count: 1`). R-001 applied and is satisfied (the earlier debt is listed above). R-002 does not apply: no best-effort state file is read. `rules: R-003 added`.

## Review rounds

### Round 1 of 1
- F-1.1 [should-fix] `kit/hooks/README.md:22`, `kit/hooks/README.md:49`, `docs/safety-hooks.md:9` — the docs said only "English and Vietnamese" and gave no example; the log claimed the limit and an example were documented — suggested fix: call both sets a starter, not exhaustive, add an `extraDefectPatterns` example and correct the summary — status: fixed (this commit)
- F-1.2 [should-fix] `tests/hooks.test.mjs:228-229` — the invalid-regex case did not prove the hook kept working, because a swallowed error would also give empty stdout — suggested fix: use a built-in defect prompt, assert the reminder fires and stderr has no `errored` — status: fixed (this commit)
- F-1.3 [nit] `.light-kit/rules.md:36` — R-003 evidence omitted the earlier request that introduced the English-only heuristic — suggested fix: add `specs/043-rule-triggers` — status: fixed (this commit)
- F-1.4 [nit] `specs/044-multilingual-rules-reminder/50-implementation.md:39` — the debt note named only `lỗi`, not the other broad Vietnamese word — suggested fix: name `thất bại` too — status: fixed (this commit)
- F-1.5 [nit] `kit/skills/light-hooks-config/SKILL.md:20-32` — `light-init` had no question for `rules.extraDefectPatterns` — suggested fix: add one to the discovery table — status: fixed (this commit)
Verdict: changes requested. All findings fixed; Review turns is 1, so no further review round is requested.
