---
name: light-triage
description: Score a request's complexity and choose a workflow (direct, standard, full). Use at the start of every request.
---

# Triage

Read `00-request.md` and the relevant code, then score each criterion 0–2.

| Criterion | 0 | 1 | 2 |
|---|---|---|---|
| Scope | one file or function | one component | several components or services, or more than one project |
| Ambiguity | clear, testable outcome | some gaps you can fill with sensible defaults | goals, users or rules unclear |
| Risk | internal, easily reverted | user-visible or touches data | security, money, migrations, public API |
| Novelty | pattern already in the codebase | variation of an existing pattern | new capability, dependency or architecture |
| Impact | nobody else affected | other teams or modules consume it | breaking change or multi-team coordination |

## Decision
- **0–2 and Ambiguity = 0 → `direct`**
- **3–6 → `standard`**
- **7+, or Ambiguity = 2, or Risk = 2 → `full`**

The user can override with an explicit workflow.

## Output
Append to `10-understanding.md`:
```
## Triage
Scores: scope N, ambiguity N, risk N, novelty N, impact N (total N)
Workflow: <direct|standard|full>
Why: <one or two sentences>
```
If the choice is `full`, say so to the user and list the open questions before doing anything else. If it is `direct`, proceed without asking.
