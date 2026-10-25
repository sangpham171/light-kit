---
name: standard
description: Medium requests. Discover, plan, implement and review.
---

# Workflow: standard

Use when triage scores 3–6.

steps:
1. understand — agent: orchestrator — writes: 10-understanding.md
2. discover — agent: tech-lead — skill: discovery — writes: 20-discovery.md
3. plan — agent: tech-lead — writes: 40-plan.md
4. implement — agent: developer — writes: 50-implementation.md
5. verify-and-review (parallel) — agents: tester, reviewer — writes: notes in 50-implementation.md
6. conclude — agent: tech-writer — writes: 60-conclusion.md

Commit points (see the `commit` skill):
- after step 3, commit the request folder with the plan, **before** implementing
- during step 4, one commit per plan task, after its verification passes
- after step 5, one commit per review finding fixed
- after step 6, commit the conclusion

Ask the user only about questions that block the plan, each with a proposed default.
