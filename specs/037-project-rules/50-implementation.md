---
step: implement
runs:
  - agent: light-developer
    part: implementation (tasks 1-6)
    model: deepseek-flash[1m]
    thinking: unknown
    level: medium
  - agent: light-developer
    part: review fixes (task 7)
    model: deepseek-flash[1m]
    thinking: unknown
    level: medium
usage:
  tokens: 29,457 input · 5,393,280 cache read · 0 cache write · 29,103 output · 5,451,840 total
  time: 8m 20s
---

# Implementation log

## Progress
- Task 1 `ab49962` feat(kit): add the project rules template
- Task 2 `57104e0` feat(kit): add the light-rules skill
- Task 3 `48002e5` feat(kit): load the project rules before every task
- Task 4 `af826f8` feat(kit): seed and enforce the project rules
- Task 5 `da9d98d` test(kit): cover the project rules workflow
- Task 6 `57a32c7` docs(kit): document the project rules
- Task 7 `2b2940f` fix(kit): address the round 1 review for the project rules

Rules applied: no `.light-kit/rules.md` existed before this request; this request seeded it with no rules yet. `rules: no change`.

## Technical debt
- TD-1 The before/after contract appears in `kit/templates/rules.md`, `kit/skills/light-rules/SKILL.md` and core rule 15 — status: resolved (`2b2940f`), by aligning the state and promotion wording and asserting both copies in `tests/kit.test.mjs`. A future drift between template and skill now fails a test.
- The baseline audit failure (the empty `kit/skills/light-rules/` folder) is resolved by task 2.

## Decisions and deviations
- The canonical skill says `.light-kit/templates/rules.md`; `tools/build.mjs` rewrites `.light-kit/{templates,workflows,profiles}` to `~/.light-kit/...` for a user-level install, so the same text is correct at both levels.
- The installer seeds `.light-kit/rules.md` at project level and for every workspace project, next to the profile and hooks config. `light-init` still creates it for a user-level project that is not enabled yet. Reason: the file exists before the first task at every enabled level, and soft uninstall keeps it like the profile.
- The skill no longer creates the file at task time. Reason: at user level in an uninitialised project that would silently create `.light-kit/`, which the kit avoids elsewhere. Missing rules now mean "project not enabled"; the agent notes it and continues.
- The audit tests pin the rule count at `15` again, with one assertion on the rule title. Reason: deriving it from `core.md` made the inventory assertion tautological and would not catch a rule dropped together with its purpose entry.
- The plan's test strategy mentions `--dry-run` listing `rules.md`; the installer prints only counts. Verification used the test suite and a temp install instead.

## Verification (commands run and results)
- `node --test tests/audit.test.mjs` — 10 pass.
- `node --test tests/kit.test.mjs` — 24 pass, including the new rules test.
- `node --test tests/workspace.test.mjs tests/uninstall.test.mjs` — 31 pass.
- `npm test` — 178 tests, 178 pass, 0 fail.
- `node -e "import('./tools/build.mjs')…"` lint — `[]`.
- Temp workspace install with two repositories — `p1/.light-kit/rules.md` and `p2/.light-kit/rules.md` both present.
- Temp project install, then reinstall after editing both rules files — template and project file unchanged; soft uninstall keeps `.light-kit/rules.md`.

## Review rounds
Round 1 of 1 (verdict: changes requested; every finding fixed in `2b2940f`; no blockers remain).
- F-1.1 [should-fix] `kit/skills/light-rules/SKILL.md:15` — the skill created `.light-kit/rules.md` at task time, unplanned and able to create `.light-kit/` in an uninitialised user-level project — removed the auto-create, documented the decision — status: fixed (`2b2940f`).
- T-1.1 [should-fix] `tools/build.mjs:310-313` — a workspace install seeded each project's profile and hooks but not its rules file, so the runtime path was ambiguous — seed `<project>/.light-kit/rules.md` per project, list rules in `light-project-scope` — status: fixed (`2b2940f`).
- F-1.2 [nit] `kit/templates/rules.md:14` — promotion wording only covered a rule reaching exactly 3 — use "3 or more" in the template and the skill, assert both — status: fixed (`2b2940f`).
- F-1.3 [nit] `kit/templates/rules.md:11` — `pending` said "seen once or twice" while a `Count: 0` rule is allowed — "Violated 0–2 times, or added before any violation", table starts at 0–2 — status: fixed (`2b2940f`).
- F-1.4 [nit] `tests/kit.test.mjs:210-213` — the comment claimed the project's own rules survived, but only the template was rewritten — the test now rewrites and checks both — status: fixed (`2b2940f`).
- F-1.5 [nit] `docs/installation.md:96` — the generated-layout row implied `.light-kit/rules.md` at user level — now noted as seeded per project only — status: fixed (`2b2940f`).
- F-1.6 [nit] `kit/templates/rules.md:20,50` — the example reused `R-004` and the placeholder replacement was unstated — example is `R-001`, with a line to replace `_none yet_` — status: fixed (`2b2940f`).
- F-1.7 [nit] `tools/uninstall.mjs:17` — soft uninstall's keep-list did not name `rules.md` — added, with an uninstall test assertion — status: fixed (`2b2940f`).
- F-1.8 [nit] `tests/audit.test.mjs:14,23` — the derived rule count made the inventory assertion tautological — back to an explicit 15 plus the rule title — status: fixed (`2b2940f`).
- T-1.2 [nit] `specs/037-project-rules/40-plan.md:35` — the plan says a dry run lists `rules.md`, but the CLI prints counts only — recorded here; the plan stays as the historical agreement — status: declined (recorded).
