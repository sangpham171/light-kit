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
  tokens: 20,763 input · 4,122,624 cache read · 0 cache write · 28,381 output · 4,171,768 total
  time: 8m 51s
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
- Review F-1.2 extended the `rules` step to `bootstrap` and `standardize`; the original plan named only the triage workflows.

## Verification evidence
- `npm test` — 207 tests, 207 pass, 0 fail after the review fixes (includes kit lint).
- `node --test tests/hooks.test.mjs tests/kit.test.mjs` — 101 pass.
- The hook test covers: a defect prompt, a plain failure and a crash report warn and name `light-rules`; a feature prompt and "add a bug tracker" stay silent; `off` and a project without `.light-kit/rules.md` stay silent.

## Technical debt
None introduced. Accepted: the `rules` checkpoint is instruction-only and `light-agent-selection` could still drop it; the mandatory-step list now names it, but no runtime check exists (the same accepted pattern as 041 TD-4). The prompt heuristic can fire on a feature request that mentions a failure; the message is advisory and names the condition, so it is accepted rather than hidden.

## Earlier open debt (R-001)
- 037 follow-up "optional hook that reminds an agent to apply `light-rules` at tool-call time": **still open for tool-call time** — this request adds a prompt-time reminder (`rules-reminder` in `f0ae729`), which covers a reported defect, but a tool-call-time reminder remains out of scope.
- 040 carried 039 TD-1 (the merge does not refresh the prose inside an existing `## States` / `## After a task` section of `.light-kit/rules.md`): **still open** — this request changes the template and the skill, not the init merge.
- 042 TD-1 (Cursor and Codex matchers) and TD-2 (no lock on the usage state): **still open**, unrelated.
- 041 TD-1 to TD-4 (instruction-only enforcement, duplicated baseline prose, reinstall needed, wiring tests): **still open**, unrelated.
- 039 threshold validation and the older 036/038 items: **still open**, unchanged.

## Rules
R-001 applied and satisfied (the earlier debt is listed above with its state). R-002 does not apply: no best-effort state file is read. `rules: no change` — this change introduces no new repeatable failure and violates none.

## Review rounds

### Round 1 of 1
- F-1.1 [should-fix] `specs/043-rule-triggers/50-implementation.md:43` — the 037 follow-up is "at tool-call time"; this request adds a prompt-time hook, so calling it resolved is true in name only — suggested fix: mark the tool-call-time reminder still open and say what the prompt-time hook does — status: fixed (this commit)
- F-1.2 [should-fix] `kit/workflows/bootstrap.md:23` and `kit/workflows/standardize.md:19` — both end in `conclude` but had no `rules` step, against the "every workflow" criterion — suggested fix: add the step and test every workflow — status: fixed (`d71552e`, `2a28ad7`)
- F-1.3 [should-fix] `kit/skills/light-agent-selection/SKILL.md:29` — the mandatory-step list omitted `rules`, so agent selection could drop the checkpoint — suggested fix: add it to the list in the skill and in `docs/usage.md` — status: fixed (`d71552e`)
- F-1.4 [should-fix] `kit/skills/light-review-checklist/SKILL.md:17` — item 9 did not name the user-reported, failed-check or correction triggers — suggested fix: list them there — status: fixed (`d71552e`)
- F-1.5 [nit] `kit/agents/light-tester.md:17`, `kit/instructions/core.md:25`, `kit/templates/rules.md:18` — trigger lists drifted between files — suggested fix: align them with the skill's canonical list — status: fixed (`d71552e`)
- F-1.6 [nit] `tests/kit.test.mjs:282` — no assertions for the orchestrator, tester or review-checklist wording, and no case for a defect-like feature prompt — suggested fix: add them — status: fixed (`2a28ad7`)
- F-1.7 [nit] `kit/hooks/checks/rules-reminder.mjs:7` — "the export fails" and "it crashes" matched no pattern — suggested fix: add conservative failure and crash patterns and a test case — status: fixed (`09885dc`, `2a28ad7`)
- F-1.8 [nit] `specs/043-rule-triggers/50-implementation.md:40` — the instruction-only enforcement of the new checkpoint was omitted from Technical debt — suggested fix: record it as accepted — status: fixed (this commit)
Verdict: changes requested. All findings fixed; Review turns is 1, so no further review round is requested.
