---
step: implement
runs:
  - agent: light-developer
    part: implementation
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 15,782 input · 764,288 cache read · 0 cache write · 4,196 output · 784,266 total
  time: 5m 7s
---

# Implementation log

## Progress
- Task 1 feat(kit): add rules promotion threshold to the project profile — `grep -n "Promotion threshold: 3"` found the line in both profiles.

- Task 2 docs(kit): read rule promotion threshold from the project profile — `grep` found the setting and `node --test tests/kit.test.mjs` passed 24/24.

- Task 3 docs(kit): describe rule promotion by the profile threshold — `grep` found the phrase in the template and this repo's seed; `node --test tests/kit.test.mjs` passed 24/24.

- Task 4 docs(kit): point rule promotion at the profile threshold — `grep` found the phrase in core rule 15 and the project-knowledge bullet; `node --test tests/kit.test.mjs` passed 24/24.

- Task 5 docs(kit): document the configurable rule promotion threshold — `grep` found the setting in the learned-rules section.

- Task 6 test(kit): cover the configurable promotion threshold — `node --test tests/kit.test.mjs` passed 24/24; `npm test` passed 183/183; the kit-source grep for `Violated 3 times`, `Count is 3 or more` and `reaches 3` returned nothing.

- Round 1 review fix fix(kit): address the round 1 review for request 039 — F-1.1 and F-1.2 fixed; `node --test tests/kit.test.mjs` passed 24/24; `npm test` passed 183/183.

Rules applied: `.light-kit/rules.md` holds no rules yet. `rules: no change`.

## Technical debt
- None introduced. The canonical phrase appears in six places, but the new test fails on drift between the skill, the rules and profile templates and the generated `CLAUDE.md`; the remaining copies are prose (`docs/usage.md`) and user-owned seeds.
- TD-1 not introduced by the code: rules files seeded before this change keep the literal "3" wording after an upgrade, because installs never overwrite `.light-kit/rules.md` — status: deferred (rewriting it would overwrite a user-owned file; `docs/usage.md` now tells users to add the setting manually, and the generated skill and core instructions are the operative text). Suggested follow-up: a `light-standardize` item that refreshes the paragraph on request.
- TD-2 `.light-kit/project-profile.md` — the threshold is instruction-only; no hook or parser validates it, so a malformed value is caught only by agents following the documented fallback — status: deferred (the plan scopes out hook enforcement; adding a parser would be a new capability). Suggested follow-up: a profile check in the safety hooks.

## Decisions and deviations
- Task entries in `## Progress` name the commit subject instead of its hash: the log travels inside the task's own commit, so the hash does not exist yet when the line is written.
- Core rule 15 and the project-knowledge bullet keep the canonical phrase word for word, which produces nested parentheses in the bullet. Reason: one phrase everywhere matters more than the nesting.
- The no-fixed-3 assertion scans agents, skills, workflows, templates and core, not only the three sources the plan names, so a future copy cannot reintroduce the literal.
- Profile templates put the setting under `## Rules` with the same commented-line pattern as `Review turns` and `Output style`.

## Verification (commands run and results)
- Task 1: `grep -n "Promotion threshold: 3" kit/templates/project-profile.md .light-kit/project-profile.md` — both lines found.
- Task 2: `grep -n "Promotion threshold" kit/skills/light-rules/SKILL.md` — found; `node --test tests/kit.test.mjs` — 24 pass.
- Task 3: `grep -n "promotion threshold" kit/templates/rules.md .light-kit/rules.md` — found in both; `node --test tests/kit.test.mjs` — 24 pass.
- Task 4: `grep -n "promotion threshold" kit/instructions/core.md` — rules 15 and the project-knowledge bullet; `node --test tests/kit.test.mjs` — 24 pass.
- Task 5: `grep -n "Promotion threshold" docs/usage.md` — found.
- Task 6: `node --test tests/kit.test.mjs` — 24 pass; `npm test` — 183 pass, 0 fail; `grep -rn "Violated 3 times\|Count\` is 3 or more\|reaches 3\b" kit` — no matches.
- Round 1: the broadened guard was probed against every kit source and against a full multi-client temp install — no matches; `node --test tests/kit.test.mjs` — 24 pass; `npm test` — 183 pass, 0 fail.

## Review rounds

### Round 1 of 1
- F-1.1 [should-fix] docs/usage.md:11 — the fallback sentence says "a missing, non-numeric or lower value falls back to 3"; the missing comparator can be read as "lower than 3", contradicting the allowed `integer >= 1` range stated in the same sentence — suggested fix: "a missing, non-numeric or lower-than-1 value falls back to 3" — status: fixed (this commit; see Progress)
- F-1.2 [nit] tests/kit.test.mjs:221 — the negative guard only catches "Violated 3 times", "reaches 3" and "Count is 3 or more"; other phrasings of a fixed 3 would pass — suggested fix: broaden the pattern only if it causes no false positives — status: fixed (this commit; guard now also catches "3 or more", "three/3 violations" and "after 3 failures"; probed against kit sources and a full temp install with no false positives)

Verdict: changes requested
