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
Every request artifact records the token consumption of its step, and `60-conclusion.md` records the overall consumption of the request. The client supplies the numbers; when it exposes none, the artifact says `unknown`.

## Assumptions
- Claude Code's session transcript is the only readable usage source among the supported clients; its `assistant` entries carry `message.usage` (input, cache write, cache read, output).
- Per-step consumption is the token delta since the previous artifact write, measured once per session and accumulated per request and step in a local state file.
- Hooks cannot edit artifacts: the new `token-usage` hook reports the numbers after an artifact write and the agent fills the template section.
- Subagent and sidechain usage counts when it appears in the same transcript; usage from separate transcripts is out of reach and stays unaccounted.

## Open questions (with proposed defaults)
None blocking. Defaults: display `tokens: <input>/<output>` where input includes cached prompt tokens; keep the cache breakdown in the state file; `unknown` for Copilot, Cursor and Codex.

## Requirements
1. All seven artifact templates carry a `## Token usage` section; `60-conclusion.md` carries a step table and a total.
2. `kit/hooks/lib/usage.mjs` reads cumulative usage from a Claude Code transcript, failing soft.
3. A `token-usage` hook (after a write, warn by default) reports the delta for the written artifact, accumulates it per request and step in `.light-kit/usage.json`, and names the files still to fill.
4. No message when the client has no transcript, or when the artifact already has a numeric value.
5. Core rule 12, `docs/usage.md`, `kit/hooks/README.md`, `docs/safety-hooks.md` and the hooks-config skill describe the field and its limits.
6. Tests cover the reader, the hook behaviour, the state accumulation, and the templates.

## Acceptance criteria
- In a Claude Code session with a usage-bearing transcript, writing a spec artifact produces a note with input/output numbers; a second write after the section is filled produces no note; `.light-kit/usage.json` holds the per-step totals.
- A client without a transcript produces no note and leaves `unknown`.
- `npm test` passes, including the new tests.
- Every artifact template contains `## Token usage`; the conclusion template contains the step table and `**Total**`.

## In scope / Out of scope
In: usage reader, `token-usage` hook, config defaults, templates, core rule, docs, tests.
Out: reading usage from Copilot, Cursor or Codex; changing what clients store; budgeting or cost calculation; automatic artifact edits.

## Triage
Scores: scope 2, ambiguity 1, risk 1, novelty 1, impact 1 (total 6)
Workflow: standard
Why: several components change, but the reader follows the existing `effort.mjs` pattern and no data, security or public API is touched.

## Routing
- understand: easy — scope is clear.
- discover: easy — the hooks, templates and tests are known.
- plan: easy — three tasks.
- implement: medium — state handling, deltas, fail-soft.
- verify-and-review: medium — check accounting and opt-out paths.
- conclude: easy — short summary.
