---
runs:
  - step: understand
    agent: light-orchestrator
    model: deepseek-v4-flash
    thinking: unknown
    level: easy
---

# Understanding

## Restatement
A user-level Copilot install must also place the kit's prompt files, so the `/light-*` commands exist for the Copilot CLI home the user actually has (`~/.copilot`).

## Root cause (verified)
`tools/build.mjs:225` — `USER_PATHS.copilot` returns `null` for any `.github/prompts/` path, so `build()` drops every prompt at user level (`tools/build.mjs:312` filters `!f.path`). The other copilot folders are remapped to `.copilot/<dir>/`.

## Requirements
1. `install --level user --clients copilot` writes `.copilot/prompts/<name>.prompt.md`, marked as generated, with the Copilot input placeholder.
2. `uninstall --level user` removes them through the same `USER_PATHS` mapping.
3. Docs and the installer note no longer claim prompt files are absent at user level.
4. A test asserts the user-level layout.

## Out of scope
- VS Code's user prompt folder (profile-specific, outside the client folder the kit controls); a project-level install keeps giving `/light-*` in Chat.

## Triage
Scores: scope 1, ambiguity 0, risk 0, novelty 0, impact 0 (total 1)
Workflow: direct
Why: one path mapping plus the docs and tests that describe it.

## Routing
- understand: easy
- implement: easy
- review-and-conclude: easy

## Token usage
Tokens: unknown
Time: unknown
