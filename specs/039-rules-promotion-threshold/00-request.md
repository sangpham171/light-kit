---
step: request
runs:
  - agent: light-orchestrator
    part: request capture and triage
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 43,176 input · 465,280 cache read · 0 cache write · 7,850 output · 516,306 total
  time: 1m 28s
---

# Request 039 — Configurable rule promotion threshold

Date: 2026-11-22
Requested by: the user

## Original request
> i want the 3 times violated in rules can be configured by user

## References
- `.light-kit/rules.md` — the project's learned rules file with the hardcoded `3`.
- `kit/templates/rules.md`, `kit/skills/light-rules/SKILL.md`, `kit/instructions/core.md` — kit sources stating the threshold.
- `docs/usage.md` — user documentation of the rules system.
- `.light-kit/project-profile.md` — existing per-project settings pattern (`Output style`, `Review turns`, `Commit policy`).
