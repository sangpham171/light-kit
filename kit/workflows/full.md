---
name: full
description: Complex, ambiguous or risky requests. Clarify, discover, design, plan, implement and review in depth.
---

# Workflow: full

Use when triage scores 7+, or ambiguity or risk is 2.

steps:
1. understand — agent: orchestrator — writes: 10-understanding.md
2. clarify (parallel) — agents: product-owner, business-analyst — writes: 10-understanding.md (product and requirements sections)
   - **Gate:** present blocking questions to the user and wait for answers.
3. discover — agent: architect — skill: discovery — writes: 20-discovery.md
4. design (parallel) — agents: architect, ux-designer — writes: 30-design.md (skip ux-designer if there is no user-facing surface)
   - **Gate:** present the design and chosen option; wait for approval.
5. plan — agent: tech-lead — writes: 40-plan.md
6. implement — agent: developer — writes: 50-implementation.md (tasks marked independent may run in parallel)
7. verify-and-review (parallel) — agents: tester, reviewer, security-reviewer — writes: notes in 50-implementation.md
   - Blockers loop back to step 6.
8. conclude — agent: tech-writer — writes: 60-conclusion.md

Commit points (see the `commit` skill):
- after the clarify gate is approved, commit the understanding
- after the design gate is approved, commit the discovery and design
- after step 5, commit the plan **before** implementing; if the user asks for plan changes, commit the revised plan
- during step 6, one commit per plan task, after its verification passes
- during step 7, one commit per review finding fixed
- after step 8, commit the conclusion
