---
runs:
  - step: discover | agent: light-orchestrator | model: deepseek-flash[1m] | thinking: unknown | level: medium
---

# Discovery

## Relevant code
- `kit/hooks/lib/config.mjs:53-70` — `isUserLevel`, `locate`. At user level with no project `.light-kit`: `kitEnabled: false`, `root = scope = start` (the file's folder).
- `kit/hooks/lib/normalize.mjs:44-64` — `normalize`: `locate` is called with `dirname(first file)`; `rel()` is relative to `root`.
- `kit/hooks/checks/token-usage.mjs:42-52` — gate `!ctx.kitEnabled` returns early; `ARTIFACT` regex runs on `ctx.rel`.
- `kit/hooks/checks/protect-paths.mjs:12` — matches `ctx.rel` against `**/.git/**`, `**/.claude/settings.json`, …
- `kit/hooks/checks/session-context.mjs:10` — user level + `!kitEnabled` stays as is (init reminder).
- `kit/hooks/checks/audit-log.mjs:9` — also uses `ctx.rel` (off by default).

## Conventions
- Fail-open hooks; best-effort readers; state files under `.light-kit/` (project) or `<home>/.light-kit/` (user, e.g. `audits/state.json`).
- Generated hook files are overwritten by `tools/install.mjs`; the repo `kit/` is the source.
- Tests spawn the built hook from a temp install (`tests/hooks.test.mjs` helpers `project`, `run`).

## Constraints
- The installer is idempotent; user-level reinstall is how the running client picks up the fix.
- `root`/`scope` are used by several checks; keep the change inside the user-level, not-initialized branch only.

## Reuse candidates
- `repoRootOf` style walk already exists implicitly in `findScope`; add a `.git` marker walk.
- `createHash` from `node:crypto` for a short, filesystem-safe per-project state name.

## Unknowns / risks
- Uninitialized projects without `.git` have no reliable boundary; fall back to the session `cwd`.
- A fix in `locate` changes protected-path behavior in user-level uninitialized projects (intended; it closes a bypass).
- Backfilling 005 is not reliable (step boundaries live only in the lost hook state) — out of scope.

## Token usage
Tokens: unknown
