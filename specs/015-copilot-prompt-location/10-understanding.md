---
runs:
  - step: understand
    agent: light-orchestrator
    model: deepseek-v4-flash
    thinking: unknown
    level: medium
---

# Understanding

## Restatement
A user-level Copilot install must put the kit's prompt files where VS Code looks for user prompt files, so `/light-*` appears in Copilot Chat without a project-level install.

## Root cause (verified)
`tools/build.mjs` — `USER_PATHS.copilot` maps `.github/prompts/` to `.copilot/prompts/`. VS Code reads user prompt files from its profile storage, not from `~/.copilot/prompts`, so the files are never discovered.

## Target locations (verified)
- macOS: `~/Library/Application Support/<edition>/User/prompts`
- Linux: `~/.config/<edition>/User/prompts`
- Windows: `%APPDATA%\<edition>\User\prompts`
- per profile: `<User Data>/profiles/<name>/prompts`
- editions: `Code`, `Code - Insiders`, `VSCodium`, `VSCodium - Insiders`

## Requirements
1. User-level Copilot prompt files land in the VS Code profile prompts folder(s) found on the machine, plus every non-builtin profile.
2. Nothing is written to `~/.copilot/prompts`; prompt files an earlier kit version left there are removed (marked ones only).
3. `uninstall --level user` removes the same files.
4. Tests and docs describe the new location; no claim that `/light-*` needs a project install.

## Out of scope
- Cursor and Codex user-level paths (unchanged).
- VS Code settings (`chat.promptFilesLocations`): not needed once the canonical folder is used.

## Triage
Scores: scope 2, ambiguity 0, risk 1, novelty 1, impact 0 (total 4)
Workflow: standard

## Routing
- understand: easy
- discover, plan: medium
- implement: medium
- verify-and-review: medium
- conclude: easy

## Token usage
Tokens: unknown
Time: unknown
