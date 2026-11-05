---
step: understand
runs:
  - agent: light-orchestrator
    model: deepseek-flash
    thinking: unknown
    level: easy
usage:
  tokens: 0 input · 0 cache read · 0 cache write · 0 output · 0 total
  time: 0s
---

# Understanding

## Goal
Each request folder carries its own tool log: `specs/<NNN-slug>/tool-log.md`.

## Scope
- `tool-log` writes into the active request found in the project scope, else the workspace root.
- Active = `00-request.md` and `10-understanding.md` exist and `state` is not `done`; preference for step `implement`, `fix` or `review`, then the newest folder.
- Rows, header, redaction, truncation and the self-write skip stay as they are.
- No active request: nothing is written.

## Out of scope
- A log at the `specs/` root or split by date.
- Migrating existing `specs/tool-log.md` files (none are generated here; a project can delete its own).
- Logging during the `request` step, before `10-understanding.md` exists.

## Acceptance criteria
- A post-tool call writes `specs/001-x/tool-log.md`, not `specs/tool-log.md`.
- With an active and a done request, only the active one gets rows.
- No active request: no file, no output.
- Writing the request's own `tool-log.md` is not logged; `off` still disables the hook.
- Docs and tests match the new path.
