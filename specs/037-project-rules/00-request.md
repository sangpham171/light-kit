---
step: request
runs:
  - agent: light-orchestrator
    part: request capture
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 63,020 input · 1,105,024 cache read · 0 cache write · 14,123 output · 1,182,167 total
  time: 2m 53s
---

# Request 037 — Project rules

Date: 2026-11-22
Requested by: the user

## Original request
> i need a rules md files to prevent repeat errors or bug in a project. the rules will have 2 state: pending and confirmed. when
> in pending state, rules are not stricted, but there is a count column to calculate how many times rules are violated. when there are 3 times rules
> are violated, this rule go to confirmed state and it become critical and forbidden rules.
> Agent need to check rules before any task, and update rules automatically after any task

## Conversation context
| # | User turn | What it established |
|---|---|---|
| 1 | The paragraph above, pasted as the request. | A per-project Markdown rules file; two states; a violation counter; promotion to a forbidden rule at three violations; agents read it before a task and update it after. |

### Decisions
- The file is `.light-kit/rules.md`, seeded once from a template and never overwritten. Reason: it is project knowledge, like the profile, so upgrades must keep it. Rejected: a file inside `specs/` (per-request, not persistent) and a profile section (the profile is for conventions, not incidents).
- A Markdown table holds `ID`, `State`, `Count`, `Rule`, `Prevents`, `Check before`, `Last violated` and `Evidence`. Reason: the count and the state are visible together, and evidence makes a promotion auditable.
- `Count` counts tasks in which the rule was violated, not individual instances, and a new rule starts at `1` when an incident caused it. Reason: three separate incidents are a pattern; three mistakes in one task are one lesson.
- At `Count: 3` the rule becomes `confirmed` in the same edit. A confirmed rule is a hard constraint: never deleted, demoted or rewritten by an agent; only the user can remove it. Reason: a forbidden rule that an agent can explain away is not forbidden.
- One skill, `light-rules`, owns the before/after procedure; the core instructions keep only rule 15 and a pointer. Reason: every client loads the core rules, while the detailed procedure stays one skill.
- Enforce at the existing checkpoints: `light-init` seeds the file, the orchestrator reads it before the first task, `light-implement` applies it per plan task, and the review checklist reports violations. Reason: no new workflow and no new hook are needed.

### Constraints and preferences
- Agents check rules before any task and update them automatically after any task.
- `pending` rules are advisory warnings; `confirmed` rules are critical and forbidden.
- Never delete, demote or rewrite a confirmed rule; stop and ask the user when one conflicts with the task.

### References
- `kit/instructions/core.md`
- `kit/skills/light-implement/SKILL.md`
- `kit/skills/light-init/SKILL.md`
- `kit/skills/light-review-checklist/SKILL.md`
- `kit/agents/light-orchestrator.md`
- `kit/audit/rules.json`
- `tools/build.mjs`

### Still open
- None. Defaults are recorded above and in `10-understanding.md`.
