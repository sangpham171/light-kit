---
step: request
runs:
  - agent: light-orchestrator
    part: request capture
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 48,240 input · 421,888 cache read · 0 cache write · 6,830 output · 476,958 total
  time: 1m 31s
---

# Request 051 — Agent and skill usage in each request folder

Date: 2026-11-22
Requested by: the user

## Original request
> i also want to store agent-skill-usage in each specs

## Conversation context
One-message request. "Also" makes it additive: the project-level stats stay, and each request folder
gets its own copy of the usage it caused.

### Decisions
- Keep `.light-kit/agent-skill-usage.json` and `.md` as the aggregate source of truth; write the
  same data for the request into `specs/<NNN-slug>/agent-skill-usage.json` and `.md` — one table
  per request is what the user asked for, and the aggregate still answers "which agents and skills
  ran in this project".
- Same file names and table format in both places — one renderer and one reader, no second format
  to keep in sync.
- The per-request file holds that request's row only, rendered by the existing table renderer.

### Constraints and preferences
- Additive, not a move: existing tooling and docs that read `.light-kit/agent-skill-usage.*` keep
  working.
- `(no request)` calls have no spec folder; they stay in the aggregate only.

### Still open
- None.
