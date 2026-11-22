# Project rules

Rules learned from errors and bugs that already happened. They stop the same failure from happening again.
Agents read this file before every task and update it after one (see the `light-rules` skill).
Style, stack and workflow preferences belong in `.light-kit/project-profile.md`, not here.

## States

| State | Meaning | Agent behaviour |
|---|---|---|
| `pending` | Violated fewer times than the promotion threshold, or added before any violation. On probation. | Advisory: check it, mention it when it applies, but do not block work on it. |
| `confirmed` | Violated the promotion threshold or more times. Critical. | Mandatory: never break it. If it conflicts with the task, stop and ask the user. |

`Count` is the number of tasks in which the rule was violated, not the number of instances inside a task. A rule added after an incident starts at `Count: 1` — the incident itself counts. A rule added before any violation starts at `0`. The promotion threshold in `.light-kit/project-profile.md` (default 3) is the number of violated tasks that promotes a rule. When `Count` reaches it and `State` is `pending`, set `State` to `confirmed` in the same update.

## When to update

Write or update a rule when a failure appears, not only after a review:

- the user reports a bug, a regression, or that something still does not work after earlier work;
- a test, build, lint, format or manual check fails;
- a review, tester or security finding exposes a mistake;
- the user corrects the agent or rejects an output;
- implementation or discovery shows the same error that happened before;
- a new request is caused by a defect in earlier work;
- a `confirmed` rule cannot be followed.

Record it in the same request or exchange, with the report and the earlier request as evidence.

## Rules

| ID | State | Count | Rule | Prevents | Check before | Last violated | Evidence |
|---|---|---|---|---|---|---|---|
| _none yet_ | | | | | | | |

Replace the `_none yet_` row when you add the first rule.

## Before a task

1. Read this file.
2. Treat every `confirmed` rule as a hard constraint on the approach, the code and the verification. Pass the applicable ones to any agent you delegate to.
3. Treat `pending` rules as warnings: include the applicable ones in the plan or the acceptance check.
4. If a `confirmed` rule cannot be followed, stop before acting and ask the user. Never work around it.

## After a task

Run this at the end of every task, and immediately after any trigger above.

1. Check every rule that applied against the result and its verification.
2. **Violated:** add 1 to `Count`, set `Last violated` to today, and add the evidence (request id, file, test or commit). One task counts once per rule, however many instances it had.
3. **Reached the threshold:** when `Count` reaches the promotion threshold in `.light-kit/project-profile.md` (default 3), set `State` to `confirmed` in the same edit and report the promotion.
4. **New repeatable error or bug:** add a row with a new `R-NNN` id, `pending`, `Count: 1`, today's date and the evidence. The incident is the first violation.
5. **Nothing happened:** leave the file unchanged and write `rules: no change` in the task log.
6. Never renumber or delete a row, and never rewrite a `confirmed` rule. If a rule is wrong or obsolete, propose the change to the user; only the user can demote or remove it.
7. An exception the user explicitly approves is recorded in `Evidence` as `exception approved YYYY-MM-DD: <reason>` and does not increment `Count`.

## Writing a rule

- One failure mode per rule.
- Write the general failure mode, not the incident: the rule must apply wherever the same class of mistake can recur — any file, feature, command or step, not only where it first happened.
- If a rule only makes sense for the one case that produced it, widen it to the class of case it belongs to. The specific incident belongs in `Prevents` and `Evidence`.
- Say what to do, not what went wrong: `Check the response status before parsing the body`, not `be careful with APIs`.
- `Prevents` names the error or bug the rule stops.
- `Check before` says when the rule applies: a file, a command, a step or a moment.
- Keep it specific enough to check: name the class of case precisely. A vague rule is not added.
- Use the next free `R-NNN`; never reuse an id.

Example row:

| R-001 | pending | 1 | Run the full test suite before every commit. | A broken test reached a commit twice. | Before each `git commit`. | 2026-11-20 | `specs/036-example/50-implementation.md` |
