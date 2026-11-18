---
step: implement
runs:
  - agent: light-developer
    part: skill output, template, documentation and tests
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 8,729 input · 2,207,360 cache read · 0 cache write · 11,513 output · 2,227,602 total
  time: 5m 54s
---

# Implementation log

## Task 1 — the file output
- Added `kit/templates/brainstorm.md`, installed to `.light-kit/templates/brainstorm.md` with the other templates.
- The skill now writes every map to `brainstorms/<YYYY-MM-DD>-<slug>.md`, creates the folder, and appends a round to the same file for a repeated idea.
- A request, when active, gets one `Brainstorm: brainstorms/...` reference line; the map itself stays out of `specs/`.
- Updated the `light-request` pointer to match.
- Verified: the skill and `light-request` name `brainstorms/`, and the old append-to-`00-request.md` instruction is gone from both.

## Task 2 — documentation
- Added `brainstorms/` to the core project knowledge: user-owned, not a request, never managed by the kit.
- Updated the README command description and the `docs/usage.md` brainstorming section with the file location, the round append and the request reference line.
- Verified: all three files mention `brainstorms/`.

## Task 3 — tests
- The test now checks the `brainstorms/<YYYY-MM-DD>-<slug>.md` path, the "write before replying" rule, the round append, and the absence of the old `00-request.md` instruction in both skills.
- It checks the installed `.light-kit/templates/brainstorm.md` sections and the `brainstorms/` guidance in `CLAUDE.md`.
- Verified: `node --test tests/kit.test.mjs` — 22 tests pass.

## Technical debt
None introduced by this change. The template's section names mirror the skill's output contract on purpose; the test pins both.

## Review rounds

### Round 1 of 1
- F-1.1 [should-fix] `kit/skills/light-brainstorm/SKILL.md:56`, `kit/templates/brainstorm.md` — the `## Round N` heading had no relationship to the map's own `##` sections, and a repeat idea had no way to find its earlier file — suggested fix: make each round a `## Round N — <date>` container with `###` map sections, and list `brainstorms/` to match the slug or title before writing — status: fixed (3939c60)
- F-1.2 [should-fix] `tests/kit.test.mjs:114,124` — the old-instruction check covered only one phrase, and the docs were not checked at all — suggested fix: check the old `## Brainstorm` and "lands under" wording in both skills, and read the repo `README.md` and `docs/usage.md` — status: fixed (3939c60)
- F-1.3 [nit] `kit/templates/brainstorm.md:33-39` — the options block had no field for the recommendation the skill requires — suggested fix: add `- Recommendation:` — status: fixed (3939c60)
- F-1.4 [nit] `kit/skills/light-brainstorm/SKILL.md:67` — the request reference line had no location and could be added twice — suggested fix: put it under `### References`, once — status: fixed (3939c60)
- F-1.5 [nit] `kit/skills/light-brainstorm/SKILL.md:56` — a cross-project file path was ambiguous when written into a project's request — suggested fix: record the path from the repository or workspace root — status: fixed (3939c60)

Verdict: changes requested by reviewer and tester; all findings fixed.

## Review fixes
- Reworked the template into labelled rounds with `###` sections and added the missing option recommendation field.
- The skill now sets the round shape, finds a matching file by slug or title, and places the request reference deliberately.
- The test checks the round shape, the skill's map labels, the old wording in both skills, and the repo docs.
- Verified after the fixes: `node --test tests/kit.test.mjs` 22/22; `npm test` 176/176.

