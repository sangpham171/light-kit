---
step: understand
runs:
  - agent: light-orchestrator
    part: understanding and triage
    model: deepseek-flash
    thinking: unknown
    level: easy
usage:
  tokens: 0 input · 0 cache read · 0 cache write · 0 output · 0 total
  time: 0s
---

# Understanding

## Goal
No tool call is lost: the hook keeps one log that starts at `specs/tool-log.md` and moves into the
request folder when that folder is created.

## Scope
- With no request folder being worked on, append to `specs/tool-log.md` in the project scope.
- A call that writes inside `specs/<NNN-slug>/` targets that request folder; before the first row,
  the shared `specs/tool-log.md` is moved into it (appended when both exist).
- Otherwise the active request keeps receiving rows as today.
- A request folder is only "active" for the log when it has a `status.md` that is not `done`, so a
  stale unfinished folder without status cannot capture a new session's rows.

## Out of scope
- Migrating existing logs from before this change.
- Detecting folder creation done by a shell `mkdir` without a file write.

## Acceptance criteria
- A few calls with no request folder write `specs/tool-log.md`.
- Creating `specs/001-x/00-request.md` moves that shared log to `specs/001-x/tool-log.md`; later rows go there.
- An active request still gets its rows; done and stale statusless folders do not.
- Writing either log itself adds no row; `off` writes nothing; commands are redacted.
- Docs and tests describe the new lifecycle.
