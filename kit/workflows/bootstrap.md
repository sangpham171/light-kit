---
name: bootstrap
description: New project. Define the vision, choose the architecture, plan and build a minimal working skeleton.
---

# Workflow: bootstrap

Use for a brand-new project, started with the `bootstrap` command (not chosen by triage). Assumes `init` has filled the project profile.

steps:
1. understand — agent: orchestrator — writes: 10-understanding.md
2. vision (parallel) — agents: product-owner, business-analyst — writes: 10-understanding.md (users, outcomes, first-release scope, requirements)
   - **Gate:** present the vision and first-release scope; wait for approval.
3. architecture (parallel) — agents: architect, ux-designer — writes: 30-design.md (structure, key decisions as ADRs; skip ux-designer if there is no user-facing surface)
   - **Gate:** present the architecture; wait for approval.
4. plan — agent: tech-lead — writes: 40-plan.md (skeleton tasks: repo layout, build and test commands, CI, one thin end-to-end slice)
5. implement — agent: developer — writes: 50-implementation.md (build the skeleton; every task verified)
6. verify-and-review (parallel) — agents: tester, reviewer, security-reviewer — writes: notes in 50-implementation.md
7. conclude — agent: tech-writer — writes: 60-conclusion.md and a project README; update `.light-kit/project-profile.md` with the real build, test and run commands
