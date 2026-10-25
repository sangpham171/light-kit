---
name: direct
description: Easy, clear, low-risk requests. Implement immediately with no clarification.
purpose: structure
---

# Workflow: direct

Use when triage scores 0–2 with no ambiguity.

steps:
1. understand — agent: light-orchestrator — writes: 10-understanding.md (short, with triage)
2. implement — agent: light-developer — skill: light-tech-debt — writes: 50-implementation.md
3. review — agent: light-reviewer — writes: review notes in 50-implementation.md
4. fix — agent: light-developer — skill: light-review-cycle — writes: 50-implementation.md
5. conclude — agent: light-orchestrator — writes: 60-conclusion.md (a few lines)

Do not ask the user questions. If a blocker appears, escalate to `standard`.
