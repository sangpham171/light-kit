---
step: conclusion
runs:
  - agent: light-orchestrator
    part: conclusion
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  - step: 00-request
    tokens: 48,240 input · 421,888 cache read · 0 cache write · 6,830 output · 476,958 total
    time: 1m 31s
  - step: 10-understanding
    tokens: 440 input · 109,312 cache read · 0 cache write · 2,044 output · 111,796 total
    time: 9s
  - step: 40-plan
    tokens: 148 input · 56,704 cache read · 0 cache write · 1,942 output · 58,794 total
    time: 9s
  - step: 50-implementation
    tokens: 25,276 input · 4,749,440 cache read · 0 cache write · 40,501 output · 4,815,217 total
    time: 9m 12s
  - step: 60-conclusion
    tokens: 2,983 input · 360,832 cache read · 0 cache write · 2,244 output · 366,059 total
    time: 19s
  - step: total
    tokens: 77,087 input · 5,698,176 cache read · 0 cache write · 53,561 output · 5,828,824 total
    time: 11m 23s
---

# Conclusion

## Summary
Each request folder now carries its own agent and skill usage: `specs/<NNN-slug>/agent-skill-usage.json`
and `.md`. The project-wide `.light-kit/agent-skill-usage.*` stays the source of truth and keeps
working as before; the request copy holds only that request's row.

## What changed
Range: `6432c74a7ee559c742dc088fd1d9e84d065d9185..HEAD` on `feat/051-agent-skill-usage-per-spec`
- `kit/hooks/lib/usage-stats.mjs`: exported file names, `saveRequestStats` (derived, best-effort), a
  request-specific table heading and `Total` footer.
- `kit/hooks/checks/agent-skill-usage.mjs`: writes the request pair after the aggregate.
- `kit/hooks/record-usage.mjs`: writes the request pair and honors `hooks.agent-skill-usage: "off"`.
- `tools/backfill-usage.mjs`: refreshes every request pair (heals a deleted one), honors the switch,
  and compares real paths at the CLI entry.
- Tests, `kit/hooks/README.md`, `docs/safety-hooks.md`, `specs/README.md` and `.light-kit/codebase-map.md`.
- `.light-kit/rules.md`: R-007 second violation; new pending R-009 (assertions must be able to fail)
  and R-010 (every entry point honors the same switch).

## Verification evidence
- `node --test tests/agent-skill-usage.test.mjs tests/record-usage.test.mjs tests/backfill-usage.test.mjs` — 29 pass, 0 fail.
- `npm test` — 226 pass, 0 fail.
- Backfill probe on this repository: 40 calls found, every request pair refreshed, `051`'s own pair created.

## Deferred technical debt and open findings
- TD-1: per-request files dirty tracked `specs/` on every agent or skill call and nothing commits them
  automatically (unlike the tool log) — open, follow-up: let the stop hook commit them or ignore them.
- TD-2: the user-level install at `~/.light-kit` predates the change, so live calls write only the
  aggregate until the kit is reinstalled — open, user action.
- Earlier open debt still open: 042 TD-1 (Cursor/Codex matchers), 042 TD-2 (no write lock),
  048 TD-1 (200-id dedupe window), 048 TD-2 (import lives only in the kit repository), 049 TD-1
  (inline use needs the agent to run the command), 049 TD-2 (one project per invocation).
- Review round 1 had no open finding; F-1.1–F-1.8 are fixed and recorded in `50-implementation.md`.

## Follow-ups
- Reinstall the kit to give the live hooks the per-request write (TD-2).
- Decide whether the stop hook should commit usage files beside the tool logs (TD-1).
