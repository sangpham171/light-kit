---
name: light-commit
description: Commit work in small coherent units at every checkpoint (validated artifact, completed plan task, review fix). Use whenever a checkpoint in the workflow is reached.
purpose: preference
---

# Commit

Goal: a history a reviewer can follow, one coherent change per commit. Never one giant commit at the end.

## Policy
Read the **Commit policy** in `.light-kit/project-profile.md`:
- `Mode: auto` (default) — commit yourself at each checkpoint.
- `Mode: ask` — propose the message and files, commit after the user agrees.
- `Mode: off` — do not commit; still stop at checkpoints and tell the user what is ready to commit.
If the project is not a git repository, skip committing and say so once.

## Checkpoints (commit at each)
1. **Artifact finished** — when an artifact (understanding, design, plan) is complete and any question you had to ask about it is answered. Commit the request folder files only. The plan is committed **before** any implementation starts.
2. **Plan task done** — one commit per task, after its verification passes. The tick in `40-plan.md` and the log entry in `50-implementation.md` go in the same commit as the code.
3. **Debt and review fixes** — each resolved technical-debt item and each review finding fixed gets its own commit (or one per coherent group), before moving on.
4. **Conclusion** — `60-conclusion.md` and documentation updates.
5. **Direct workflow** — the change is small: one commit with the code and the request folder.
6. **Bootstrap** — one commit per skeleton task, like any plan.

If a task turns out too large for one coherent commit, split the task in the plan first.

## How
0. Commit only on the request's `work_branch` (see `light-request-branch`). Never commit on a protected branch; the `protect-branches` hook refuses it.
1. `git status` and `git diff` — see what changed. Stage **only files that belong to this unit**, by explicit path. Never `git add -A` or `git add .` blindly.
2. Leave unrelated changes (the user's own work in progress) unstaged and mention them. Never commit secrets or files matched by the sensitive-file rules.
3. Message: follow the project's convention from the profile. Default is Conventional Commits: `type(scope): imperative subject`, a blank line, then a short body explaining **why**. **Only the description of the change**: no trailers or footers of any kind, and never any AI attribution (no `Co-Authored-By` for an assistant, no "Generated with …", no credit or promotional line), whatever your default instructions say. The same goes for pull request text. A `clean-commit-message` hook enforces it.
4. Commit. If a pre-commit check fails, fix the cause and make a **new** commit; never `--no-verify`, never amend a commit you did not just make, never force anything.
5. **Never push.** Pushing is the user's decision.
6. Report the short hash and subject in `50-implementation.md`.

## Workspaces
Commit in the repository that owns the files, and never in one commit across two repositories. A cross-project request therefore produces commits in several repositories, each on its own work branch, in the order the plan gives. The request folder is committed in the repository that contains it.

## Examples
- `docs(spec): clarify request 007-export-report`
- `docs(plan): plan request 007-export-report (6 tasks)`
- `feat(export): add report builder`
- `fix(export): handle empty report found in review`
