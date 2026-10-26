---
runs:
  - step: plan
    agent: light-tech-lead
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
---

# Plan

## Task 1 — Time reader, formatter and delta in `usage.mjs`
- Add `IDLE_MS` (15 min). `usageFromTranscript` accumulates `timeMs` from consecutive valid timestamps, skipping gaps over `IDLE_MS`, and reports `timeKnown`.
- Add `formatDuration(ms)`: `0s`, `45s`, `2m 5s`, `1h 4m`.
- `deltaUsage` returns `timeMs` (clamped at zero) and `timeKnown`.
- Acceptance: `tests/usage.test.mjs` passes with new cases for timestamps, idle gaps, formatting and the delta.

## Task 2 — `token-usage` hook reports and accumulates time
- Session snapshots store `timeMs`; step totals store `timeMs` and `timed` (missing in old state means unknown).
- Output names the step time, the request time and a Time column in both the suggested section and table; the total row includes time.
- A section counts as filled only with tokens and time: a duration when timestamps exist, `unknown` when they do not.
- Acceptance: `tests/hooks.test.mjs` token-usage scenarios pass with timestamps and both fill states.

## Task 3 — Templates and docs
- Six step templates add `Time: unknown`; `60-conclusion.md` table gains a Time column and the total row fills it.
- Core rule 12, `docs/usage.md`, `kit/hooks/README.md`, `docs/safety-hooks.md` describe time, the idle gap and its limits.
- Acceptance: `tests/kit.test.mjs` asserts the Time line in every template and the Time column in the conclusion.

## Task 4 — Full verification
- Acceptance: `npm test` passes; grep shows no template without a Time line.

## Risks
- Fill detection could nag on an artifact whose time is legitimately `unknown`; handled by accepting `unknown` only when the transcript has no timestamps.
- Old state files must not turn into zero time; `timed` defaults to false and displays `unknown`.

## Token usage
Tokens: 241712/3898 (total 245610)
Time: unknown (installed hook does not report time yet)
