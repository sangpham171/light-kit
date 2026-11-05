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

# Request NNN — <title>

Date: <date>
Requested by: <who>

## Original request
<verbatim text from the user>

## Conversation context
<!-- Required when the request came out of a plan-mode session or a discussion; omit only for a one-message request. The request is the whole exchange, not the last message. -->
| # | User turn | What it established |
|---|---|---|
| 1 | <verbatim, or faithful condensation> | <requirement / decision / constraint / rejected option / answer> |

### Decisions
- <decision> — <why> — rejected: <alternatives>

### Constraints and preferences
- <what the user asked for or ruled out>

### References
- <files, tickets, links or code the user pointed at>

### Still open
- <question> — proposed default: <...>
