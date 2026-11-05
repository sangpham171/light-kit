---
step: discover
runs:
  - agent: light-tech-lead
    part: survey of the header rules, templates and hook
    model: deepseek-flash
    thinking: unknown
    level: medium
usage:
  tokens: 858 input · 66,560 cache read · 0 cache write · 1,545 output · 68,963 total
  time: 49s
---

# Discovery

## How the header is produced today
- `kit/instructions/core.md` rule 12 asks for one entry per agent run with `agent`, `model`, `thinking`, `level`; it never says which agent, so the session writing the file records itself.
- All seven templates in `kit/templates/` carry the same four fields; no field says which part of the artifact a run produced.
- `kit/hooks/checks/artifact-header.mjs` checks only that a `step:` line exists, that `runs:` exists and that at least one entry has `agent`, `model` and `thinking`. It never compares the agent with the step's owner, and it ignores extra fields such as `part:`.
- `kit/workflows/*.md` already names the owner of every step and the artifact it writes (`— agent: light-tech-lead — writes: 40-plan.md`), so the expected agent can be derived from the active request's `status.md` (`workflow:`) and the installed workflow file.
- Evidence of the defect: every request artifact in `specs/` credits `light-orchestrator` (59 entries), including `028-tool-log-per-request/40-plan.md` (tech-lead step), `50-implementation.md` (developer, plus reviewer notes) and `60-conclusion.md` (tech-writer).
- `docs/usage.md` shows the header example and explains "each agent run adds one entry"; `kit/hooks/README.md` describes the hook row; `kit/skills/light-model-routing/SKILL.md` repeats the field list; `kit/agents/light-orchestrator.md` says nothing about attribution.

## Constraints found
- The hook runs in a temp-installed copy in tests; workflows are installed next to it under `.light-kit/workflows/`, and `ctx.root`/`ctx.kitHome` locate them at project and user level.
- The usage block sits after `runs:`; splitting the header at `usage:` keeps the `- step:` rows of a conclusion out of the run entries.
- Existing legacy headers (before the change) must not fail the hook's old requirements; the new checks warn, never block.

## Reusable pieces
- `ctx.root`, `ctx.kitHome`, `ctx.rel()` and the installed workflow files.
- The per-entry parsing already in `artifact-header.mjs`.
- `tests/hooks.test.mjs` helpers `project()`, `run()`, `write()`, `withSpec()` (writes a `direct` status file).
