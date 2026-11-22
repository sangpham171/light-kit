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

## Rules

| ID | State | Count | Rule | Prevents | Check before | Last violated | Evidence |
|---|---|---|---|---|---|---|---|
| R-001 | pending | 1 | Check each earlier request's open debt against the change and state in `50-implementation.md` and `60-conclusion.md` whether it is resolved or still open. | 039 TD-1 was labelled "not introduced" while it stayed open for `.light-kit/rules.md`, and the conclusion read as if it were closed. | Before writing the implementation log and the conclusion. | 2026-11-22 | `specs/040-init-updates-existing-kit/50-implementation.md`, review F-1.1 |

## Before a task

1. Read this file.
2. Treat every `confirmed` rule as a hard constraint on the approach, the code and the verification. Pass the applicable ones to any agent you delegate to.
3. Treat `pending` rules as warnings: include the applicable ones in the plan or the acceptance check.
4. If a `confirmed` rule cannot be followed, stop before acting and ask the user. Never work around it.

## After a task

1. Check every rule that applied against the result and its verification.
2. **Violated:** add 1 to `Count`, set `Last violated` to today, and add the evidence (request id, file, test or commit). One task counts once per rule, however many instances it had.
3. **Reached the threshold:** when `Count` reaches the promotion threshold in `.light-kit/project-profile.md` (default 3), set `State` to `confirmed` in the same edit and report the promotion.
4. **New repeatable error or bug:** add a row with a new `R-NNN` id, `pending`, `Count: 1`, today's date and the evidence. The incident is the first violation.
5. **Nothing happened:** leave the file unchanged and write `rules: no change` in the task log.
6. Never renumber or delete a row, and never rewrite a `confirmed` rule. If a rule is wrong or obsolete, propose the change to the user; only the user can demote or remove it.
7. An exception the user explicitly approves is recorded in `Evidence` as `exception approved YYYY-MM-DD: <reason>` and does not increment `Count`.

## Writing a rule

- One failure mode per rule.
- Say what to do, not what went wrong: `Check the response status before parsing the body`, not `be careful with APIs`.
- `Prevents` names the error or bug the rule stops.
- `Check before` says when the rule applies: a file, a command, a step or a moment.
- Keep it specific enough to check. A vague rule is not added.
- Use the next free `R-NNN`; never reuse an id.

Example row:

| R-001 | pending | 1 | Run the full test suite before every commit. | A broken test reached a commit twice. | Before each `git commit`. | 2026-11-20 | `specs/036-example/50-implementation.md` |
