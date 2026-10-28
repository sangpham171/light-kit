---
step: conclusion
runs:
  - agent: light-tech-writer
    model: deepseek/deepseek-flash
    thinking: high
    level: medium
usage:
  - step: 00-request
    tokens: 1,902,971 input · 0 cache read · 0 cache write · 12,512 output · 1,915,483 total
    time: 1m 57s
  - step: 10-understanding
    tokens: 86,340 input · 0 cache read · 0 cache write · 402 output · 86,742 total
    time: 3s
  - step: 20-discovery
    tokens: 7,160,797 input · 0 cache read · 0 cache write · 35,046 output · 7,195,843 total
    time: 6m 3s
  - step: 40-plan
    tokens: 0 input · 0 cache read · 0 cache write · 0 output · 0 total
    time: 0s
  - step: 50-implementation
    tokens: 1,047,258 input · 0 cache read · 0 cache write · 4,871 output · 1,052,129 total
    time: 57s
  - step: 60-conclusion
    tokens: 0 input · 0 cache read · 0 cache write · 0 output · 0 total
    time: 0s
  - step: total
    tokens: 10,197,366 input · 0 cache read · 0 cache write · 52,831 output · 10,250,197 total
    time: 9m 1s
---

# Conclusion

## What changed
The ten `light-*` commands are skills now — one `SKILL.md` each, same names, one standard format and one
standard folder per client. `kit/prompts/` is gone, and with it the per-client command file, its argument
syntax (`$ARGUMENTS`, `${input:request}`) and Copilot's extra install location in the VS Code profile.

| | Before | After |
|---|---|---|
| Formats | 4 (Claude command, Copilot prompt, Cursor command, Codex prompt) | 1 (`SKILL.md`) |
| Client folders | 6, two of them holding the same content | 4, the ones that already hold skills |
| Manual steps | copy `.codex/prompts/*` | none |

The installer removes the command files earlier versions wrote — from `.claude/commands`, `.github/prompts`,
`.cursor/commands`, `.codex/prompts`, `~/.copilot/prompts` and every VS Code profile prompt folder — and only
files carrying the light-kit marker, so a user's own commands survive. The audit treats the skills named in the
Commands section as entry points, so they are not reported as orphans.

## Verification
- `npm test`: 150 passed, 0 failed.
- `node kit/audit/audit.mjs --source kit`: 23 skills, no unreferenced component, no stale reference.
- Install into a temporary folder for all four clients: 202 files, no `commands/` or `prompts/` folder.
- Upgrade simulation in the tests: old marker command files removed, the user's own command kept.

## Deferred
- Removing `vscodePromptDirs` and the `.github/prompts` detection hint once no install predates this change.
- Nothing checks that an entry-point skill description contains wording a model will match on.

## For the user
Clients that list skills by name still offer every `light-*` entry point; clients that only list prompt files
no longer have a palette entry, and there the work starts by asking in words (“run light-init”, “start a request
to …”). If that trade is not wanted for a particular client, a thin prompt file pointing at the skill is the
fallback — say which client.
