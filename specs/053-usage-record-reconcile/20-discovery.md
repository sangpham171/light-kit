---
step: 20-discovery
runs:
  - agent: light-tech-lead
    part: mechanism inspection and constraints
    model: deepseek-flash[1m]
    thinking: unknown
    level: medium
usage:
  tokens: 1,948 input · 380,672 cache read · 0 cache write · 1,716 output · 384,336 total
  time: 11s
---

# Discovery

## Current mechanism

| Piece | Behavior |
|---|---|
| `kit/hooks/checks/agent-skill-usage.mjs` | On `post-tool`, `callOf` reads `Agent`/`Task`/`Subagent` or `Skill` and records one count under `currentRequest`. Writes the aggregate pair and the request's copy. |
| `kit/hooks/lib/usage-stats.mjs` | Repairs each request row (R-002), dedupes call ids in `recent`, renders the table, writes request copies. Version 1 schema. |
| `kit/hooks/record-usage.mjs` | Manual recorder for uses with no tool call. Shares `usage-stats.mjs` and honors the off switch. |
| `kit/hooks/lib/specs.mjs` | `currentRequest` prefers step `implement`/`fix`/`review`, then the most recently modified folder. |
| `kit/hooks/checks/artifact-header.mjs` | Already parses `runs:` entries for validation; split on `\nusage:` so conclusion step rows are not runs. |

## Why the reported run was missed

The 095 session ran the implementation inline. No `Agent` tool call existed, and the orchestrator
recorded the other roles by hand but omitted `light-developer`. The artifact header is the only
surviving record of that run, and no code reads it for usage.

## Why the reviewer landed on 083

`currentRequest` sorts by folder mtime. The reviewer call's prompt named
`specs/095-generated-app-section-layout`, but the hook never reads the input text. The session moved
the row manually afterwards.

## Constraints

- Hooks are silent and fail open; a parse or write error must never block a tool.
- State file compatibility: version stays 1; `recent`, `requests`, `agents`, `skills` unchanged.
- The off switch (`hooks.agent-skill-usage: off`) is applied by `run.mjs`; any writer added must sit
  inside that check.
- User-level installs must leave a project without `.light-kit` untouched.
- No new dependency; tests use `node:test` and `install()`.

## Design direction

1. Extract the header parser to `kit/hooks/lib/runs.mjs`, shared by `artifact-header` and the usage hook.
2. Add `reconcileAgents(stats, request, runs, at)`: raise each agent's count to the number of header
   runs. Never lower a count, so tool calls and manual records cannot make a double count.
3. On `post-tool`: after recording a call, reconcile the request the call names (or the request the
   written artifact belongs to). Attribute a call by the first `specs/<slug>` in its input that is an
   active request; fall back to `currentRequest`.
4. Count a skill when the tool reads an installed `.<client>/skills/light-*/SKILL.md`; ignore the kit
   source layout.
5. On `stop`: reconcile every project home whose stats row exists or whose request is still active;
   write only changed files and only each changed request's copy.
6. Tests for each acceptance item, including the negative cases (kit source skill, off switch,
   header already covered by a call).
7. Update `kit/hooks/README.md` and `kit/instructions/core.md` so the manual command is described as
   the remaining gap, not the only path.

## Risks

- Stop-time reads grow with the number of tracked requests; only tracked or active requests are read,
  and parsing stops at the header.
- Attribution by named spec could pick a request named only as a reference; the search accepts only
  active requests and prefers the most frequently named one.
