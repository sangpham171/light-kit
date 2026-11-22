---
step: plan
runs:
  - agent: light-orchestrator
    part: implementation plan
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 6,387 input · 759,424 cache read · 0 cache write · 6,728 output · 772,539 total
  time: 1m 48s
---

# Plan

- [x] 1. Add `**/.claude/**`, `**/.copilot/**`, `**/.light-kit/**` and `**/specs/**` to `BUILTIN.sensitiveAllow` — level: easy — files: `kit/hooks/lib/config.mjs` — verify: focused test in task 2 — commit: `fix(hooks): exempt kit-managed folders from the sensitive-file check`
- [x] 2. Cover both directions in the sensitive-files test: root `credentials` blocked, the four folders allowed — level: easy — files: `tests/hooks.test.mjs` — verify: `node --test tests/hooks.test.mjs` — commit: same as task 1
- [x] 3. Add the four globs to this repository's `.light-kit/hooks.config.json` so the installed hooks apply them before a refresh — level: easy — files: `.light-kit/hooks.config.json` — verify: read probe through the installed hook — commit: `chore(config): exempt kit-managed folders in this project`
- [x] 4. State the built-in exemptions in the hook docs — level: easy — files: `kit/hooks/README.md`, `docs/safety-hooks.md` — verify: `npm test` — commit: `docs(kit): note the built-in sensitive-file exemptions`
- [x] 5. Conclude the request and commit its state files — level: easy — files: `specs/050-sensitive-allow-kit-folders/*` — verify: `npm test` — commit: `docs(spec): conclude request 050`

Each task = one verified, coherent commit.

## Risks
- An over-broad glob would exempt real source folders: anchor with `**/` and require the folder segment, never bare `*`.
- `.claude/**` contains client settings; the sensitive check only covers file names, and `protect-paths` still blocks its settings files, so allowing reads does not open them to edits.

## Test strategy
- Focused `node --test tests/hooks.test.mjs`.
- `npm test` for the installed defaults.

## Parallelisable tasks
- Tasks 1, 2 and 4 build on the same list; run in order. Task 3 is independent.
