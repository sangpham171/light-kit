---
runs:
  - step: understand
    agent: light-orchestrator
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
---

# Understanding

## Restatement
Every artifact keeps recording its step's token consumption under `## Token usage`, and also records the time spent in that step. `60-conclusion.md` carries the per-step table with a Time column and the overall total.

## Time source and definition
- The Claude Code session transcript is the only readable source. Each entry carries an ISO `timestamp`.
- Active time is the sum of gaps between consecutive timestamped entries. A gap longer than 15 minutes is treated as idle (the user or agent was away) and counts as zero.
- A step's time is the active-time delta since the previous artifact snapshot in the same session. Time spent before the request's first artifact is assigned to that artifact, matching how tokens are counted.
- Per-request per-step time accumulates in the same state file as tokens.
- No timestamps (other clients, or a transcript without them) means `unknown`.

## Assumptions
- Best-effort like the token count: usage and time spent in a separate subagent transcript are not seen.
- A step written twice accumulates both segments, as tokens already do.
- Changing the clock, or entries out of order, cannot reduce the total: deltas clamp at zero.

## Requirements
1. `kit/hooks/lib/usage.mjs` returns `timeMs` and `timeKnown` from the transcript, plus `formatDuration(ms)` (`45s`, `2m 5s`, `1h 4m`), and `deltaUsage` carries the time delta.
2. `token-usage` reports time next to tokens, accumulates it per step and request, includes a Time column in the suggested table, and treats a section as filled only when both tokens and time are present (a duration when time is known, `unknown` when it is not).
3. All seven templates gain `Time: unknown`; the conclusion table gains a Time column.
4. Core rule 12, `docs/usage.md`, `kit/hooks/README.md` and `docs/safety-hooks.md` describe the field, its calculation and its limits.
5. Tests cover the reader, the formatter, the delta, the hook message and the templates.

## Acceptance criteria
- Writing a request artifact in a Claude Code session with a timestamped transcript reports `time <duration>` and `Time: <duration>`; a second write after both fields are filled stays silent.
- A transcript without timestamps yields `Time: unknown` and no error.
- `npm test` passes.
- No artifact template lacks a Time line; the conclusion template has a Time column and the total row includes it.

## In scope / Out of scope
In: usage reader, formatter, delta, `token-usage` hook, templates, core rule, docs, tests.
Out: timing non-Claude clients; per-tool or per-agent timing; cost calculation; editing artifacts automatically.

## Triage
Scores: scope 2, ambiguity 1, risk 1, novelty 1, impact 1 (total 6)
Workflow: standard
Why: several components change, but the time reader extends the existing usage reader and no data or security surface is touched.

## Routing
- discover: easy — files and pattern known from request 004.
- plan: easy — three tasks.
- implement: medium — time deltas, idle gaps, fill detection.
- verify-and-review: medium — accounting and unknown paths.
- conclude: easy.

## Token usage
Tokens: 226326/3400 (total 229726)
Time: unknown (installed hook does not report time yet)
