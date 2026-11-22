---
step: 00-request
runs:
  - agent: light-orchestrator
    part: request capture
    model: deepseek-flash[1m]
    thinking: unknown
    level: medium
usage:
  tokens: 95,232 input · 1,818,624 cache read · 0 cache write · 30,982 output · 1,944,838 total
  time: 6m 58s
---

# Request 053 — usage records reconcile with the work that ran

Date: 2026-11-22

## Original request

- the light-developer agent is used in /Users/light/Documents/code/ai-it-team/specs/095-generated-app-section-layout, the /Users/light/Documents/code/ai-it-team/.light-kit/agent-skill-usage.json doesn't store the agent
- the problem maybe larger than light-developer agent. it can be for others agents and skills
- Inspect and fix it

## Conversation context

| # | User turn | What it established |
|---|---|---|
| 1 | the three bullets above | The `agent-skill-usage` state misses a run the request's own artifact credits; the same omission may affect any agent or skill; inspect the mechanism and fix the class, not only the one row. |

### Decisions

- Treat the artifact `runs:` headers as a second, deterministic source of agent counts, because they are the kit's own record of which agent did each step.
- Reconcile per agent with a floor (`max(recorded, header runs)`), so a tool call or a manual record already counted is never counted twice.
- Attribute an agent or skill call to the request its input names (`specs/<slug>`) before falling back to the most recently touched active request, because 095's reviewer call was recorded under 083 and manually moved.
- Count a skill applied by reading its installed `SKILL.md`, since that is the path the instructions describe when no `Skill` tool call happens.
- `version_bump: minor` — new automatic behavior, existing state and commands stay valid.

### Constraints and preferences

- Hooks stay silent, best-effort and never blocking.
- A project without `.light-kit` still gets nothing written.
- `hooks.agent-skill-usage: "off"` must switch off every writer, including reconciliation.
- No new dependency; keep the `usage-stats.mjs` JSON schema compatible.

### References

- `kit/hooks/checks/agent-skill-usage.mjs`, `kit/hooks/lib/usage-stats.mjs`, `kit/hooks/record-usage.mjs`
- `kit/hooks/checks/artifact-header.mjs` (existing `runs:` parser)
- `specs/042-agent-skill-usage`, `specs/048-usage-history`, `specs/049-usage-record-script`, `specs/051-agent-skill-usage-per-spec`
- `/Users/light/Documents/code/ai-it-team/specs/095-generated-app-section-layout/50-implementation.md` (`agent: light-developer`) and `.light-kit/agent-skill-usage.json` (no `light-developer` row)
- Claude Code transcript `3637b17b-202e-49aa-8084-ceb153cade52.jsonl`: no `Agent` call for light-developer; only light-reviewer was a tool call, and it was initially written under `083-component-selector-ui`.

### Still open

- None. The historical 095 row is repaired explicitly; older projects get reconciliation after the kit is reinstalled.
