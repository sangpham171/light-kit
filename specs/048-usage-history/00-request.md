---
step: request
runs:
  - agent: light-orchestrator
    part: request capture
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 31,230 input · 2,781,568 cache read · 0 cache write · 28,756 output · 2,841,554 total
  time: 7m 51s
---

# Request 048 — Agent and skill usage history

Date: 2026-11-22
Requested by: the user

## Original request
> there is a problem with agent-skill-usage. For exemple, in this session, there are many others agents and skills were used, but not stored in this file

## Conversation context
| # | User turn | What it established |
|---|---|---|
| 1 | The sentence above. | The usage files must reflect the agents and skills that actually ran, not a partial record. |

### Decisions
- Diagnosis: the hook was installed at request 042 (14:56); every Agent/Skill call after that is recorded (4 of 4). The missing calls are earlier ones — requests 032–042, including 042's own reviewer — made before the hook existed. The client's session records still hold them.
- Fix: a repeatable import from the client's session records into the stats files, not an automatic hidden scan inside the hook. Reason: attribution needs a stable source, the import is auditable, and live recording already works.
- The stats still count tool-mediated calls (the `Agent`/`Task`/`Skill` tools). A skill applied by reading its file is not an invocation and is not counted. Reason: the artifact `runs:` headers already record the role a step was performed under.

### Constraints and preferences
- The existing file must gain the missing calls without double counting the 4 already stored.
- Every imported call should land on its own request, not all under `(no request)`.

### References
- `.light-kit/agent-skill-usage.json`
- `kit/hooks/checks/agent-skill-usage.mjs`, `kit/hooks/lib/usage-stats.mjs`
- Claude Code session records under `~/.claude/projects/`

### Still open
- None.
