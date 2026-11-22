---
step: understand
runs:
  - agent: light-orchestrator
    part: understanding and triage
    model: deepseek-flash[1m]
    thinking: unknown
    level: medium
usage:
  tokens: 322 input · 127,744 cache read · 0 cache write · 1,494 output · 129,560 total
  time: 6s
---

# Understanding

## Goal
The tool call log is never left uncommitted when an agent finishes a turn. Its whole lifecycle needs no manual commit:

1. Before `specs/<NNN-slug>/` exists, rows go to `specs/tool-log.md`.
2. The call that creates the request folder moves that log into `specs/<NNN-slug>/tool-log.md`.
3. On the Stop hook, whatever tool-log files are still uncommitted are committed.

Steps 1 and 2 already ship (request 030). The observed gap is step 3: nothing commits the log at the end of a turn, so `specs/tool-log.md` (or a request log) is routinely left modified in the working tree.

## Users and value
Everyone using the kit: the working tree no longer carries log noise between turns, and `git log` shows a predictable `chore(spec): record tool-call logs` entry beside the work it describes.

## Scope
In:
- A Stop handler in the `tool-log` check that commits uncommitted `specs/tool-log.md` and `specs/<NNN-slug>/tool-log.md` files.
- Safety limits: only tool-log files, only inside a repository with a branch, never on a protected branch, never when the project profile sets `Mode: off`.
- Tests and documentation.

Out:
- Changing when or where rows are written (steps 1–2 keep their behavior).
- Committing any other file, pushing, or rewriting history.
- A new hook id or config key.

## Business rules
- The commit contains only tool-log paths; other staged or unstaged work is untouched.
- Protected branches keep their rule: no commit there.
- `hooks.tool-log: "off"` disables both logging and the stop commit.
- A non-repository, a detached HEAD, a missing git identity or a failing git command must never make the agent fail: the handler stays silent and fails open.

## Edge cases
- A workspace with several nested project repositories: each repository's tool log is committed in its own repository.
- A repository whose root is above the project folder: paths are matched by their `specs/` segment, not by a fixed prefix.
- Renames and quoted paths in `git status` must not produce a wrong path.
- A stop that already triggered a continuation (`stop_hook_active`): committing is still safe and commits the rows written so far.

## Acceptance criteria
- After a stop, `git status` shows no modified or untracked tool-log file, and the last commit message is `chore(spec): record tool-call logs`.
- A non-log file in the same working tree stays uncommitted.
- No commit happens on a protected branch, with the hook off, or outside a repository.
- `npm test` passes.

## Triage
Scores: scope 1, ambiguity 1, risk 1, novelty 1, impact 1 (total 5)
Workflow: standard
Why: One hook component plus its tests and docs, following an existing pattern; the intent is clear, and the few open choices (which files, which branch, failure behavior) have safe defaults recorded above.
