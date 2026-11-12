---
step: request
runs:
  - agent: light-orchestrator
    part: request capture
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 38,514 input · 279,936 cache read · 0 cache write · 6,343 output · 324,793 total
  time: 1m 47s
---

# Request 033 — Check earlier requests before writing understanding and discovery

Date: 2026-11-12
Requested by: the user

## Original request
> to write 10-understanding.md and 20-discovery.md, agents is encouraged to inspect previous specs to search for the same, similar or relative requests. to reduce token, don't read all specs details, begin with to specs folder name to guess, then reverse order inspect from the end to beginning: go to 60-conclusion.md to understand the specs result, then go to 50-implementation.md to see more details about implementation if need, then 30-discovery to explore previous discovery. Agents don't need to read all md files, only read necessary file when needed. After specs file, agents verify the current codebase to make a robust and accurace specs
