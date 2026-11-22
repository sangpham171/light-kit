---
step: request
runs:
  - agent: light-orchestrator
    part: request capture
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 53,971 input · 810,240 cache read · 0 cache write · 20,110 output · 884,321 total
  time: 3m 36s
---

# Request 046 — Agent usage state: what is recorded, and commit it

## User report (verbatim)
> only light-reviewer agent is stored in agent-skill-usage. and these files are not commited

## What it establishes
- The user read `.light-kit/agent-skill-usage.json` / `.md` and found a single agent, `light-reviewer`, for requests 043, 044 and 045.
- The two files, plus other hook-written state, are not committed.
- Open: whether the recording is wrong, and which files must be committed.

## References
- `specs/042-agent-skill-usage/60-conclusion.md` — feature design and its note that the stats files are optional local state.
- `specs/043-rule-triggers/tool-log.md`, `specs/044-multilingual-rules-reminder/tool-log.md`, `specs/045-universal-rules-reminder/tool-log.md` — one `Agent` call each.
