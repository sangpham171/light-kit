---
step: request
runs:
  - agent: light-orchestrator
    model: unknown
    thinking: unknown
    level: easy
usage:
  tokens: unknown
  time: unknown
---

# Request 018 — Step first in the artifact header

Date: 2026-10-27
Requested by: light
Branch: `feat/018-header-step-first` from `d9c80b0` (`feat/017-usage-in-header`)

## Original request
in templates, there is a repeat of step un runs and usage. put step at the beginning, then runs and
usage

## Interpretation
The header no longer repeats `step` inside `runs` and `usage`. The step moves to a top-level `step:`
line, then a flat `runs:` list (agent, model, thinking, level) and a `usage:` block (tokens, time).
`60-conclusion.md` covers every step, so it keeps one `- step:` row per step plus the `total` row.

## Out of scope
- Migrating the artifacts of `specs/001`–`specs/017` (the hooks accept their older headers).
