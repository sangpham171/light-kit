---
step: conclude
runs:
  - agent: light-orchestrator
    part: conclusion
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  - step: 00-request
    tokens: 66,131 input · 934,912 cache read · 0 cache write · 15,455 output · 1,016,498 total
    time: 5m 43s
  - step: 10-understanding
    tokens: 0 input · 0 cache read · 0 cache write · 0 output · 0 total
    time: 5s
  - step: 40-plan
    tokens: 3,591 input · 1,210,240 cache read · 0 cache write · 18,390 output · 1,232,221 total
    time: 2m 6s
  - step: 50-implementation
    tokens: 8,223 input · 2,205,824 cache read · 0 cache write · 11,604 output · 2,225,651 total
    time: 8m 15s
  - step: 60-conclusion
    tokens: 0 input · 0 cache read · 0 cache write · 0 output · 0 total
    time: 0s
  - step: total
    tokens: 77,945 input · 4,350,976 cache read · 0 cache write · 45,449 output · 4,474,370 total
    time: 16m 10s
---

# Conclusion

## Summary
A new `agent-skill-usage` hook counts every agent and skill invocation against the request the session is working on. It keeps two files in `.light-kit/`: `agent-skill-usage.json` (versioned source of truth with per-request agent/skill counts and first/last use) and `agent-skill-usage.md` (the table the user asked for — first column the request, one column per name, last row `**All requests**` with totals). Calls made before a request exists appear under `(no request)` instead of being lost; a re-delivered event is counted once.

## What changed
Range: `af6bed10aedce0570aa339a648e08fc237cec295..HEAD` on `feat/042-agent-skill-usage`
- `kit/hooks/lib/usage-stats.mjs` (new) — call detection (`Agent`/`Task`/`Skill` plus input-shape fallback), dedupe by tool-call id, tolerant read/repair, atomic save, Markdown renderer.
- `kit/hooks/checks/agent-skill-usage.mjs` (new) — attributes each call to the working request (the `tool-log` rule), writes both files in the request's own `.light-kit/`, silent and non-blocking.
- `kit/hooks/checks/index.mjs`, `kit/hooks/lib/config.mjs` — registered with a `warn` default; `hooks.agent-skill-usage: "off"` disables it.
- `kit/hooks/lib/normalize.mjs` — exposes the parsed tool input as `ctx.input`.
- `tools/build.mjs` — the Claude post-tool matcher now includes `Task|Agent|Skill`, so agent and skill calls reach the hooks (Copilot already receives every tool call).
- `tests/agent-skill-usage.test.mjs` (new) — 11 tests covering counts, totals, dedupe, aliases, corrupt state, `(no request)`, unmanaged projects, `off` and the matcher.
- `kit/hooks/README.md`, `docs/safety-hooks.md` — hook table, the JSON/Markdown pair, detection and coverage.
- `specs/042-agent-skill-usage/` — request, understanding, plan, implementation log and this conclusion.

## Verification evidence
- `node --test tests/agent-skill-usage.test.mjs` — 11 pass, 0 fail.
- `npm test` — 206 pass, 0 fail (includes kit lint).
- Review round 1 (independent reviewer): approve; 6 nits, all fixed in `fce9a45`, `ae66573`, `b3bf8e9` and the spec commits.

## Deferred technical debt and open findings
- TD-1: Cursor's and Codex's generated matchers do not list agent or skill tools, so those clients record nothing even if they expose one. Deferred — verify each client's real tool names before widening its matcher.
- TD-2: read-modify-write without a lock; parallel agent completions can rarely lose one increment. Accepted — the JSON stays valid, and a lock is the follow-up if fan-out becomes common.
- Earlier open debt is unchanged: 004 TD-2 / 006 TD-3 (subagent transcript token usage not seen by `token-usage`), 027's unrotated tool log, 036's brainstorm-map header, 038 TD-1/TD-2, 039/040's merge prose and threshold items, and 041's TD-1…TD-4. R-001 (`pending`) applied; no violation.
- No review finding remains open.

## Follow-ups
- An existing installation sees the feature only after the kit is reinstalled (`npm run install-kit -- <target>`): the generated `.claude/settings.json` gains the new matcher and the new hook file is copied into `.light-kit/hooks/`. Until then, no stats file appears.
- The two stats files are local state like `.light-kit/usage.json`; add them to the ignore file if they should not be committed.
