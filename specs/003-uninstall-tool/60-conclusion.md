---
runs:
  - step: conclude | agent: light-tech-writer | model: deepseek-flash[1m] | thinking: unknown | level: easy
---

# Conclusion

## Summary
`tools/uninstall.mjs` reverses an install. Soft is the default and removes only what the kit generated, keeping the user's profile, settings, models and `specs/`. Hard also deletes the kit's own folders, with a confirmation step.

## What changed
Range: `d3a882515e8f035006b8137a03a6e76f7fb8dee2..HEAD` on `feat/003-uninstall-tool`
- `tools/uninstall.mjs` — soft/hard removal for client files, instruction blocks, hook registrations, kit seeds and folders; dry run, idempotency and path guards.
- `tools/install.mjs` — exports `findObsolete` for reuse; no install change.
- `tests/uninstall.test.mjs` — 8 tests across both modes, user and workspace levels, the CLI confirmation and unmanaged files.
- `README.md`, `docs/installation.md`, `docs/development.md`, `package.json` — usage, mode comparison and the `uninstall-kit` script.
- `specs/003-uninstall-tool/` — request trail.

## Verification evidence
- `npm test`: 100 tests, 100 pass (8 new).
- Soft: generated files gone; `specs/`, profile, hooks config, models and the codebase map/assessment kept; user text and user hook entries intact.
- Hard: `.light-kit/` and `specs/` gone, user files outside those folders intact; refuses without `--yes` when non-interactive.
- Dry run and a second run report no removals.

## Deferred technical debt and open findings
- TD-1: level/client resolution is duplicated between the install and uninstall CLIs. Deferred; both paths are tested.

## Follow-ups
None. The tool runs from the repository (`node tools/uninstall.mjs`); it is not copied into projects by the installer.
