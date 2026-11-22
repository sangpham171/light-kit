---
name: light-rules
description: "Apply the project's learned rules before a task, then record violations, promotions and new rules after it. Use before and after every request, plan task or standalone code change."
purpose: compensation
---

# Rules

Goal: stop the same error or bug from happening again. This file is memory for failures, not for style or stack conventions — those belong in `.light-kit/project-profile.md`.

## When rules change

Update the file at the moment a failure appears, in the same request or exchange. A review is one trigger, not the only one:

- the user reports a bug, a regression, or that something still does not work after an earlier request or change;
- a test, build, lint, format or manual verification fails;
- a review, tester or security finding exposes a mistake;
- the user corrects the agent's work, rejects an output or says it is wrong;
- implementation or discovery shows the same error that happened before;
- a new request is caused by a defect in earlier work;
- a `confirmed` rule cannot be followed.

For a user-reported defect, record the rule before or while fixing it: point the evidence at the user's report and the earlier request. Do not wait for a review that may never come.

## Before a task

A task is a request, one task in `40-plan.md`, or any standalone change the user asked for.

1. Read `.light-kit/rules.md`. If it is missing, the project is not enabled yet: continue without rules and note it. Do not create the file at task time; `light-init` creates it from the template.
2. Read the promotion threshold in `.light-kit/project-profile.md` (default 3): the `Promotion threshold` line under `## Rules`. A missing, non-numeric or lower than 1 value means 3. Use that number wherever this skill compares a `Count`.
3. Carry every applicable `confirmed` rule into the task brief, plan or acceptance check as a hard constraint. When you delegate, put them in the subagent's brief.
4. Note the applicable `pending` rules as warnings. Do not let them block the task.
5. If a `confirmed` rule cannot be met, stop before acting and ask the user. Do not bypass it.

## After a task

Run this at the end of every task, and immediately after any trigger above.

1. Check the result and its verification against every rule that applied.
2. For a violation, add 1 to `Count`, set `Last violated` to today, and add concise evidence: request id, file, test or commit. One task counts once per rule.
3. If `Count` reaches the promotion threshold in `.light-kit/project-profile.md` (default 3), set `State` to `confirmed` in the same edit and report the promotion in one line.
4. If a new error or bug happened and no rule covers it, add a `pending` row at `Count: 1` with the evidence. The incident is the first violation. A rule added before any incident starts at `Count: 0`. Write the general failure mode, not the incident (see **Writing a rule**).
5. If nothing was violated and nothing new happened, leave the file unchanged and record `rules: no change` in the task log (usually `50-implementation.md`).
6. Never renumber or delete a row, and never rewrite a `confirmed` rule. Propose a correction to the user; only the user can demote or remove one.
7. If the user approves an exception, record it in `Evidence` as `exception approved YYYY-MM-DD: <reason>`; it is not a violation.

## Writing a rule

- The rule is the general failure mode, not the incident: it must apply wherever the same class of mistake can recur — another file, feature, command or step.
- If the wording only fits the case that produced it, widen it to that class of case. The specific incident belongs in `Prevents` and `Evidence`.
- One failure mode per rule; say what to do; keep the `Check before` moment concrete.
- A rule that cannot trigger outside its first use case is not added.

## Reviews and delegation

- A reviewer reports a violated rule as a finding; the orchestrator or developer records it after the task.
- A review is a safety net, not the only trigger: a user-reported bug, a failed check or a correction records a rule on the spot.
- A `confirmed` rule that blocks the task is a blocking question, not a warning in a report.

## Promotion at a glance

`N` is the promotion threshold in `.light-kit/project-profile.md` (default 3).

| Violations | State | Effect |
|---|---|---|
| 0 to N-1 | `pending` | Advisory |
| N or more | `confirmed` | Mandatory, forbidden to break |
