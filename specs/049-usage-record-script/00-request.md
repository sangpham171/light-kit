---
step: request
runs:
  - agent: light-orchestrator
    part: request capture
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 3,784 input · 940,160 cache read · 0 cache write · 6,615 output · 950,559 total
  time: 2m 30s
---

# Request 049 — Record each agent and skill use explicitly

Date: 2026-11-22
Requested by: the user

## Original request
> it seems the agent-skill-usage is based on session storage. i want everytime an agent or a skill is invoked, there is a script or and instruction to update the agent-skill-usage file

## Conversation context
| # | User turn | What it established |
|---|---|---|
| 1 | The sentence above. | Recording must happen at the moment an agent or skill is used, through a script or an instruction — not only by deriving history from session storage. |

### Decisions
- Keep the `agent-skill-usage` hook for tool-mediated calls: it already writes the file at the moment a client reports an `Agent`/`Task`/`Skill` call, not from session storage.
- Add an installed script `.light-kit/hooks/record-usage.mjs` and an always-loaded instruction so an agent records a use the hook cannot see — a skill applied by reading its file, or a step performed under an agent role without calling the agent tool.
- The script shares the hook's stats library, so both paths write the same JSON and the same rendered table. An optional `--id` lets a caller dedupe against a tool-call id already recorded by the hook.

### Constraints and preferences
- One use is counted once: the instruction calls the script only when the client made no agent or skill tool call.
- The update is immediate, in the request the session is working on.

### References
- `kit/hooks/checks/agent-skill-usage.mjs`, `kit/hooks/lib/usage-stats.mjs`
- `kit/hooks/lib/specs.mjs` (working request)
- `kit/instructions/core.md` (Roles)

### Still open
- None.
