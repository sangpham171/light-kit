---
name: direct
description: Easy, clear, low-risk requests. Implement immediately with no clarification.
---

# Workflow: direct

Use when triage scores 0–2 with no ambiguity.

steps:
1. understand — agent: orchestrator — writes: 10-understanding.md (short, with triage)
2. implement — agent: developer — writes: 50-implementation.md
3. review — agent: reviewer — writes: review notes in 50-implementation.md
4. conclude — agent: orchestrator — writes: 60-conclusion.md (a few lines)

Commit (see the `commit` skill): once, after the review passes, with the code and the request folder together.

Do not ask the user questions. If a blocker appears, escalate to `standard`.
