---
step: request
runs:
  - agent: light-orchestrator
    model: deepseek-flash
    thinking: unknown
    level: easy
usage:
  tokens: 3,518 input · 532,992 cache read · 0 cache write · 4,304 output · 540,814 total
  time: 2m 56s
---

# Request 028 — Put the tool log inside the active request folder

Date: 2026-11-05
Requested by: light

## Original request
i want each specs tool-log.md live in specs/<NNN-slug> folder

## Conversation context
| # | User turn | What it established |
|---|---|---|
| 1 | `add a post tool use to log all tools call in a new file in specs` (request 027) | A `post-tool` hook logs every tool call in `specs/tool-log.md`. |
| 2 | `i want each specs tool-log.md live in specs/<NNN-slug> folder` | The log belongs to a request, not to the `specs/` root: one `tool-log.md` per request folder. |

### Decisions
- Write to `specs/<NNN-slug>/tool-log.md` of the active request, chosen like `capture-discussion` already chooses it: prefer a request at step `implement`, `fix` or `review`, then the most recently modified folder.
- No active request, no file: the hook never invents a request folder and never writes to the `specs/` root.
- Share the selection rule: move the "current request" helper from `capture-discussion` into `kit/hooks/lib/specs.mjs` so both hooks pick the same request.

### Constraints and preferences
- Keep the hook silent and non-blocking; no new dependency.
- Rows keep the same shape (time, client, tool, kind, target, redacted/truncated) and never store tool output.

### References
- `kit/hooks/checks/tool-log.mjs` (current single file), `kit/hooks/checks/capture-discussion.mjs` (`current()` selection).
- `kit/hooks/lib/specs.mjs` (`activeRequests`, `listRequests`).
