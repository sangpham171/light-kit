---
runs:
  - step: request
    agent: light-orchestrator
    model: deepseek-v4-flash
    thinking: unknown
    level: medium
---

# Request 015 — Copilot user prompts are not detected by VS Code

Date: 2026-10-27
Requested by: light
Branch: `fix/015-copilot-prompt-location` from `2a9b365` (`fix/014-copilot-user-prompts`)

## Original request
the prompts in /Users/light/.copilot/prompts can not be detected by github copilot. Fix it

## Observed
A user-level install writes the kit's `/light-*` prompts to `~/.copilot/prompts`, but VS Code does not read prompt files there:
- prompt files run only in the Local harness, from `.github/prompts` (workspace) or the VS Code profile storage (`<User Data>/prompts`, per profile) — code.visualstudio.com/docs/copilot/customization/prompt-files
- `~/.copilot` is the user folder of the Copilot harness for agents (`agents/`) and skills (`skills/`) only

So the ten prompt files at `~/.copilot/prompts` are invisible in Copilot Chat, and no `/light-*` command appears.

## Token usage
Tokens: unknown
Time: unknown
