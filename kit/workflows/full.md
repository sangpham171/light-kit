---
name: full
description: Complex, ambiguous or risky requests. Clarify, discover, design, plan, implement and review in depth.
purpose: structure
---

# Workflow: full

Use when triage scores 7+, or ambiguity or risk is 2.

steps:
1. understand — agent: light-orchestrator — writes: 10-understanding.md
2. clarify (parallel) — agents: light-product-owner, light-business-analyst — writes: 10-understanding.md (product and requirements sections)
   - **Decision point:** record the answers or assumptions in `10-understanding.md`.
3. discover — agent: light-architect — skill: light-discovery — writes: 20-discovery.md
4. design (parallel) — agents: light-architect, light-ux-designer — writes: 30-design.md (skip ux-designer if there is no user-facing surface)
   - **Decision point:** record the chosen design and why in `30-design.md`.
5. plan — agent: light-tech-lead — writes: 40-plan.md
6. implement — agent: light-developer — skill: light-tech-debt — writes: 50-implementation.md (tasks marked independent may run in parallel; ends with the Technical debt section, and debt this change introduced is resolved before review)
7. verify-and-review (parallel) — agents: light-tester, light-reviewer, light-security-reviewer — writes: notes in 50-implementation.md
8. fix — agent: light-developer — skill: light-review-cycle — writes: 50-implementation.md (fix the findings; repeat review and fix up to the configured Review turns, default 1)
9. conclude — agent: light-tech-writer — writes: 60-conclusion.md (including deferred debt and any open finding)

Commit points (see the `light-commit` skill):
- after the clarify step (and any question you had to ask is answered), commit the understanding
- after the design step, commit the discovery and design
- after step 5, commit the plan **before** implementing; if the user asks for plan changes, commit the revised plan
- during step 6, one commit per plan task, after its verification passes, then one per resolved debt item
- during step 8, one commit per finding fixed
- after step 9, commit the conclusion
