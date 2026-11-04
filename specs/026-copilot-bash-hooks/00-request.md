---
step: request
runs:
  - agent: light-orchestrator
    model: deepseek-flash
    thinking: unknown
    level: easy
usage:
  tokens: 49,245 input · 1,212,288 cache read · 0 cache write · 6,904 output · 1,268,437 total
  time: 7m
---

# Request 026 — Give Copilot CLI hooks an explicit bash command

Date: 2026-11-04
Requested by: light

## Original request
update hooks to add bash as command for copilot cli

## Conversation context
| # | User turn | What it established |
|---|---|---|
| 1 | (the original request above; no earlier turn in this session) | Copilot CLI hooks must name the Unix command in `bash`, not rely only on the cross-platform `command` fallback. |

### Decisions
- Add `bash` next to `command` in generated Copilot hook entries — the CLI honors `bash` explicitly and keeps `command` as the Windows fallback; rejected: replacing `command`, which would drop the cross-platform fallback.
- Scope is Copilot CLI only — the other clients have their own verified formats.

### Constraints and preferences
- No new dependency; keep the generated-client behavior.

### References
- `tools/build.mjs` (`hookRegistration`), `tests/hooks.test.mjs` (registration test).
- GitHub Copilot hooks reference: command hooks accept `bash`, `powershell` and `command`.
