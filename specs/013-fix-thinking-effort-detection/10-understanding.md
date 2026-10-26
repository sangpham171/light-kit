---
runs:
  - step: understand
    agent: light-orchestrator
    model: deepseek-flash[1m]
    thinking: high
    level: easy
---

# Understanding

## Restatement
The `session-context` hook must tell the agent the client's thinking effort whenever the client exposes it, including in projects where light-kit is only installed at user level and at the start of a fresh session.

## Root causes (verified)
1. `kit/hooks/checks/session-context.mjs:10` returns early when `ctx.userLevel && !ctx.kitEnabled` (user-level install, project without `.light-kit/`) before calling `detectEffort`. In this repository the hook printed only the "not set up in this project" line, so no effort line ever reached the agent.
2. `effortFromTranscript` reads only the current session transcript. Claude Code creates that file at session start with a single `mode` entry and writes `effort` on assistant entries, so at `session-start` a new session (after `/clear` or `--continue` of an empty one) has nothing to read. Verified on `/Users/light/.claude/projects/-Users-light-Documents-code-light-kit/451888af-….jsonl`: one `mode` entry at start, 21 assistant entries with `effort: "high"` later.

## Requirements
1. Detect the effort regardless of whether the project has `.light-kit/`; the init suggestion stays when configured.
2. When the current transcript has no effort yet, fall back to the newest other transcript of the same project directory.
3. Keep every reader fail-soft, read nothing but the effort value, no writes, no network.
4. Tests cover both fixes; docs state the fallback.

## Out of scope
- Mid-session `/effort` refresh (still TD-3 of request 002).
- Non-Claude sources (unchanged).

## Triage
Scores: scope 1, ambiguity 0, risk 0, novelty 0, impact 0 (total 1)
Workflow: direct
Why: two small, internal fixes in one component with a clear, testable outcome.

## Routing
- understand: easy
- implement: easy
- review-and-conclude: easy

## Token usage
Tokens: 1,250 input · 160,512 cache read · 0 cache write · 1,087 output · 162,849 total
Time: 8s
