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
| R-001 | pending | 1 | Check each earlier request's open debt against the change and state in `50-implementation.md` and `60-conclusion.md` whether it is resolved or still open. | 039 TD-1 was labelled "not introduced" while it stayed open for `.light-kit/rules.md`, and the conclusion read as if it were closed. | Before writing the implementation log and the conclusion. | 2026-11-22 | `specs/040-init-updates-existing-kit/50-implementation.md`, review F-1.1 |
| R-002 | pending | 1 | Sanitize every nested row when reading a best-effort state file, not only the top-level shape; a malformed value must be dropped or restart the file empty, never throw. | A parseable state file with a non-object request row made the new hook error on every agent or skill call instead of restarting empty. | Before writing a reader for hook state under `.light-kit/`. | 2026-11-22 | `specs/042-agent-skill-usage/50-implementation.md`, review F-1.1 |
| R-003 | pending | 2 | Do not detect user intent from language-specific keywords: no word list is universal. Use a language-neutral signal or let the agent judge the message. | The `rules-reminder` hook matched only English (043), then only English and Vietnamese (044), while every other language passed silently. | Before adding a text heuristic that reads the user's prompt. | 2026-11-22 | `specs/043-rule-triggers`, `specs/044-multilingual-rules-reminder`, `specs/045-universal-rules-reminder/00-request.md`, user report |
| R-004 | pending | 1 | Commit every state or generated file the request's tooling or hooks wrote before the conclusion checkpoint, not only the source changes. | Request 042 left its new stats files staged and request 045 left both stats files and `usage.json` uncommitted. | Before writing `60-conclusion.md`, and in the final checkpoint. | 2026-11-22 | `specs/046-usage-state-commit`, user report; `specs/042-agent-skill-usage`, `specs/045-universal-rules-reminder` |
| R-005 | pending | 1 | Write each rule as the general failure mode, not the incident: it must apply wherever the same class of mistake can recur, in any file, feature, command or step. | Rules narrowed to one use case never fired elsewhere: R-004 named three hook state files, so the same class of mistake stayed unguarded in every other area. | Before adding or changing any rule. | 2026-11-22 | user correction, this exchange; `specs/047-generic-rules/00-request.md` |
| R-006 | pending | 1 | Start a new tracking, logging or reporting mechanism with the history it is meant to capture, or make its first record say that its history begins at install. | The `agent-skill-usage` stats started empty although 20+ agent and skill calls already existed in the session records, so the file read as a complete history when it held only the calls made after install. | Before shipping a metrics, log or report mechanism. | 2026-11-22 | user report, this exchange; `specs/042-agent-skill-usage` (no import), `specs/048-usage-history` |
| R-007 | pending | 1 | Compare real paths, not normalized strings, when deciding whether a script is the entry point or whether two paths name the same file. | The installed `record-usage.mjs` exited 0 without writing: `/var/...` in `argv[1]` did not equal the `/private/var/...` module URL of a temp project. | Before writing an `import.meta.url` entry-point guard or any path equality. | 2026-11-22 | failed test in `specs/049-usage-record-script`; `tests/agent-skill-usage.test.mjs` |
| R-008 | pending | 1 | Keep the opening `---` when creating a frontmattered file by hand; a file without it parses as empty metadata instead of failing. | `status.md` for requests 047 and 048 had no opening delimiter, so their `state: done` was invisible and both stayed active in the session hooks. | After writing a `status.md` or any artifact with a header. | 2026-11-22 | this exchange; `specs/047-generic-rules/status.md`, `specs/048-usage-history/status.md` |

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
