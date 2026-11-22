---
step: discover
runs:
  - agent: light-tech-lead
    part: code and hook discovery
    model: deepseek-flash[1m]
    thinking: unknown
    level: medium
usage:
  tokens: 152 input · 65,280 cache read · 0 cache write · 685 output · 66,117 total
  time: 3s
---

# Discovery

## Current behavior
- `kit/hooks/checks/tool-log.mjs` registers only `post-tool`. It writes `specs/tool-log.md`, moves it into `specs/<NNN-slug>/tool-log.md` on the first write inside that folder (merging when the request log already has rows), and follows the active request otherwise. It never commits anything.
- `kit/hooks/run.mjs` already dispatches `stop` to checks whose `events` include it. `kit/hooks/lib/emit.mjs` maps the stop event for every client.
- `kit/hooks/checks/verify-on-stop.mjs` is the existing stop-check pattern; it is `off` by default.
- `kit/hooks/lib/git.mjs` exposes `currentBranch`, `isProtectedBranch`, `inRepo` and `changedFiles`, but no way to list uncommitted paths or commit a path list.
- `kit/hooks/checks/commit-checkpoint.mjs` reads `Mode: off` from `.light-kit/project-profile.md` before nudging a commit; the stop handler should respect the same switch.
- `kit/hooks/lib/specs.mjs` exposes `listProjectDirs(root)` for workspace projects.

## Observed gap
`git status` in this repository showed `M specs/tool-log.md` left over from an earlier session. Nothing in the kit commits it: the agent is only reminded to commit once many files are uncommitted (`commit-checkpoint`), which a single log file never triggers.

## Constraints found
- Hooks fail open: `run.mjs` swallows errors from a check, so a failed git command cannot break the agent.
- `git status --porcelain -z` reports `XY<space>path\0`; rename/copy entries add the original path in the next token.
- Project commits follow Conventional Commits; the repository history already uses `chore(spec): record tool-call logs` for this exact file.
- The tests build a temporary project with `install()` and drive `run.mjs` through `spawnSync`; commit tests need a real temporary git repository.

## Relevant files
- `kit/hooks/checks/tool-log.mjs`
- `kit/hooks/lib/git.mjs`
- `tests/hooks.test.mjs`
- `kit/hooks/README.md`, `docs/safety-hooks.md`, `specs/README.md`
