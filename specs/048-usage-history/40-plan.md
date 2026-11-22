---
step: plan
runs:
  - agent: light-tech-lead
    part: implementation plan
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 0 input · 0 cache read · 0 cache write · 0 output · 0 total
  time: 0s
---

# Plan

- [ ] 1. Add `tools/backfill-usage.mjs`: read Claude Code session records, keep Agent/Task/Skill calls whose `cwd` is under the project, attribute each to an existing `specs/<slug>` named in it else `(no request)`, merge with `readStats`/`recordCall` and write both files — level: medium — files: `tools/backfill-usage.mjs`, `package.json` — verify: `node tools/backfill-usage.mjs --root . --dry-run` prints a count and changes nothing — commit: `feat(tools): import agent and skill usage from session records`
- [ ] 2. Test it: attribution, `(no request)` fallback, other-project exclusion, dedupe and a second run adding zero — level: easy — files: `tests/backfill-usage.test.mjs` — verify: `node --test tests/backfill-usage.test.mjs` — commit: `test(tools): cover the usage import`
- [ ] 3. Run it on this project and check the totals per request against the session records — level: easy — files: `.light-kit/agent-skill-usage.json`, `.light-kit/agent-skill-usage.md` — verify: the second run adds 0; every request's count matches the scanned calls — commit: `chore(stats): import the existing agent and skill calls`
- [ ] 4. Document the command and its definition of a counted use — level: easy — files: `docs/usage.md` — verify: `npm test` — commit: `docs(kit): document the usage import`
- [ ] 5. Conclude the request, recording R-006 — level: easy — files: `specs/048-usage-history/*` — verify: `npm test` — commit: `docs(spec): conclude request 048`

Each task = one verified, coherent commit.

## Risks
- A slug mentioned only as context could misattribute a call; the slug must name an existing `specs/` folder.
- Very large transcript folders slow the scan; the tool is manual and reports progress by total.
- The import must not touch the live hook or reset `recent`.

## Test strategy
- Focused `node --test tests/backfill-usage.test.mjs` with fixture transcripts: attributed call, `(no request)` call, other-project call, duplicate id, pre-recorded id, second run.
- `npm test` after the tool and the docs task.

## Parallelisable tasks
- Tasks 1 and 4 touch different files; 2 depends on 1, 3 depends on 1 and 2. Run in order.
