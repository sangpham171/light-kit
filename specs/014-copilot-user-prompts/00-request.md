---
runs:
  - step: request
    agent: light-orchestrator
    model: deepseek-v4-flash
    thinking: unknown
    level: easy
---

# Request 014 — Copilot prompts missing from a user-level install

Date: 2026-10-27
Requested by: light

## Original request
install doesn't add prompts in copilot folder /Users/light/.copilot. Fix it

## Observed
`node tools/install.mjs --level user` writes `.copilot/agents`, `.copilot/skills`, `.copilot/hooks` and `.copilot/copilot-instructions.md`, but leaves `~/.copilot/prompts/` empty.

## Token usage
Tokens: unknown
Time: unknown
