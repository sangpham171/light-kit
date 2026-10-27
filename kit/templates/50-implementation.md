---
runs:
  - step: <step>
    agent: <agent>
    model: <model id>
    thinking: <reasoning setting or unknown>
    level: <easy|medium|hard|unknown>
usage:
  - step: <step>
    tokens: <input> input · <cache read> cache read · <cache write> cache write · <output> output · <total> total
    time: <time spent or unknown>
---

# Implementation log

## Progress
<!-- one line per task: task, short commit hash, subject -->
## Technical debt
<!-- Written by the developer when implementation is done (see the `light-tech-debt` skill). One line per item:
- TD-1 <where> — <what> — <why> — status: open | resolved (<hash>) | deferred (<reason, follow-up>) | noticed (pre-existing) -->
## Decisions and deviations
## Verification (commands run and results)
## Review rounds
<!-- Round n of N (see the `light-review-cycle` skill). One line per finding:
- F-1.1 [blocker|should-fix|nit] <path:line> — <problem> — suggested fix — status: open | fixed (<hash>) | declined (<reason>) | deferred (<reason>)
Verdict: approve | changes requested -->
