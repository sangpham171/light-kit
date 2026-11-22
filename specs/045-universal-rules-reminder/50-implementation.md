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
  tokens: 9,845 input · 4,787,584 cache read · 0 cache write · 13,639 output · 4,811,068 total
  time: 6m 30s
---

# Implementation

## Summary
`rules-reminder` no longer reads the prompt and has no word list. It emits one generic reminder at session start when the project has `.light-kit/rules.md`: rules are recorded for a user-reported bug or regression, a failed check, a review/tester/security finding and a correction, not only after a review. The agent judges the user's message in any language. `rules.extraDefectPatterns`, the English `DEFECT` list and the Vietnamese list are gone; the workflow `rules` step remains the guarantee.

## Plan execution
| Task | State | Commit | Verification |
|---|---|---|---|
| 1. R-003 updated to the repeated failure and the language-neutral lesson | done | `277ce6a` | read-back |
| 2. `rules-reminder` rewritten as a session-start, no-pattern reminder | done | `4538eef` | `node --test tests/hooks.test.mjs` — 75 pass |
| 3. `extraDefectPatterns` removed from the loader, seeds and hooks-config skill | done | `4538eef` | `node --test tests/kit.test.mjs` — 25 pass |
| 4. Tests for session-start, prompt silence, no rules file, `off` and the removed key | done | `c8328ca` | `node --test tests/hooks.test.mjs tests/kit.test.mjs` — 101 pass |
| 5. Docs describe the universal reminder | done | `e7cbc7a` | read-back; `tests/kit.test.mjs` — 25 pass |
| 6. Full suite, review, conclusion | in progress | — | `npm test` — 207 pass, 0 fail |

## Deviations
None. The hooks-config skill row was removed in the same commit as the config key, as plan task 3 required.

## Verification evidence
- `npm test` — 207 tests, 207 pass, 0 fail (includes kit lint).
- `node --test tests/hooks.test.mjs tests/kit.test.mjs` — 101 pass.
- The hook test asserts a session-start reminder names `light-rules`, a prompt emits nothing, and `off` or a missing rules file suppresses it.
- A source search finds no `DEFECT`, `VIETNAMESE` or `extraDefectPatterns` in `kit/`, `docs/`, `tests/` or `.light-kit/` except the negative test assertions.

## Technical debt
None introduced. Accepted: a session-start reminder is less timely than a prompt-time detector. That is the trade-off for a mechanism that works in every language without guessing; the workflow `rules` step enforces the recording. Accepted: a project that already set `rules.extraDefectPatterns` keeps an ignored key after upgrade; it is harmless and the docs no longer mention it.

## Earlier open debt (R-001)
- 044's accepted broad-pattern false positives: **resolved** — the patterns and the config key are removed.
- 043's accepted instruction-only rules checkpoint: **still accepted**; the `rules` workflow step is unchanged.
- 037's tool-call-time reminder: **still open** (this is a session-start reminder).
- 040's carried 039 TD-1, 042 TD-1/TD-2, 041 TD-1 to TD-4 and the older 036/038/039 items: **still open**, unchanged.

## Rules
R-003 is the governing rule: `Count` goes from 1 to 2 for the two earlier language-specific attempts (043 and 044). The user's report in request 045 is the trigger for the fix, not a third violation. R-001 applied and is satisfied. R-002 does not apply: no best-effort state file is read. `rules: R-003 count 2`.

## Review rounds

### Round 1 of 1
- F-1.1 [should-fix] `tests/kit.test.mjs:297` — the removed key was guarded only in the installed seed, template and README; the loader, `docs/safety-hooks.md` and the hooks-config skill were unguarded — suggested fix: assert all kit hook sources and those files, and add a stale-key prompt case — status: fixed (this commit)
- F-1.2 [nit] `kit/hooks/README.md:22` — "once per session" overstates a `SessionStart` registration that also fires on resume, clear and compact — suggested fix: say "at session start" — status: fixed (this commit)
- F-1.3 [nit] `specs/045-universal-rules-reminder/50-implementation.md:30` — the recorded deviation was not a deviation (task 3 named the hooks-config skill) — suggested fix: remove it — status: fixed (this commit)
- F-1.4 [nit] `specs/045-universal-rules-reminder/50-implementation.md:49` — the Rules note read as if request 045 were a third violation — suggested fix: state that Count 2 covers 043 and 044, and 045 is the trigger — status: fixed (this commit)
- F-1.5 [nit] `specs/045-universal-rules-reminder/50-implementation.md:42` — R-001 requires the open-debt list in the conclusion too — suggested fix: repeat it in `60-conclusion.md` — status: fixed (conclusion)
Verdict: changes requested. All findings fixed; Review turns is 1, so no further review round is requested.
