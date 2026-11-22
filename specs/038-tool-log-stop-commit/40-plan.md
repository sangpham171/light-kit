---
step: plan
runs:
  - agent: light-tech-lead
    part: task list and verification strategy
    model: deepseek-flash[1m]
    thinking: unknown
    level: medium
usage:
  tokens: 0 input · 0 cache read · 0 cache write · 0 output · 0 total
  time: 0s
---

# Plan

- [x] 1. Add git helpers for listing uncommitted paths and committing a path list — level: easy — files: `kit/hooks/lib/git.mjs` — verify: `node --test tests/hooks.test.mjs` — commit: included with task 2
- [x] 2. Commit the remaining tool logs on the stop event — level: easy — files: `kit/hooks/checks/tool-log.mjs` — verify: `node --test tests/hooks.test.mjs` — commit: `feat(hooks): commit the remaining tool log when the agent stops`
- [x] 3. Cover the stop commit in the hooks tests — level: medium — files: `tests/hooks.test.mjs` — verify: `node --test tests/hooks.test.mjs` — commit: `test(hooks): cover the tool-log commit on stop`
- [x] 4. Describe the stop commit in the docs — level: easy — files: `kit/hooks/README.md`, `docs/safety-hooks.md`, `specs/README.md` — verify: text review — commit: `docs(hooks): describe the tool log commit on stop`
- [x] 5. Run the full suite, refresh the user-level install and record the result — level: easy — files: `specs/038-tool-log-stop-commit/50-implementation.md` — verify: `npm test` — commit: `docs(spec): record request 038`

## Design
- Extend the existing `tool-log` check with `events: ['post-tool', 'stop']`; no new hook id, so the current `hooks.tool-log` mode also controls the commit.
- On stop, walk the root and the workspace's own project directories. For each one that is a git repository:
  - skip when the project profile sets `Mode: off`;
  - skip when `currentBranch` is empty (no commit, detached HEAD);
  - skip when `isProtectedBranch` is true;
  - list `git status --porcelain -z` entries and keep paths matching `specs/tool-log.md` or `specs/<NNN-slug>/tool-log.md`;
  - `git add` them and `git commit --only` them with `chore(spec): record tool-call logs`.
- Any failure stays silent: the stop handler returns `null`.

## Risks
- A large repository makes `git status` at every stop slightly slower; it is bounded by one status per repository.
- Committing on stop adds one small commit per turn that wrote tool calls; that is the requested behavior.
- A git identity or pre-commit hook failure leaves the log uncommitted; the handler fails open rather than blocking the agent.

## Test strategy
- Temporary project + temporary git repository: stop commits the shared and the request log; other untracked files stay; protected branch, `off`, non-repository and detached HEAD cases commit nothing; focused hooks tests, then `npm test`.

## Parallelisable tasks
None.
