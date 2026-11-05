---
step: plan
runs:
  - agent: light-tech-lead
    part: task list and verification strategy
    model: deepseek-flash
    thinking: unknown
    level: easy
usage:
  tokens: 0 input · 0 cache read · 0 cache write · 0 output · 0 total
  time: 0s
---

# Plan

- [x] 1. Keep the shared log and move it into the request folder — level: easy — files: `kit/hooks/checks/tool-log.mjs` — verify: `node --test tests/hooks.test.mjs` — commit: `fix(hooks): keep tool calls from before the request folder`
- [x] 2. Cover the lifecycle in the hooks tests — level: easy — files: `tests/hooks.test.mjs` — verify: `node --test tests/hooks.test.mjs` — commit: included with task 1
- [x] 3. Describe the shared-then-moved log in the docs — level: easy — files: `kit/hooks/README.md`, `docs/safety-hooks.md`, `specs/README.md` — verify: text review — commit: `docs(hooks): describe the shared tool log`
- [x] 4. Run the full suite and record the result — level: easy — files: `specs/030-tool-log-before-request/50-implementation.md` — verify: `npm test` — commit: `docs(specs): record request 030`

## Risks
- A statusless unfinished folder is ignored by the log; that is intended and documented.
- A request folder created by a shell `mkdir` alone is not detected; the kit creates it with a file write.

## Test strategy
- Focused hooks tests for the shared log, the move, the merge, active/done/stale selection, redaction and the self-write skip; then `npm test`.

## Parallelisable tasks
None.
