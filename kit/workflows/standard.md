---
name: standard
description: Medium requests. Discover, plan, implement and review.
---

# Workflow: standard

Use when triage scores 3–6.

steps:
1. understand — agent: light-orchestrator — writes: 10-understanding.md
2. discover — agent: light-tech-lead — skill: light-discovery — writes: 20-discovery.md
3. plan — agent: light-tech-lead — writes: 40-plan.md
4. implement — agent: light-developer — skill: light-tech-debt — writes: 50-implementation.md (ends with the Technical debt section; debt this change introduced is resolved before review)
5. verify-and-review (parallel) — agents: light-tester, light-reviewer — writes: notes in 50-implementation.md
6. fix — agent: light-developer — skill: light-review-cycle — writes: 50-implementation.md (fix the findings; repeat review and fix up to the configured Review turns, default 1)
7. conclude — agent: light-tech-writer — writes: 60-conclusion.md (including deferred debt and any open finding)

Commit points (see the `light-commit` skill):
- after step 3, commit the request folder with the plan, **before** implementing
- during step 4, one commit per plan task, after its verification passes, then one per resolved debt item
- during step 6, one commit per finding fixed
- after step 7, commit the conclusion
