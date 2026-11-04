---
step: plan
runs:
  - agent: light-orchestrator
    model: deepseek-flash
    thinking: unknown
    level: easy
usage:
  tokens: 183 input · 56,192 cache read · 0 cache write · 377 output · 56,752 total
  time: 14s
---

# Plan

- [x] 1. Emit `bash` beside `command` in generated Copilot hook entries — level: easy — files: `tools/build.mjs` — verify: inspect `hookRegistration('copilot')` output — commit: `fix(hooks): give Copilot CLI hooks an explicit bash command`
- [x] 2. Assert the `bash` field in the registration test — level: easy — files: `tests/hooks.test.mjs` — verify: `node --test tests/hooks.test.mjs` — commit: included with task 1
- [x] 3. Run the full suite and record the result — level: easy — files: none — verify: `npm test` — commit: `docs(specs): record request 026 implementation`

## Risks
- Copilot might reject `command` and `bash` together; the reference states explicit `bash` wins and `command` stays a fallback, so both are safe.

## Test strategy
- Unit check on the generated hook file, then the full Node test suite.

## Parallelisable tasks
- None.
