---
step: request
runs:
  - agent: light-orchestrator
    model: deepseek/deepseek-flash
    thinking: high
    level: easy
usage:
  tokens: 1,508,678 input · 0 cache read · 0 cache write · 14,766 output · 1,523,444 total
  time: 2m 16s
---

# Request 022 — Copilot cache read stays 0

Date: 2026-10-27
Requested by: light
Branch: `docs/022-copilot-cache-read-zero` from `c07688c` (`fix/021-copilot-agent-host-usage`)

## Original request
how is possible that the cache read is 0 ? is it because i'm using deepseek in github copilot ? If it's a bug, Fix it

## Interpretation
Find out why the `usage:` blocks written under Copilot report `0 cache read`, decide whether the kit
mis-reads the figure, and change whatever the cause turns out to be.

## Out of scope
- Reading DeepSeek's own cache-hit field, which no client record stores.
