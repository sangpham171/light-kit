---
runs:
  - step: implement
    agent: light-developer
    model: deepseek-v4-flash
    thinking: unknown
    level: easy
  - step: verify-and-review
    agent: light-reviewer
    model: deepseek-v4-flash
    thinking: unknown
    level: easy
---

# Implementation log

## Progress
- `tools/build.mjs` — `USER_PATHS.copilot` maps `.github/prompts/` to `.copilot/prompts/` instead of dropping it; `USER_NOTES.copilot` now says prompts are installed and that VS Code reads user prompts elsewhere.
- `docs/installation.md` — the user-level paragraph lists prompts, and the limits sentence keeps only Cursor; the generated-layout row lists `~/.copilot/{agents,prompts,skills,hooks}`.
- `README.md` — the user-level sentence no longer claims Copilot prompts are missing.
- `tests/workspace.test.mjs` — asserts `.copilot/prompts/light-request.prompt.md`, its `${input:request…}` placeholder and its generated marker; `.copilot/prompts` removed from the "must not be created" list.
- `tests/uninstall.test.mjs` — user-level install/uninstall with Copilot removes `.copilot/prompts`.

## Decisions and deviations
- Target is the client folder the kit owns (`.copilot/prompts`), not VS Code's profile folder: the profile path is per-profile and per-edition, and the user asked for the client folder. Documented in the installer note and docs.

## Technical debt
- None introduced.

## Verification (commands run and results)
- `npm test` — 121 tests, 121 pass.
- `node tools/install.mjs --level user` on the real home — 11 files written; `~/.copilot/prompts/light-*.prompt.md` now holds 10 prompts.

## Review rounds
Round 1 of 1 (self-review).
- F-1.1 [nit] docs/installation.md — the user-level paragraph still listed "agents, skills, commands, workflows and hooks" after adding prompts — fixed.
Verdict: approve.

## Token usage
Tokens: unknown
Time: unknown
