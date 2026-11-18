---
step: request
runs:
  - agent: light-orchestrator
    part: request capture
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 2,645 input · 528,640 cache read · 0 cache write · 6,425 output · 537,710 total
  time: 3m 48s
---

# Request 035 — Brainstorm output file

Date: 2026-11-18
Requested by: the user

## Original request
> brainstorm must write into an md file, maybe not in specs folder but another folder

## Conversation context
This refines request 034, which added `light-brainstorm`.

| # | User turn | What it established |
|---|---|---|
| 1 | "add a brain storming agent or skills … explore the ideas of the user in multi direction…" | The brainstorming capability and its divergent method (request 034). |
| 2 | "brainstorm must write into an md file, maybe not in specs folder but another folder" | The idea map must be a durable Markdown file, stored outside `specs/`. |

### Decisions
- Store brainstorms in a top-level `brainstorms/` folder, one file per idea, dated and slugged — it is a user work product like `specs/`, but pre-request. Rejected: `.light-kit/` (hidden and owned by the kit, removed by a hard uninstall) and `docs/` (durable documentation, not exploratory logs).

### Constraints and preferences
- Every brainstorm must produce a file; the reply alone is not enough.
- The map should not be copied into `specs/`; a request may reference the file.

### References
- `kit/skills/light-brainstorm/SKILL.md`
- `specs/034-brainstorm-skill/60-conclusion.md`

### Still open
None — location and naming are decided.
