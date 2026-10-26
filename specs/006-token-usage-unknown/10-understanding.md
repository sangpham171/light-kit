---
runs:
  - step: understand
    agent: light-orchestrator
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
---

# Understanding

## Restatement
Every request artifact ends with `## Token usage`, and `60-conclusion.md` holds the per-step table, but the sections stay `unknown` (for example `specs/005-readme-install-details/60-conclusion.md`). Find the cause and make the numbers appear.

## Findings (cause, verified)
- The kit is installed at **user level** (`~/.light-kit`, `kit.config.json` level `user`); this repository has no `.light-kit/`.
- `locate()` (`kit/hooks/lib/config.mjs`) therefore returns `kitEnabled: false`, and `token-usage` starts with `if (!ctx.kitEnabled ...) return null` — the hook never runs.
- Independently, at user level without `.light-kit`, `locate()` sets `root`/`scope` to the **artifact's own folder**, so `ctx.rel()` is just `50-implementation.md`; the `specs/<id>/<step>.md` regex cannot match even if the gate were removed.
- The same wrong root makes path-based safety checks ineffective in uninitialized projects: `protect-paths` does not block `.git/config` or `.claude/settings.json` there (reproduced).

## Assumptions
- A spec artifact under `specs/` is enough evidence that the project uses the request workflow; token reporting does not need `light-init`.
- Reporting must not create `.light-kit/` in the project, because that would silently look like `light-init` ran and switch on require-spec, artifact-header and commit-checkpoint.

## Open questions (with proposed defaults)
None blocking. Default chosen: user-level state for uninitialized projects lives in `~/.light-kit/state/`, one file per project.

## Requirements
1. `token-usage` reports in a user-level install for an uninitialized project that writes `specs/<id>/<step>.md`.
2. The project's `.light-kit/` is not created by reporting; per-project totals and session baselines persist outside it.
3. At user level without `.light-kit`, path-based checks resolve relative to the project (repository root), not the file's folder.
4. Behavior in project-level, workspace-level and initialized user-level installs is unchanged.
5. Docs state where the state lives at each level.

## Acceptance criteria
- Simulated user-level install + project with no `.light-kit`: writing a spec artifact yields a message with `Tokens: <in>/<out>` and the state file under the kit folder; no `.light-kit/` in the project.
- Same setup: `Write .git/config` and `Write .claude/settings.json` are blocked.
- `npm test` passes.
- This request's later artifacts carry real numbers after the kit is reinstalled.

## In scope / Out of scope
- In: `kit/hooks/lib/config.mjs`, `kit/hooks/lib/normalize.mjs`, `kit/hooks/checks/token-usage.mjs`, tests, hook docs.
- Out: backfilling numbers in requests 001–005; running `light-init` here; changing other clients' usage sources.

## Triage
Scores: scope 2, ambiguity 0, risk 1, novelty 1, impact 1 (total 5)
Workflow: standard
Why: several hook files plus tests and docs, but one verified cause and one concrete outcome; the path change is user-visible, not a breaking change.

## Routing
- understand: easy — read already-scoped code.
- discover: medium — trace `locate`/`rel` through the checks.
- plan: medium — decide state location and anchoring.
- implement: medium — two coupled hook fixes and tests.
- verify-and-review: medium — regression risk in safety checks.
- conclude: easy — report.

## Token usage
Tokens: unknown
