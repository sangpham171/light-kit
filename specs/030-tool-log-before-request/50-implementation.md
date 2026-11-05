---
step: implement
runs:
  - agent: light-developer
    part: hook, tests and live verification
    model: deepseek-flash
    thinking: unknown
    level: easy
usage:
  tokens: 11,481 input · 2,620,288 cache read · 0 cache write · 28,086 output · 2,659,855 total
  time: 18m 35s
---

# Implementation

## Changes
- `kit/hooks/checks/tool-log.mjs`: the log starts at `specs/tool-log.md`; a call that writes inside
  `specs/<NNN-slug>/` targets that folder and moves the shared rows in (rename, or append-and-delete
  when the request log already exists). Without a folder write, rows go to the active request, else
  to the shared log. Statusless and finished folders are ignored; an unmanaged user-level project
  gets no `specs/` folder.
- `tests/hooks.test.mjs`: shared log, move on creation, merge, statusless leftover, unmanaged
  project, redaction, active/done selection and self-write skip.
- Docs: `kit/hooks/README.md`, `docs/safety-hooks.md`, `specs/README.md`.

## Decisions
- A folder is a log target when the current call writes into it, so the creating call itself moves
  the shared log; no extra marker or state file is needed.
- `status.md` is required for the active-request path, so a leftover folder (the old 015/016 logs)
  cannot capture a new session's rows.
- Calls made between folder creation and `10-understanding.md` go to the shared log again and are
  merged on the next write inside the folder; nothing is lost.

## Verification
- `node --test tests/hooks.test.mjs`: 59 passed.
- `npm test`: 163 passed (includes the kit lint).
- Live check: reinstalled the user-level kit (`node tools/install.mjs ~ --clients copilot`); the next
  call moved `specs/tool-log.md` into `specs/030-tool-log-before-request/tool-log.md`, and later
  rows kept going there.

## Review
Direct workflow, self-review: the row format, redaction and truncation are unchanged; the move is a
rename when the request log does not exist and a row merge otherwise; no new dependency or config
key. No blocker found.

## Deviations
None. A request folder created by a bare shell `mkdir` (no file write) is not detected; the kit
creates folders with a file write.
