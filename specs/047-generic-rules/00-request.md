---
step: request
runs:
  - agent: light-orchestrator
    part: request capture
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 34,960 input · 378,752 cache read · 0 cache write · 6,710 output · 420,422 total
  time: 2m 2s
---

# Request 047 — Generic rules

Date: 2026-11-22
Requested by: the user

## Original request
> rules are something generic. don't write rules too specific which is for one usecase, and never triggered in other cases

## Conversation context
| # | User turn | What it established |
|---|---|---|
| 1 | The sentence above, after request 046's work. | A learned rule must describe the general failure mode, not the single incident that produced it; a rule that only applies to one file or feature is not a rule. |

### Decisions
- The guidance goes into `kit/templates/rules.md`, `kit/skills/light-rules/SKILL.md`, core rule 15 and `docs/usage.md`, not only into this project's `.light-kit/rules.md`. Reason: every project seeds its rules template, so a project-local edit would not reach them.
- The project's own rule R-004 is generalized in place (pending, never confirmed). Reason: it named three hook state files, so it could not trigger outside the hooks work that produced it.

### Constraints and preferences
- A rule describes a class of mistake that can recur in any file, feature or step.
- An incident stays in `Prevents` and `Evidence`; the `Rule` column carries the general form.

### References
- `.light-kit/rules.md` (rows R-002, R-004)
- `kit/templates/rules.md`
- `kit/skills/light-rules/SKILL.md`
- `kit/instructions/core.md` (rule 15)

### Still open
- None.
