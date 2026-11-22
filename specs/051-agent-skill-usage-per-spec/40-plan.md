---
step: plan
runs:
  - agent: light-orchestrator
    part: plan
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 148 input · 56,704 cache read · 0 cache write · 1,942 output · 58,794 total
  time: 9s
---

# Plan

- [ ] 1. Add the per-request writer to `kit/hooks/lib/usage-stats.mjs`: export the file-name constants and `saveRequestStats(requestDir, stats, request)`, which renders that request's row with `renderTable` and writes a versioned JSON + Markdown pair atomically — level: easy — files: `kit/hooks/lib/usage-stats.mjs` — verify: covered by task 4 — commit: `feat(hooks): store usage in each request folder`
- [ ] 2. Call it from the `agent-skill-usage` check after the aggregate write, skipping `(no request)`; reuse the constants — level: easy — files: `kit/hooks/checks/agent-skill-usage.mjs` — verify: `node --test tests/agent-skill-usage.test.mjs` — commit: same as task 1
- [ ] 3. Call it from `record-usage.mjs` and from `tools/backfill-usage.mjs` (every request in the merged stats, not `(no request)`), reusing the constants — level: medium — files: `kit/hooks/record-usage.mjs`, `tools/backfill-usage.mjs` — verify: `node --test tests/record-usage.test.mjs tests/backfill-usage.test.mjs` — commit: `feat(hooks): keep record and backfill usage in request folders`
- [ ] 4. Extend the three test files: per-request files written and isolated per request, none for `(no request)`, `--request`, backfill, off switch, corrupt per-request file repaired — level: medium — files: `tests/agent-skill-usage.test.mjs`, `tests/record-usage.test.mjs`, `tests/backfill-usage.test.mjs` — verify: `node --test tests/agent-skill-usage.test.mjs tests/record-usage.test.mjs tests/backfill-usage.test.mjs` — commit: `test(hooks): cover per-request usage files`
- [ ] 5. Document the per-request files in `kit/hooks/README.md`, `docs/safety-hooks.md` and `specs/README.md` — level: easy — files: those three — verify: read-back — commit: `docs(hooks): document per-request usage files`
- [ ] 6. Run `npm test`, review, apply findings and conclude — level: medium — files: `50-implementation.md`, `60-conclusion.md`, `.light-kit/rules.md` — verify: `npm test` — commit: `docs(spec): conclude request 051`

## Risks
- A stats write now touches two locations; the per-request write must never fail the call, so it is best-effort and atomic like the aggregate.
- Multi-project workspaces: the per-request folder comes from the request's own `home`, not the scope.

## Test strategy
Node built-in tests with a temporary installed kit, extending the existing harness; one test per
acceptance criterion. Then `npm test`.

## Parallelisable tasks
None: tasks 1–3 share the new helper and constants.
