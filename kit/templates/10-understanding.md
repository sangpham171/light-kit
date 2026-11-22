---
step: <step>
runs:
  - agent: <agent>
    part: <what this run produced>
    model: <model id>
    thinking: <reasoning setting or unknown>
    level: <easy|medium|hard|unknown>
usage:
  tokens: <input> input · <cache read> cache read · <cache write> cache write · <output> output · <total> total
  time: <time spent or unknown>
---

# Understanding

## Restatement
## Prior requests
<!-- Earlier folders checked in specs/, what was reused or contradicted; verified against the current code. Write "none" if nothing matched. -->
## Assumptions
## Open questions (with proposed defaults)
## Requirements
1. 
## Acceptance criteria
## In scope / Out of scope

## Triage
Scores: scope _, ambiguity _, risk _, novelty _, impact _ (total _)
Workflow: _
Why: _

## Routing
<!-- one line per workflow step: `step: easy|medium|hard — reason` (see the `light-model-routing` skill) -->

## Agent plan
<!-- Baseline from the chosen workflow: one line per step, `<step>: <agents> — <why>`. Then one line per change: `<step>: + light-x — <reason> (after <event>)` or `<step>: - light-y — <reason>` (see the `light-agent-selection` skill). -->
