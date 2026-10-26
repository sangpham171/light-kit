---
runs:
  - step: plan
    agent: light-tech-lead
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
---

# Plan

## T1 — Removal primitives in install.mjs
Files: `tools/install.mjs`.
- Export `findObsolete` for reuse.
- No behavior change to install.

Acceptance: `npm test` still passes.

## T2 — Uninstall tool
Files: `tools/uninstall.mjs`.
- `uninstall(target, clients, { level, projects, hard, dryRun })` returns `{ removed, kept, skipped }`.
- Rebuild the install file list and remove by shape (managed / block / hooks / seed / config).
- Sweep obsolete managed files, prune empty folders, keep unmanaged files.
- Hard: remove `.light-kit/` and `specs/` at the level's roots after the file pass; guard every path inside the target.
- CLI: `--soft` (default), `--hard`, `--yes`, `--dry-run`, `--level`, `--clients`, `--projects`; resolve saved config, detect level and clients like install; hard asks for confirmation when interactive and refuses without `--yes` otherwise.

Acceptance: `node tools/uninstall.mjs <tmp> --soft|--hard` behaves per the mode table; dry run changes nothing.

## T3 — Tests
Files: `tests/uninstall.test.mjs`.
- Soft: generated files gone; `specs/`, profile, hooks config, models, init files kept; user text and user hooks kept.
- Hard: `.light-kit/` and `specs/` gone; unmanaged user file survives.
- Dry run, idempotency, user level, hard CLI confirmation.

Acceptance: `node --test tests/uninstall.test.mjs` passes; `npm test` passes.

## T4 — Docs and script
Files: `README.md`, `docs/installation.md`, `docs/development.md`, `package.json`.
- Document both modes, what each keeps and deletes, `--yes` for hard, and the safety rule (unmanaged files never deleted).
- Add `uninstall-kit` script and the layout row.

Acceptance: no doc claim contradicts the tests.
