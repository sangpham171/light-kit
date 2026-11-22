---
name: standard
description: Medium requests. Discover, plan, implement and review.
purpose: structure
---

# Workflow: standard

Use when triage scores 3–6.

The agents and steps named below are the baseline; the orchestrator may add, skip, split, repeat or reorder them as the request unfolds (`light-agent-selection`).

steps:
1. understand — agent: light-orchestrator — writes: 10-understanding.md
2. discover — agent: light-tech-lead — skill: light-discovery — writes: 20-discovery.md
3. plan — agent: light-tech-lead — writes: 40-plan.md
4. implement — agent: light-developer — skill: light-tech-debt — writes: 50-implementation.md
5. verify-and-review (parallel) — agents: light-tester, light-reviewer — writes: notes in 50-implementation.md
6. fix — agent: light-developer — skill: light-review-cycle — writes: 50-implementation.md
7. rules — agent: light-orchestrator — skill: light-rules — writes: `.light-kit/rules.md` when a rule changes
8. conclude — agent: light-tech-writer — writes: 60-conclusion.md
