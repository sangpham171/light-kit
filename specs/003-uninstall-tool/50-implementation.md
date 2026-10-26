---
runs:
  - step: implement
    agent: light-developer
    model: deepseek-flash[1m]
    thinking: unknown
    level: medium
  - step: verify-and-review
    agent: light-reviewer
    model: deepseek-flash[1m]
    thinking: unknown
    level: medium
---

# Implementation log

## Progress
- T1 — `b3f8cb0` feat(tools): add soft and hard uninstall (`tools/install.mjs`: export `findObsolete`).
- T2 — `b3f8cb0` — `tools/uninstall.mjs`, `package.json` script.
- T3 — `d7b4a80` test(tools): cover soft and hard uninstall (`tests/uninstall.test.mjs`, 8 tests).
- T4 — `0fa296d` docs: describe uninstalling the kit (`README.md`, `docs/installation.md`, `docs/development.md`).

## Decisions and deviations
- Soft keeps `specs/`, the profile, `hooks.config.json`, `models.json`, `projects.md` and the init knowledge files; hard removes `.light-kit/` and `specs/` (and every registered workspace project's copies). Hard requires `--yes` when there is no terminal.
- Unmanaged files at kit paths are reported and left alone in both modes; the hard mode's folder deletion is limited to kit folders inside the target.
- `.light-kit/audit` and `.light-kit/templates` are kit-owned trees with no user content, so soft removes them whole rather than file by file; this also removes copies left by older kit versions. Workflows, profiles and hooks stay marker-based so a user-added file survives.
- Invalid JSON in a client hook file is reported and left alone, matching the installer.
- The `attribution` defaults the installer adds to `.claude/settings.json` are left in place: they cannot be told apart from a value the user set, and removing them would silently re-enable AI attribution.
- CLI input resolution duplicates the installer's small level/client block instead of extracting it (TD-1).

## Technical debt
- TD-1 `tools/install.mjs`, `tools/uninstall.mjs` — the CLI scope resolution (level, clients, projects, saved config) is duplicated; a change in one can drift from the other — status: deferred (extraction would couple two CLIs that differ in client fallback and reporting; both paths are covered by tests, so drift shows up as a failing test).

## Verification (commands run and results)
- `node --test tests/uninstall.test.mjs` — 8 tests, 8 pass (soft, hard, dry run, idempotency, unmanaged files, user level, workspace hard, CLI confirmation).
- `npm test` — 100 tests, 100 pass (the previous 92 plus 8 new).
- Manual CLI check: install for four clients, soft uninstall removed 201 generated paths and kept the profile, hooks config, models and `CLAUDE.md`; then `--hard --dry-run` listed `.light-kit/` only.

## Review rounds
Round 1 of 1 (self-review).
- F-1.1 [should-fix] `tools/uninstall.mjs` — soft-mode file-by-file removal missed non-marker template and audit copies from older kit versions — those kit-owned trees are now removed whole — status: fixed.
- F-1.2 [nit] `tools/install.mjs`, `tools/uninstall.mjs` — duplicated scope resolution — recorded as TD-1 — status: deferred.
- F-1.3 [nit] `tools/uninstall.mjs` — installer-set `attribution` defaults remain in `.claude/settings.json` — accepted (cannot distinguish from the user's own value) — status: declined.
Verdict: approve.

## Open follow-ups
None.
