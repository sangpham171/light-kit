---
step: plan
runs:
  - agent: light-tech-lead
    part: implementation plan
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 1,330 input · 272,384 cache read · 0 cache write · 1,552 output · 275,266 total
  time: 13s
---

# Plan

- [ ] 1. Add `## Rules` with `Promotion threshold: 3` (comment: integer >= 1, default 3) to the profile template and this repo's profile, after `## Testing policy` — level: easy — files: kit/templates/project-profile.md, .light-kit/project-profile.md — verify: `grep -n "Promotion threshold: 3" kit/templates/project-profile.md .light-kit/project-profile.md` — commit: feat(kit): add rules promotion threshold to the project profile
- [ ] 2. Make the skill read `Promotion threshold` from `.light-kit/project-profile.md` (default 3 when missing or invalid), replace the bare `3 or more` promotion step and make the at-a-glance table threshold-relative; update the pinned assertion at tests/kit.test.mjs:202 so the commit stays green — level: easy — files: kit/skills/light-rules/SKILL.md, tests/kit.test.mjs — verify: `grep -n "Promotion threshold" kit/skills/light-rules/SKILL.md && node --test tests/kit.test.mjs` — commit: docs(kit): read rule promotion threshold from the project profile
- [ ] 3. Replace "Violated 3 times", "Count is 3 or more" and "Reached 3" with the profile's promotion threshold (default 3) in the rules template and this repo's rules seed; update the pinned assertion at tests/kit.test.mjs:198 — level: easy — files: kit/templates/rules.md, .light-kit/rules.md, tests/kit.test.mjs — verify: `grep -n "promotion threshold" kit/templates/rules.md .light-kit/rules.md && node --test tests/kit.test.mjs` — commit: docs(kit): describe rule promotion by the profile threshold
- [ ] 4. Change core rule 15 and the project-knowledge bullet about `.light-kit/rules.md` to compare `Count` with the profile's promotion threshold (default 3) — level: easy — files: kit/instructions/core.md — verify: `grep -n "promotion threshold" kit/instructions/core.md && node --test tests/kit.test.mjs` — commit: docs(kit): point rule promotion at the profile threshold
- [ ] 5. Document in the learned-rules section where to set `Promotion threshold`, that the default is 3, the fallback for missing/invalid values, and that existing profiles add the line manually because upgrades never overwrite the profile — level: easy — files: docs/usage.md — verify: `grep -n "Promotion threshold" docs/usage.md` — commit: docs(kit): document the configurable rule promotion threshold
- [ ] 6. Extend the project-rules test: profile template exposes `Promotion threshold: 3`; skill, rules template and generated `CLAUDE.md` reference the profile threshold; no `Violated 3 times` / `reaches 3` remains in kit sources — level: easy — files: tests/kit.test.mjs — verify: `node --test tests/kit.test.mjs && npm test` — commit: test(kit): cover the configurable promotion threshold
- [ ] 7. Review the change against the `light-review-checklist` skill and the request's acceptance criteria, fix findings, and log decisions, fixes and `rules: no change` in `50-implementation.md` — level: easy — files: specs/039-rules-promotion-threshold/50-implementation.md; a fix commit touches only the specific file a finding names — verify: `npm test` — commit: chore(kit): address review findings for request 039

Plan commit before task 1: `docs(spec): record implementation plan for request 039`.

## Risks
- `tests/kit.test.mjs` pins `3 or more`; tasks 2–3 update those assertions in the same commit so every commit stays green, and task 6 adds the new coverage.
- The threshold is instruction-only; no hook parses it, so a malformed value can only be caught by agents reading the documented fallback. Keep the canonical line name `Promotion threshold` everywhere.
- Existing installs keep their profile and therefore keep the default 3 until the user adds the line; docs must say so.
- Generated client files (`CLAUDE.md`, `.claude/`, `.cursor/`, `.github/`, `.agents/`) are build output: edit `kit/` sources only and let the tests regenerate.
- Wording drift across five sources is the main failure mode; use one phrase, "the promotion threshold in `.light-kit/project-profile.md` (default 3)".

## Test strategy
- Focused `node --test tests/kit.test.mjs` after each source edit that touches generated text.
- Full `npm test` at task 6 and task 7 (includes kit lint).
- Grep audit: `grep -rn "Violated 3 times\|3 or more\|reaches 3" kit .light-kit/rules.md docs/usage.md` returns only documented-default wording.

## Parallelisable tasks
- Tasks 1, 4 and 5 touch disjoint files and can run in parallel.
- Tasks 2 and 3 are independent in meaning but both edit `tests/kit.test.mjs`, so run them one after the other.
- Task 6 depends on tasks 1–5; task 7 runs last.
