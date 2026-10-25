---
name: direct
description: Easy, clear, low-risk requests. Implement immediately with no clarification.
purpose: structure
---

# Workflow: direct

Use when triage scores 0–2 with no ambiguity.

steps:
1. understand — agent: light-orchestrator — writes: 10-understanding.md (short, with triage)
2. implement — agent: light-developer — skill: light-tech-debt — writes: 50-implementation.md (ends with the Technical debt section; debt this change introduced is resolved before review)
3. review — agent: light-reviewer — writes: review notes in 50-implementation.md
4. fix — agent: light-developer — skill: light-review-cycle — writes: 50-implementation.md (fix the findings; repeat review and fix up to the configured Review turns, default 1)
5. conclude — agent: light-orchestrator — writes: 60-conclusion.md (a few lines, including any deferred debt or open finding)

Commit (see the `light-commit` skill): after the fixes, one commit with the code and the request folder together; keep debt and finding fixes in separate commits only if they are not trivial.

Do not ask the user questions. If a blocker appears, escalate to `standard`.
