---
name: bootstrap
description: New project. Define the vision, choose the architecture, plan and build a minimal working skeleton.
---

# Workflow: bootstrap

Use for a brand-new project, started with the `light-bootstrap` command (not chosen by triage). Assumes `light-init` has filled the project profile.

steps:
1. understand — agent: light-orchestrator — writes: 10-understanding.md
2. vision (parallel) — agents: light-product-owner, light-business-analyst — writes: 10-understanding.md (users, outcomes, first-release scope, requirements)
   - **Decision point:** record the vision and first-release scope.
3. architecture (parallel) — agents: light-architect, light-ux-designer — writes: 30-design.md (structure, key decisions as ADRs; skip ux-designer if there is no user-facing surface)
   - **Decision point:** record the architecture and why.
4. plan — agent: light-tech-lead — writes: 40-plan.md (skeleton tasks: repo layout, build and test commands, CI, one thin end-to-end slice)
5. implement — agent: light-developer — skill: light-tech-debt — writes: 50-implementation.md (build the skeleton; every task verified; ends with the Technical debt section, resolved before review)
6. verify-and-review (parallel) — agents: light-tester, light-reviewer, light-security-reviewer — writes: notes in 50-implementation.md
7. fix — agent: light-developer — skill: light-review-cycle — writes: 50-implementation.md (fix the findings; repeat review and fix up to the configured Review turns, default 1)
8. conclude — agent: light-tech-writer — writes: 60-conclusion.md and a project README; update `.light-kit/project-profile.md` with the real build, test and run commands

Commit points (see the `light-commit` skill): commit the vision once settled, the architecture and ADRs once chosen, the plan before building, then one commit per skeleton task, one per resolved debt item, one per finding fixed, and one for the conclusion.
