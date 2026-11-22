---
step: request
runs:
  - agent: light-orchestrator
    part: request capture
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 66,131 input · 934,912 cache read · 0 cache write · 15,455 output · 1,016,498 total
  time: 5m 43s
---

# Request 042 — Agent and skill usage statistics

Date: 2026-11-22
Requested by: the user

## Original request
> i want to store in .light-kit folder the stats of how many times an agent or a skill were used. i want to store as a table where the first column is the request, and the last row is the summary of all request.
> Make another better storage as your choice

## Conversation context
One-message request: the user stated the goal and left the second storage format to the implementer.

### Decisions
- Two files: a Markdown table as asked, plus a versioned JSON file as the machine-readable source of truth the table is rendered from — JSON keeps exact names, per-request first/last timestamps and separate agent/skill counts that a table cannot round-trip reliably.
- Count only real agent and skill invocations, detected from the client's tool events; never infer usage from artifacts or logs.

### Constraints and preferences
- Location: `.light-kit/`.
- Table shape: first column is the request, last row is the total over all requests.
- A second, better storage is expected, not optional.

### Still open
- None. Clients that expose no agent or skill tool (and every call made before a request exists) get their own row rather than being dropped.
