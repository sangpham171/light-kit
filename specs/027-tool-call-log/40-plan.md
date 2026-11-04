---
step: plan
runs:
  - agent: light-orchestrator
    model: deepseek-flash
    thinking: unknown
    level: easy
usage:
  tokens: 200 input · 60,672 cache read · 0 cache write · 577 output · 61,449 total
  time: 21s
---

# Plan

- [x] 1. Add the `tool-log` check that appends one row per post-tool call to `specs/tool-log.md` — level: easy — files: `kit/hooks/checks/tool-log.mjs` — verify: unit test in `tests/hooks.test.mjs` — commit: `feat(hooks): log every tool call to specs/tool-log.md`
- [x] 2. Register the check and its default mode — level: easy — files: `kit/hooks/checks/index.mjs`, `kit/hooks/lib/config.mjs`, `kit/hooks/hooks.config.json` — verify: `node --test tests/hooks.test.mjs` — commit: included with task 1
- [x] 3. Cover the behavior with tests: one row per call, no `specs/` means no file, `off` disables, writing the log is not logged — level: easy — files: `tests/hooks.test.mjs` — verify: `node --test tests/hooks.test.mjs` — commit: included with task 1
- [x] 4. Document the file and the hook — level: easy — files: `kit/hooks/README.md`, `docs/safety-hooks.md`, `specs/README.md` — verify: text review — commit: `docs(hooks): describe the tool call log`
- [x] 5. Run the full suite and record the result — level: easy — files: none — verify: `npm test` — commit: `docs(specs): record request 027 implementation`

## Risks
- The log grows without bound: rows are truncated to 200 characters and carry no tool output, but the file is never rotated. Accepted; it is a plain Markdown file a project can delete or ignore.
- Hook loops: the check skips a call that writes `specs/tool-log.md` itself.

## Test strategy
- Node test suite, focused file first, then `npm test`.

## Parallelisable tasks
- None.
