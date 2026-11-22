---
step: implement
runs:
  - agent: light-developer
    part: implementation
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 3,084 input · 231,424 cache read · 0 cache write · 1,204 output · 235,712 total
  time: 1m 1s
---

# Implementation log

## Progress
- Task 1 feat(kit): add rules promotion threshold to the project profile — `grep -n "Promotion threshold: 3"` found the line in both profiles.

- Task 2 docs(kit): read rule promotion threshold from the project profile — `grep` found the setting and `node --test tests/kit.test.mjs` passed 24/24.

- Task 3 docs(kit): describe rule promotion by the profile threshold — `grep` found the phrase in the template and this repo's seed; `node --test tests/kit.test.mjs` passed 24/24.

- Task 4 docs(kit): point rule promotion at the profile threshold — `grep` found the phrase in core rule 15 and the project-knowledge bullet; `node --test tests/kit.test.mjs` passed 24/24.

- Task 5 docs(kit): document the configurable rule promotion threshold — `grep` found the setting in the learned-rules section.

- Task 6 test(kit): cover the configurable promotion threshold — `node --test tests/kit.test.mjs` passed 24/24; `npm test` passed 183/183; the kit-source grep for `Violated 3 times`, `Count is 3 or more` and `reaches 3` returned nothing.

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

## Review rounds
