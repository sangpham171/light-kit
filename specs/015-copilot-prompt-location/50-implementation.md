---
runs:
  - step: implement
    agent: light-developer
    model: deepseek-v4-flash
    thinking: unknown
    level: medium
  - step: verify-and-review
    agent: light-tester
    model: deepseek-v4-flash
    thinking: unknown
    level: medium
  - step: verify-and-review
    agent: light-reviewer
    model: deepseek-v4-flash
    thinking: unknown
    level: medium
---

# Implementation log

## Progress
- `tools/build.mjs` — added `vscodeUserDir()` and `vscodePromptDirs(home)`: the prompt folder of every VS Code edition (`Code`, `Code - Insiders`, `VSCodium`, `VSCodium - Insiders`) found under the home folder, plus each profile under `profiles/` (excluding `builtin`), with the stable `Code` default when none is found. `USER_PATHS` now returns a list of paths and takes the home folder; Copilot prompts map there instead of `.copilot/prompts`. `build()` takes `home` (default `homedir()`) and expands one generated file into several user paths.
- `tools/install.mjs` — passes `home: target` so the paths match the folder being installed into; `findObsolete()` accepts extra roots; a user-level Copilot install sweeps marked prompt files out of the old `.copilot/prompts` folder.
- `tools/uninstall.mjs` — passes the same `home` and sweeps the old prompt folder too.
- `tests/workspace.test.mjs` — user-level layout test creates a VS Code user folder plus a `work` profile, asserts prompts in both prompt folders, asserts `.copilot/prompts` is not created, and a new test covers the fallback folder and the sweep (an unmarked prompt file is kept).
- `tests/uninstall.test.mjs` — user-level uninstall removes the prompt from the VS Code prompt folder.
- `docs/installation.md`, `README.md` — the limits paragraph, the generated-layout rows and the "after installing" row describe the VS Code prompt folders.

## Decisions and deviations
- Prompts go to VS Code's profile storage, not to the Copilot harness folder: VS Code does not read prompt files from `~/.copilot/prompts` (the visible symptom), and the Copilot harness has no prompt files at all.
- The home folder is passed into `build()` instead of read from `os.homedir()`: tests and `--level user <dir>` install into a given folder, so the paths must follow it.
- Every profile gets a copy rather than only the default one, because a profile switch otherwise hides the commands.
- Old files are swept only when they carry the light-kit marker; files the user put in `.copilot/prompts` stay.

## Technical debt
- None introduced.

## Verification (commands run and results)
- `npm test` — 122 tests, 122 pass.
- `node tools/install.mjs --level user` on this machine — 11 written, 10 old prompt files removed; `~/Library/Application Support/Code/User/prompts` now holds the 10 `light-*.prompt.md` files and `~/.copilot/prompts` is gone.

## Review rounds
Round 1 of 1 (self-review, tester + reviewer).
- F-1.1 [nit] `USER_NOTES.copilot` was a three-line note on one console line — shortened.
- F-1.2 [nit] `docs/installation.md` limits paragraph was one long sentence — split.
Verdict: approve.

## Token usage
Tokens: unknown
Time: unknown
