---
step: 40-plan
runs:
  - agent: light-tech-lead
    part: ordered tasks and acceptance checks
    model: deepseek-flash[1m]
    thinking: unknown
    level: medium
usage:
  tokens: 0 input · 0 cache read · 0 cache write · 0 output · 0 total
  time: 0s
---

# Plan

| # | Task | Files | Acceptance check | Level |
|---|---|---|---|---|
| 1 | Extract the `runs:` header parser into a shared lib and use it from `artifact-header`. | `kit/hooks/lib/runs.mjs` (new), `kit/hooks/checks/artifact-header.mjs` | `node --test tests/hooks.test.mjs` still passes; a header with a conclusion `usage:` list returns only agent runs. | easy |
| 2 | Add `reconcileAgents` to the stats lib: raise each agent to its header-run count, never lower it, repair a malformed row. | `kit/hooks/lib/usage-stats.mjs` | A focused test shows a missing agent filled in and a higher existing count left alone. | medium |
| 3 | Extend the hook: attribute calls by named request, count installed skill-file reads, reconcile on artifact writes and on stop across tracked/active requests, honor the off switch through `run.mjs`. | `kit/hooks/checks/agent-skill-usage.mjs` | New tests for attribution, skill read, post-tool reconcile, stop reconcile, off switch. | hard |
| 4 | Add the regression tests for acceptance 1–6, each able to fail (R-009). | `tests/agent-skill-usage.test.mjs` | `node --test tests/agent-skill-usage.test.mjs` passes, and each new test fails against the old hook. | medium |
| 5 | Update the hook reference and the core instruction: the hook derives counts from headers and skill reads; the manual command covers only uses with no other record. | `kit/hooks/README.md`, `kit/instructions/core.md` | Text matches the implemented behavior; no stale "only path" claim. | easy |
| 6 | Repair the reported row: record `light-developer` for ai-it-team request 095 and refresh its copy. | `ai-it-team/.light-kit/agent-skill-usage.{json,md}`, `ai-it-team/specs/095-…/agent-skill-usage.{json,md}` | `light-developer: 1` appears for 095 in the aggregate and the request copy. | easy |
| 7 | Run the full suite and the review cycle. | all | `npm test` passes; reviewer findings resolved in one turn. | medium |

## Order and commits

1 → 2 → 3 → 4 in one implementation commit (the libs have no user-facing effect alone), then 5
(docs), then 6 (data repair in the other repository, committed there), then review fixes.

## Rules carried

R-002 (repair nested rows), R-004 (commit hook-written state), R-007 (dedupe by real path),
R-009 (failable assertions), R-010 (off switch), R-011 (derive from the existing record).
