---
runs:
  - step: implement
    agent: light-orchestrator
    model: deepseek-flash[1m]
    thinking: unknown
    level: medium
---

# Implementation log

## Progress
- T1 — `d52d7e1` fix(hooks): anchor user-level checks at the project root (`locate` anchors an uninitialized user-level project at its repository root, else the session folder; `normalize` passes the session `cwd`).
- T2 — `95c401a` fix(hooks): report token usage in projects without init (`token-usage` no longer requires `kitEnabled`; user-level state under `<home>/.light-kit/state/`, one file per project).
- T3 — `6f83a8b` docs: describe user-level token state and path anchoring.
- T4 — reinstall of the user-level kit (`node tools/install.mjs --level user`; 4 then 1 file written); the live hook fired on the first write of this file and reported 7,983,404/127,466.
- Review fix — `186f2ef` fix(hooks): find the project root outside the home folder.

## Technical debt
- TD-1 `kit/hooks/lib/config.mjs` — an uninitialized project that is not a git repository falls back to the session folder; a session started in a subfolder then keys the token state per folder, splitting a request's totals — status: deferred (no stable marker exists; `specs/`- and `cwd`-based detection would be guesses).
- TD-2 `kit/hooks/checks/token-usage.mjs` — moving from a user-level project to an initialized one starts the per-request totals from zero (different state file) — status: deferred (state is local; totals restart once).
- TD-3 `kit/hooks/checks/token-usage.mjs` — inherited from request 004: subagent transcripts are not counted, and the final edit that fills the section is not in the recorded value — status: noticed (pre-existing, documented in `docs/usage.md`).
- TD-4 `kit/hooks/checks/audit-log.mjs` — enabled (it is off by default) in an uninitialized user-level project, it now writes `<project>/.light-kit/audit.log`, which creates `.light-kit/` and makes later hooks treat the project as initialized — status: deferred (opt-in; fix by moving the default log under the kit state folder if it is ever enabled by default).
- TD-5 `~/.light-kit/state/` — one file per project, never pruned — status: deferred (small files; prune when a long-lived user-level install asks for it).

## Decisions and deviations
- Fixed the anchoring in `locate` rather than duplicating path logic in `token-usage`: the wrong root also disabled `protect-paths` in uninitialized user-level projects (`.git/config`, `.claude/settings.json` were allowed — reproduced in a temp install). One fix covers both.
- State for uninitialized projects lives in `~/.light-kit/state/usage-<project>-<hash>.json`, not in the project: writing `usage.json` under `<project>/.light-kit/` would create that folder and make later hooks treat the project as initialized.
- `kitEnabled` stays false in such projects, so `require-spec`, `artifact-header`, `commit-checkpoint` and the init reminder are unchanged; only `token-usage` now acts, and only on `specs/<id>/<step>.md`.
- No backfill of requests 001–005: their per-step boundaries were never recorded.

## Verification (commands run and results)
- `node --test tests/hooks.test.mjs` — 35 tests, 35 pass (2 new: project-root anchoring, user-level token reporting).
- `npm test` — 108 tests, 108 pass.
- Temp user-level install, project with `.git` and no `.light-kit`: `.git/config` and `.claude/settings.json` writes now exit 2; a spec-artifact write reports `Tokens: <in>/<out>`; no `.light-kit/` is created in the project.

## Review rounds
Round 1 of 1 (light-reviewer, plus light-tester verification).
- F-1.1 [should-fix] 50-implementation.md — `Tokens:` still `unknown` although the live hook reported numbers — filled below; unknown steps predate the reinstall — status: fixed.
- F-1.2 [should-fix] kit/hooks/lib/config.mjs:58 — `repoRootOf` stopped at `$HOME`, so a project outside the home folder was anchored at the session folder — walk to the filesystem root when `start` is outside home; test added (subfolder cwd, absolute paths) — status: fixed (`186f2ef`).
- F-1.3 [nit] token-usage.mjs — state filename keyed on the anchor, so the session-folder fallback splits totals — recorded as TD-1 — status: fixed (debt recorded).
- F-1.4 [nit] audit-log.mjs — project-root anchoring makes an enabled user-level audit log create `.light-kit/` in the project — recorded as TD-4 — status: fixed (debt recorded).
- F-1.5 [nit] tests/hooks.test.mjs — no second-write or outside-home coverage — second call asserting baseline advance and an outside-home test added — status: fixed (`186f2ef`).
- F-1.6 [nit] 40-plan.md, status.md — tasks unchecked, step stale, implementation log uncommitted — ticked and committed — status: fixed.
Verdict: changes requested → all addressed.

## Token usage
Tokens: 10305354/158274 (total 10463628)
