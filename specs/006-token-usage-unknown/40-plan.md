---
runs:
  - step: plan | agent: light-orchestrator | model: deepseek-flash[1m] | thinking: unknown | level: medium
---

# Plan

- [x] 1. Anchor user-level, uninitialized projects at their repository root (else the session `cwd`) in `locate`, and pass `cwd` from `normalize` — level: medium — files: `kit/hooks/lib/config.mjs`, `kit/hooks/lib/normalize.mjs` — verify: two new hook tests (protected paths blocked; token path resolvable) + `npm test` — commit: `fix(hooks): anchor user-level checks at the project root`
- [x] 2. Let `token-usage` fire on spec artifacts without `kitEnabled`, and keep user-level state in `<home>/.light-kit/state/usage-<project>-<hash>.json` — level: medium — files: `kit/hooks/checks/token-usage.mjs`, `tests/hooks.test.mjs` — verify: new test (message has numbers, no `.light-kit/` in the project) + `npm test` — commit: `fix(hooks): report token usage in projects without init`
- [x] 3. Document where token state lives per install level and the project-root anchoring — level: easy — files: `kit/hooks/README.md`, `docs/usage.md`, `docs/safety-hooks.md` — verify: `npm test`, links/claims match code — commit: `docs: describe user-level token state and path anchoring`
- [x] 4. Reinstall the kit at user level and confirm the live hook reports on this request's artifacts — level: easy — files: none (environment) — verify: next artifact write shows `Tokens: …` — commit: none

## Risks
- `locate` is shared: keep the change to the `userLevel && !kitEnabled` branch; project/workspace paths stay identical.
- Tests must exercise the built hook from a user-level install, not only project-level.

## Test strategy
- Two regression tests in `tests/hooks.test.mjs` using a temp user-level install and a project with `.git` but no `.light-kit/`.
- Full `npm test` after each task.

## Parallelisable tasks
None: 2 depends on 1.

## Token usage
Tokens: unknown
