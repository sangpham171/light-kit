---
step: implement
runs:
  - agent: light-orchestrator
    part: implementation
    model: deepseek-flash[1m]
    thinking: unknown
    level: medium
usage:
  tokens: 12,713 input · 2,539,392 cache read · 0 cache write · 15,929 output · 2,568,034 total
  time: 4m 11s
---

# Implementation

## Summary
Every failure now records a rule, not only a review finding. `light-rules` and the rules template name the triggers; the orchestrator, request, implement, tester and review-checklist instructions carry them; every workflow has a `rules` step before `conclude`; and a new `rules-reminder` prompt hook catches the case with no other checkpoint — a user saying a bug or "still not working" from earlier work.

## Plan execution
| Task | State | Commit | Verification |
|---|---|---|---|
| 1. Trigger list in the rules skill, template and core rule | done | `b0e948f` | `node --test tests/kit.test.mjs` — 25 pass |
| 2. Triggers in orchestrator, request, implement, tester and review checklist | done | `5774d44` | `node --test tests/kit.test.mjs` — 25 pass |
| 3. `rules` step in the three workflows and the usage docs | done | `6042d1f` | `node --test tests/kit.test.mjs` — 25 pass |
| 4. `rules-reminder` hook, registration, default and seed | done | `f0ae729` | `node --test tests/hooks.test.mjs` — 75 pass |
| 5. Hook tests and extended rules assertions | done | `4aea7fb` | `node --test tests/hooks.test.mjs tests/kit.test.mjs` — 101 pass |
| 6. Hook docs | done | `1aad033` | read-back; covered by the task 5 assertions |
| 7. Full suite, review, conclusion | in progress | — | `npm test` — 207 pass, 0 fail |

## Deviations
- Tasks 5 and 6 ran in reverse order: the new test asserts the hook's row in `kit/hooks/README.md`, so the docs had to exist before the focused test could pass. The tests and docs still landed in two separate commits, as planned.
- The plan ticks were written in this commit instead of each task's commit. The code, tests and docs were verified before their commits; only the checkbox update was late.

## Verification evidence
- `npm test` — 207 tests, 207 pass, 0 fail (includes kit lint).
- `node --test tests/hooks.test.mjs tests/kit.test.mjs` — 101 pass.
- The new hook test covers: a defect prompt warns and names `light-rules`; a feature prompt stays silent; `off` silences it; a project without `.light-kit/rules.md` stays silent.

## Technical debt
None introduced. The prompt heuristic can fire on a feature request that mentions a failure; the message is advisory and names the condition, so it is accepted rather than hidden.

## Earlier open debt (R-001)
- 037 follow-up "optional hook that reminds an agent to apply `light-rules`": **resolved** by `rules-reminder` in `f0ae729`.
- 040 carried 039 TD-1 (the merge does not refresh the prose inside an existing `## States` / `## After a task` section of `.light-kit/rules.md`): **still open** — this request changes the template and the skill, not the init merge.
- 042 TD-1 (Cursor and Codex matchers) and TD-2 (no lock on the usage state): **still open**, unrelated.
- 041 TD-1 to TD-4 (instruction-only enforcement, duplicated baseline prose, reinstall needed, wiring tests): **still open**, unrelated.
- 039 threshold validation and the older 036/038 items: **still open**, unchanged.

## Rules
R-001 applied and satisfied (the earlier debt is listed above with its state). R-002 does not apply: no best-effort state file is read. `rules: no change` — this change introduces no new repeatable failure and violates none.

## Review rounds
(to be filled by the reviewer)
