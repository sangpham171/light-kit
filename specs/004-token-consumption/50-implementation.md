---
runs:
  - step: implement
    agent: light-orchestrator
    model: deepseek-flash[1m]
    thinking: unknown
    level: medium
  - step: verify-and-review
    agent: light-orchestrator
    model: deepseek-flash[1m]
    thinking: unknown
    level: medium
---

# Implementation log

## Progress
- T1 — `2fe2063` feat(hooks): report per-step token usage (`kit/hooks/lib/usage.mjs`, `kit/hooks/checks/token-usage.mjs`, registry, config, tests).
- T2 — `23b81bc` docs(templates): record token usage per step and per request (seven templates, core rule 12, template test).
- T3 — `e41cbcf` docs: describe token-usage reporting (hooks README, usage, safety hooks, hooks-config skill).
- Review fixes — `e0775b6` fix(hooks): detect filled token tables and absolute paths.

## Technical debt
- TD-1 `kit/hooks/lib/usage.mjs` — only the Claude Code transcript is readable; Copilot, Cursor and Codex stay `unknown` — inherent: the kit has no verified usage source for them — status: deferred (revisit if a client exposes one).
- TD-2 `kit/hooks/checks/token-usage.mjs` — usage written to a separate subagent transcript is not seen — status: deferred (Claude Code normally keeps sidechains in the parent transcript; verify on a session that fans out heavily).
- TD-3 `kit/hooks/checks/token-usage.mjs` — the edit that fills the section is counted in the state but not in the recorded value, so the conclusion total can exceed the sum of the rows — status: deferred (the gap is the final edit only; documenting it costs more than it is worth).
- TD-4 `kit/hooks/checks/token-usage.mjs` — `.light-kit/usage.json` keeps one entry per session forever — status: deferred (small objects; prune if a long-lived project asks for it).
- TD-5 `kit/hooks/checks/token-usage.mjs` — several artifacts written in one assistant message attribute all tokens to the first one — status: deferred (agents write artifacts one at a time).

## Decisions and deviations
- A `## Token usage` section per artifact instead of a field on each `runs:` line: the hook measures the step, not each agent's share, so a per-run field would imply precision that does not exist.
- A post-write hook with a per-session baseline instead of a CLI the agent must remember to call: the numbers arrive exactly when the artifact is written.
- `input` includes cached prompt tokens (all tokens the client processed); the cache split stays in the state file, and the docs say so.
- Deltas are clamped at zero: a smaller total means the session record was reset, so the baseline simply restarts.
- Plan ticks and this log are committed together after the three task commits (the code commits were made at each task's checkpoint).

## Verification (commands run and results)
- `node --test tests/usage.test.mjs tests/hooks.test.mjs` — 36 tests, 36 pass after the review regression test.
- `node --test tests/kit.test.mjs` — 18 tests, 18 pass.
- `npm test` — 106 tests, 106 pass (6 new: 3 reader, 3 hook integration; the template assertions were extended).

## Review rounds
Round 1 of 1 (self-review).
- F-1.1 [should-fix] `kit/hooks/checks/token-usage.mjs` — the filled-section test matched digits anywhere in a table row, so `| 10-understanding | unknown | unknown | unknown |` counted as filled — now only a numeric cell counts; regression test added — status: fixed (`e0775b6`).
- F-1.2 [nit] `kit/hooks/checks/token-usage.mjs` — absolute-path detection assumed a leading `/` — uses `isAbsolute` — status: fixed (`e0775b6`).
- F-1.3 [nit] `kit/hooks/checks/token-usage.mjs` — a malformed stored total could concatenate strings — coerced to numbers before adding — status: fixed (`e0775b6`).
- F-1.4 [should-fix] `docs/usage.md` — did not say that tokens spent before the request's first artifact belong to it — added — status: fixed (`e0775b6`).
- F-1.5 [nit] `docs/usage.md` — the artifact display does not show the cached share — the docs state that input includes it; the state file keeps the split — status: declined.
Verdict: approve.

## Token usage
Tokens: unknown
