---
runs:
  - step: conclude
    agent: light-orchestrator
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
---

# Conclusion

## Summary
Token usage now reaches request artifacts in projects that never ran `light-init` under a user-level install — including this repository. Two bugs caused the `unknown` sections: `token-usage` required `kitEnabled`, and at user level without `.light-kit` the hook anchored paths at the edited file's own folder, so `ctx.rel()` was a bare file name and the artifact pattern never matched. Fixing the anchor also restored `protect-paths` in those projects (`.git/config`, `.claude/settings.json` had been allowed; reproduced before the fix).

## What changed
Range: `04f0420104c9e71396543325807bb7fb94486add..HEAD` on `fix/006-token-usage-unknown`
- `kit/hooks/lib/config.mjs` — `repoRootOf` + an anchor for `userLevel && !kitEnabled`: the project's repository root, else the session folder; outside the home folder the walk goes to the filesystem root.
- `kit/hooks/lib/normalize.mjs` — passes the session `cwd` to `locate` as the fallback.
- `kit/hooks/checks/token-usage.mjs` — no `kitEnabled` gate (a spec artifact is evidence enough); user-level state in `<home>/.light-kit/state/usage-<project>-<hash>.json` so reporting never creates `.light-kit/` in the project.
- `tests/hooks.test.mjs` — three tests: project-root anchoring for path checks, user-level token reporting with a second-write baseline advance, and an outside-home project.
- `kit/hooks/README.md`, `docs/usage.md`, `docs/safety-hooks.md` — where the state lives and that the path rules hold in uninitialized projects.
- Commits: `d52d7e1`, `95c401a`, `6f83a8b`, `186f2ef`, plus the spec commits.

## Verification evidence
- `npm test`: 109 tests, 109 pass.
- Independent verification (light-tester, temp installs): 35/35 scenario checks — user/project/workspace levels, initialized and uninitialized projects, subfolder cwd, no-git fallback, outside-home project, two projects with separate state files; no regression in `require-spec`/`artifact-header`.
- Live check: the reinstalled user-level hook fired on this request's artifacts and recorded numbers in `~/.light-kit/state/`; no `.light-kit/` was created in this repository.
- Review: 1 round, 2 should-fix and 4 nits — all addressed.

## Token usage
| Step | Input | Output | Total |
|---|---|---|---|
| request | unknown | unknown | unknown |
| understand | unknown | unknown | unknown |
| discover | unknown | unknown | unknown |
| plan | unknown | unknown | unknown |
| implement (incl. review and fixes) | 10305354 | 158274 | 10463628 |
| conclude | 721856 | 13762 | 735618 |
| **Total** | 11027210 | 172036 | 11199246 |

The numbers are the hook's per-artifact records: `implement` is `50-implementation.md` (it includes the review rounds), `conclude` is this file. Request, understanding, discovery and the original plan were written before the kit was reinstalled, so no baseline exists (`unknown`); the later plan-tick write recorded 0/0 and adds nothing. The final edit that fills this table is not counted (TD-3).

## Deferred technical debt and open findings
- TD-1 non-git uninitialized project: the session-folder fallback splits token state per folder (no stable marker exists).
- TD-2 user-level → initialized project: per-request totals restart from zero (different state file).
- TD-3 inherited: subagent transcripts are not counted; the final edit filling an artifact is not in its recorded value.
- TD-4 `audit-log` (off by default), enabled at user level in an uninitialized project, writes `<project>/.light-kit/audit.log` and would flip `kitEnabled`; move its default under the kit state folder if it ever becomes the default.
- TD-5 `~/.light-kit/state/` is never pruned.

## Follow-ups
- Requests 001–005 keep `unknown`: their steps predate the fix and no per-step baseline exists; backfilling would invent step boundaries.
- This repository still has no `.light-kit/`; run `/light-init` if the kit should govern its own source.
