---
step: request
runs:
  - agent: light-orchestrator
    part: request capture and triage
    model: deepseek-flash[1m]
    thinking: unknown
    level: medium
usage:
  tokens: 49,345 input · 621,312 cache read · 0 cache write · 15,039 output · 685,696 total
  time: 5m 33s
---

# Request 038 — Commit the remaining tool log when the agent stops

Date: 2026-11-22
Requested by: the user

## Original request
> There are usually tool-log in specs folder didn't commited. tool-log before folder specs/<NNN-slug>/ will be in specs folder. after the creation of specs/<NNN-slug>/, tool-log must be moved to this folder. then when agent is finished (Stop hook), the remained tool-log must be commited

## Conversation context
| # | User turn | What it established |
|---|---|---|
| 1 | The message above | A tool call log is often left uncommitted in `specs/`. The lifecycle must be: `specs/tool-log.md` before a request folder exists, moved into `specs/<NNN-slug>/` once it is created (already built in request 030), and whatever log remains must be committed when the agent stops. |

### Decisions
- Fix the gap with the Stop hook, not with an instruction to the agent: the agent forgets, the hook does not.
- Commit only `tool-log.md` files, never other work in progress.
- No new hook id or config key: the existing `tool-log` switch controls both logging and the stop commit.

### Constraints and preferences
- Keep the current row format, redaction, self-write skip and `off` switch.
- Never commit on a protected branch; never push.
- Commit message stays the existing `chore(spec): record tool-call logs`.

### References
- `kit/hooks/checks/tool-log.mjs`, `kit/hooks/lib/git.mjs`, `kit/hooks/run.mjs`
- `specs/030-tool-log-before-request/` (shared log and move)
- `specs/028-tool-log-per-request/` (one log per request)

### Still open
None.
