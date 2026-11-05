---
step: request
runs:
  - agent: light-orchestrator
    part: request capture and triage
    model: deepseek-flash
    thinking: unknown
    level: easy
usage:
  tokens: 37,096 input · 686,848 cache read · 0 cache write · 19,953 output · 743,897 total
  time: 13m 54s
---

# Request 030 — Keep the tool log before a request folder exists

Date: 2026-11-05
Requested by: the user

## Original request
> the tool-log.md is not correct for all tool call log before creating specs/<NNN-slug> folder. Before this folder, tool-log.md must live in specs folder, then when the NNN-slug folder is created, tool-log.md will be moved to this folder

## Conversation context
| # | User turn | What it established |
|---|---|---|
| 1 | The message above | Calls made before a request folder exists are lost, and the log that a request folder does get does not cover the whole session. The shared `specs/tool-log.md` must collect those calls, then move into `specs/<NNN-slug>/tool-log.md` when the request folder is created. |

### Decisions
- The shared log lives at `specs/tool-log.md` in the project scope, not one folder per day.

### Constraints and preferences
- Keep the existing row format, redaction, truncation, self-write skip and `off` switch.
- No new hook id or config key.

### References
- `kit/hooks/checks/tool-log.mjs`, `specs/028-tool-log-per-request/40-plan.md`

### Still open
None.
