---
name: direct
description: Easy, clear, low-risk requests. No questions, no discovery or design; a compact plan, then implement.
purpose: structure
---

# Workflow: direct

Use when triage scores 0–2 with no ambiguity.

steps:
1. understand — agent: light-orchestrator — writes: 10-understanding.md (short, with triage)
   - The whole exchange is the request: when it followed a discussion or plan-mode session, capture it first (see the `light-conversation-capture` skill).
2. plan — agent: light-tech-lead — writes: 40-plan.md (compact: one line per task, with its level and verify)
3. implement — agent: light-developer — skill: light-tech-debt — writes: 50-implementation.md
4. review — agent: light-reviewer — writes: review notes in 50-implementation.md
5. fix — agent: light-developer — skill: light-review-cycle — writes: 50-implementation.md
6. conclude — agent: light-orchestrator — writes: 60-conclusion.md (a few lines)

A compact plan is still a plan: `40-plan.md` is written before code changes, even for a one-task request.

Do not ask the user questions. If a blocker appears, escalate to `standard`.
