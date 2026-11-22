---
step: 60-conclusion
runs:
  - agent: light-tech-writer
    part: conclusion
    model: deepseek-flash[1m]
    thinking: unknown
    level: medium
usage:
  - step: 00-request
    tokens: 95,232 input · 1,818,624 cache read · 0 cache write · 30,982 output · 1,944,838 total
    time: 6m 58s
  - step: 10-understanding
    tokens: 178 input · 124,672 cache read · 0 cache write · 1,280 output · 126,130 total
    time: 6s
  - step: 20-discovery
    tokens: 1,948 input · 380,672 cache read · 0 cache write · 1,716 output · 384,336 total
    time: 11s
  - step: 40-plan
    tokens: 0 input · 0 cache read · 0 cache write · 0 output · 0 total
    time: 0s
  - step: 50-implementation
    tokens: 21,279 input · 9,346,688 cache read · 0 cache write · 51,594 output · 9,419,561 total
    time: 10m 27s
  - step: 60-conclusion
    tokens: 1,073 input · 985,600 cache read · 0 cache write · 3,177 output · 989,850 total
    time: 59s
  - step: total
    tokens: 119,710 input · 12,656,256 cache read · 0 cache write · 88,749 output · 12,864,715 total
    time: 18m 43s
---

# Conclusion

## What changed

- `kit/hooks/lib/runs.mjs` (new) parses an artifact's `runs:` header; `artifact-header` shares it.
- `usage-stats.mjs` adds `reconcileAgents`: each agent's count rises to the number of header runs and
  never falls, so a call or manual record already counted is not doubled.
- `agent-skill-usage.mjs` now attributes a call to the request its prompt names, counts a read of an
  installed `light-*` `SKILL.md`, reconciles the request whose artifact was written, and reconciles
  tracked/active requests on stop. Writes are best-effort per project home; the off switch and the
  unmanaged-project rule are unchanged.
- `tests/agent-skill-usage.test.mjs`: 16 new tests. `kit/hooks/README.md`, `docs/safety-hooks.md`
  and `kit/instructions/core.md` describe the new sources and the remaining manual gap.

Commits: `0406c89` feature, `64f386f` review fixes, `9e17152`/`cef3b1a` state, on
`fix/053-usage-record-reconcile` from `48b1c16` (main).

## Reported defect

`ai-it-team/specs/095-…` credited `light-developer` while the usage row did not. The new
reconciliation filled it and two more orchestrator runs the headers credited (1 → 3); committed in
ai-it-team as `c5cddaf6`. The reviewer call that had been moved from 083 to 095 by hand would now be
attributed to 095 from its prompt.

## How it was verified

- Focused tests: `agent-skill-usage` + `record-usage` 38 pass.
- Full suite after the review fixes: `npm test` — 259 pass, 0 fail.
- Independent review: 1 turn, 6 should-fix fixed, 1 nit fixed, 1 nit declined with evidence, 1
  limitation accepted as debt.

## Open follow-ups

- TD-1: a per-agent floor cannot separate a call-run with no artifact from a header run of the same
  agent; exact matching needs a per-run identity. Documented; no consumer needs it today.
- TD-2: the installed user-level hook keeps the old behavior until the kit is reinstalled
  (`npm run install-kit -- ~`). Projects get the fix at that point; the repository and its tests
  already run the new code.
- Older requests are not backfilled beyond those already tracked or active (R-006); the reported 095
  row was repaired explicitly.

## Rules

- R-001: no earlier request debt was left open by this change.
- R-002, R-004, R-006, R-007, R-009, R-010 applied and kept.
- R-011 added pending and not violated by this change.
- `rules: no further change`.
