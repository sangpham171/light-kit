---
step: plan
runs:
  - agent: light-orchestrator
    part: plan
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 5,772 input · 1,101,824 cache read · 0 cache write · 18,467 output · 1,126,063 total
  time: 1m 54s
---

# Plan — request 052

## Task 1 — Standalone version-bump script
Create `tools/version-bump.mjs`:
- exports `bumpVersion`, `readStatus`, `collect` and `runVersionBump` for tests;
- CLI entry (`--dry-run`) resolves the repository from the script location;
- pure Node built-ins, silent, exit 0 on any error;
- guard: only acts when `package.json.name === "light-kit"`.

**Acceptance:** `node tools/version-bump.mjs --dry-run` prints the planned bump or nothing, exit 0.

## Task 2 — State and project configuration
Create `.light-kit/version-bump.json` with `version: 1`, `baseline: 51`, `commit: true`, `applied: {}`.
Add the version convention and the hook's behaviour to `.light-kit/project-profile.md`.

**Acceptance:** the script reads baseline 51 and leaves the 51 existing requests alone.

## Task 3 — Tests
Add `tests/version-bump.test.mjs` (Node test runner, temp directories):
- semver arithmetic for all three levels and reset rules;
- done vs in-progress, baseline, invalid level, missing front matter;
- apply twice → one bump; repeat stop does nothing;
- package.json rewrite keeps valid JSON and the version string.

**Acceptance:** `node --test tests/version-bump.test.mjs` passes; `npm test` passes.

## Task 4 — Verification and registration instructions
Run the script against a temp copy of the repo to prove 051 → no change, 052 done → one bump; then
give the user the exact `.claude/settings.json` `Stop` block (the agent may not edit that file).
Record the registration in `50-implementation.md` and the conclusion.

**Acceptance:** the temp copy ends at the expected version; the settings block is ready to paste.
