---
step: request
runs:
  - agent: light-orchestrator
    model: deepseek/deepseek-flash
    thinking: high
    level: medium
usage:
  tokens: 1,817,703 input · 0 cache read · 0 cache write · 11,893 output · 1,829,596 total
  time: 1m 52s
---

# Request 024 — Commands ship as skills

Date: 2026-10-28
Requested by: light

## Original request
prompts are not standard accross clients. Merge prompts into skills

## Scope
Stop generating per-client prompt/command files. Every `/light-*` entry point becomes a skill
(`SKILL.md`), which every supported client reads from a standard location and format.
