---
runs:
  - step: plan
    agent: light-tech-lead
    model: deepseek-v4-flash
    thinking: unknown
    level: medium
---

# Plan

- [ ] 1. Compute the VS Code prompt folders from the install home (editions + profiles, platform default as fallback) and map Copilot prompts there instead of `.copilot/prompts` — level: medium — files: `tools/build.mjs` — verify: `npm test` — commit: `fix(install): write copilot prompts to the vscode profile folder`
- [ ] 2. Pass the home folder through `build()` in install and uninstall, and sweep marked prompt files out of the old `.copilot/prompts` folder — level: medium — files: `tools/install.mjs`, `tools/uninstall.mjs` — verify: `npm test` — commit: `fix(install): clean up prompts left in .copilot/prompts`
- [ ] 3. Update the user-level tests to the new location, including a profile folder and the stale-file sweep — level: easy — files: `tests/workspace.test.mjs`, `tests/uninstall.test.mjs` — verify: `npm test` — commit: `test(install): assert the vscode prompt folder`
- [ ] 4. Update docs and the installer note — level: easy — files: `docs/installation.md`, `README.md` — verify: read-back — commit: `docs: state where user-level copilot prompts are installed`
- [ ] 5. Reinstall at user level on this machine so `/light-*` works in Chat — level: easy — verify: files present under `<User Data>/prompts` — commit: none (machine state)

Each task = one verified, coherent commit.

## Risks
- Detecting the editor per platform/edition is a heuristic; a machine with no VS Code folder falls back to the stable default, which is created on install.
- Writing into profile folders adds copies; they are marker files and are removed by uninstall like the others.

## Test strategy
Temp home folder: create `Library/Application Support/Code/User` (or the platform's path via the exported helper) and one profile; assert prompts land in both, that `.copilot/prompts` stays empty, that a stale marked file there is swept, and that uninstall removes the new files.

## Parallelisable tasks
None (same file for 1–2, tests depend on both).

## Token usage
Tokens: unknown
Time: unknown
