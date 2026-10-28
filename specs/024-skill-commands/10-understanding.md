---
step: understanding
runs:
  - agent: light-orchestrator
    model: deepseek/deepseek-flash
    thinking: high
    level: medium
usage:
  tokens: 0 input · 0 cache read · 0 cache write · 0 output · 0 total
  time: 0s
---

# Understanding

## Restatement
The kit ships 10 slash commands from `kit/prompts/`: each client needs its own folder, frontmatter and
argument syntax (`.claude/commands`, `.github/prompts` plus VS Code profile folders, `.cursor/commands`,
`.codex/prompts` copied by hand). Skills have one standard shape (`<name>/SKILL.md`) and a standard
location per client, which the kit already generates. So the commands should stop existing as a separate
concept: each one moves into a skill.

## Assumptions
- One skill per command, keeping the command name (`light-init`, `light-request`, ...), so users keep the
  same vocabulary and the instructions keep referring to the same ids.
- The two commands that already delegate to a skill (`light-triage`, `light-audit`) merge into those skills.
- Skills have no standard argument placeholder: bodies are rewritten client-agnostically ("the user's
  text", "the request folder named in the request"), and options (`--apply`, `--workflow`, `--review-turns`,
  item ids) are described as text the user may include.
- Generated prompt/command files from earlier versions are removed on upgrade, only when they carry the
  light-kit marker.

## Triage
Scores: scope 2, ambiguity 1, risk 1, novelty 1, impact 1 (total 6) → `standard`.

## Open questions
None blocking; each has a default taken from the project profile.
