---
step: request
runs:
  - agent: light-orchestrator
    model: deepseek-flash
    thinking: unknown
    level: easy
usage:
  tokens: 42,058 input · 413,056 cache read · 0 cache write · 9,648 output · 464,762 total
  time: 7m 48s
---

# Request 027 — Log every tool call in a new file under `specs/`

Date: 2026-11-04
Requested by: light

## Original request
add a post tool use to log all tools call in a new file in specs

## Conversation context
| # | User turn | What it established |
|---|---|---|
| 1 | (the original request above; no earlier turn in this session) | A new `post-tool` hook must record every tool call in one new file under `specs/`. |

### Decisions
- One append-only file, `specs/tool-log.md` — the request says "a new file in specs", so the log is not split per request.
- A Markdown table (time, client, tool, kind, target), so the log is readable next to the other `specs/` documents; rejected: JSON lines, which duplicates the optional `audit-log` hook.
- The hook stays silent and writes only when the project has a `specs/` folder, so it never creates `specs/` in an unrelated repository.

### Constraints and preferences
- No new dependency; the hook must never block the agent (it returns no message).
- Secrets must not reach the log: commands are redacted, tool output is never stored.

### References
- `kit/hooks/checks/audit-log.mjs` (existing optional activity log), `kit/hooks/lib/secrets.mjs` (`redact`).
- `kit/hooks/README.md` (hook table), `docs/safety-hooks.md`.
