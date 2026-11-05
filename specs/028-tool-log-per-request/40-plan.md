---
step: plan
runs:
  - agent: light-orchestrator
    model: deepseek-flash
    thinking: unknown
    level: easy
usage:
  tokens: 0 input · 0 cache read · 0 cache write · 0 output · 0 total
  time: 0s
---

# Plan

- [x] 1. Share the "current request" selection: export `currentRequest` from `kit/hooks/lib/specs.mjs` and use it in `capture-discussion` — level: easy — files: `kit/hooks/lib/specs.mjs`, `kit/hooks/checks/capture-discussion.mjs` — verify: `node --test tests/hooks.test.mjs` — commit: included with task 2
- [x] 2. Write the log into the active request folder — level: easy — files: `kit/hooks/checks/tool-log.mjs` — verify: focused tests — commit: `feat(hooks): keep the tool log in the active request folder`
- [x] 3. Update the tests to the request path and add inactive/done-request cases — level: easy — files: `tests/hooks.test.mjs` — verify: `node --test tests/hooks.test.mjs` — commit: included with task 2
- [x] 4. Update the docs to the request path — level: easy — files: `kit/hooks/README.md`, `docs/safety-hooks.md`, `specs/README.md` — verify: text review — commit: `docs(hooks): point the tool log at the active request`
- [x] 5. Run the full suite and record the result — level: easy — files: none — verify: `npm test` — commit: `docs(specs): record request 028 implementation`

## Risks
- Two active requests: the step preference plus newest-folder rule decides; recorded in the docs.
- Calls made before `10-understanding.md` exists are not logged; accepted, since the request is not yet active.

## Test strategy
- Focused hooks tests, then `npm test`.

## Parallelisable tasks
- None.
