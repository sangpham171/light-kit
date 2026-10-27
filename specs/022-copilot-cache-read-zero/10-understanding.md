---
step: understand
runs:
  - agent: light-orchestrator
    model: unknown
    thinking: high
    level: easy
usage:
  tokens: 0 input · 0 cache read · 0 cache write · 0 output · 0 total
  time: 0s
---

# Understanding

## Restatement
Request 021 made the `token-usage` hook read `session.usage_record` events from the agent-host log, so
Copilot sessions now report real input, output and time. Every Copilot artifact written since then shows
`0 cache read` and `0 cache write`. The question is whether the kit loses a figure Copilot does record.

## Evidence
- `kit/hooks/lib/usage.mjs` reads `cacheReadTokens` / `cacheWriteTokens` straight from each record and
  subtracts them from `inputTokens`; nothing else decides the value.
- This session (`6060dcba…`, `deepseek-flash`, `isByok: true`, `providerType: openai`) has 19 records,
  all with `cacheReadTokens: 0`, `cacheWriteTokens: 0` and `cacheDetailsReported: true`.
- The other four sessions on this machine split by provider: the three DeepSeek sessions
  (`eb8553d5`, `2375c25e`, `3246b665`) report `0` cache read over 9.3M, 4.7M and 3.5M input tokens,
  while the Copilot-hosted `gpt-6-luna` session (`a4494671`) reports 3,971,082 cache read and 111,564
  cache write over 4,082,799 input tokens.
- `session.shutdown` in the DeepSeek sessions repeats `cacheReadTokens: 0` in `modelMetrics`, so the
  closing summary agrees with the per-call records.
- Neither `~/.copilot/logs/*.log` nor the chat-panel log carries raw cache figures to fall back on.
- Run against this session, the reader returns `817,604 input · 0 cache read · 0 cache write · 7,719
  output · 825,323 total`, matching the event log.

## Assumptions
- The same reader parses both providers, so a parsing fault would show in `gpt-6-luna` too.
- `cacheDetailsReported: true` with zeros means the provider answered with an empty cached-token field,
  not that Copilot withheld the field.

## Open questions (with proposed defaults)
None. The user's premise — DeepSeek through Copilot — is confirmed as the source of the zeros.

## Requirements
1. State whether the kit drops a cache figure Copilot records. It does not.
2. Record in the user documentation that a whole-session `0 cache read` can come from the provider, so
   the next reader does not look for a kit fault.
3. Change no behaviour: the reported numbers stay what the client recorded.

## Acceptance criteria
- The documented behaviour matches what `usageFromCopilotEvents` does.
- `npm test` passes with the documentation change.

## In scope / Out of scope
- In: `docs/usage.md` caveat; this request's artifacts.
- Out: parsing DeepSeek's `prompt_cache_hit_tokens`, which no local record contains.

## Triage
Scores: scope 0, ambiguity 0, risk 0, novelty 0, impact 0 (total 0)
Workflow: direct
Why: the cause is established from the client's own records and the change is one documentation sentence.

## Routing
- request: easy — one sentence from the user.
- understand: easy — read the event logs and the reader.
- implement: easy — one documentation paragraph.
- conclude: easy — summary of a documentation fix.
