---
name: standardize
description: Apply the accepted minor standardization items from the assessment backlog, one verified commit per item, without changing behavior.
---

# Workflow: standardize

Use after `init` (adopt mode) produced `.light-kit/standardization-backlog.md` and the user accepted items. Started with the `standardize` command, not chosen by triage. The assessment is the discovery; skip discovery.

steps:
1. plan — agent: tech-lead — writes: 40-plan.md (one task per accepted item, in backlog order, each with its Verify step and a commit subject)
2. baseline — agent: tester — writes: 50-implementation.md (run the project's tests and lint now and record the result, so later runs can be compared)
3. implement — agent: developer — skill: tech-debt — writes: 50-implementation.md (one item at a time; after each, rerun its Verify step and the baseline checks; the debt check covers only what the items' changes introduced)
4. review — agent: reviewer — writes: notes in 50-implementation.md (confirm every change is cosmetic or additive and behavior-preserving; flag anything that goes beyond its item)
5. fix — agent: developer — skill: review-cycle — writes: 50-implementation.md (fix the findings; repeat review and fix up to the configured Review turns, default 1)
6. conclude — agent: tech-writer — writes: 60-conclusion.md (and tick the items done in the backlog)

Rules:
- Only items marked accepted. Never add items.
- **Stop-and-skip:** if an item turns out to need more than described (touches a public API, needs a refactor, changes behavior, or breaks the baseline), revert that item's change, mark it `needs-own-request` in the backlog with one line of why, and continue with the next.
- Debt: never fix debt beyond the accepted items; list what you notice as `noticed`. Review fixes must stay within an item's scope.
- If the baseline is already failing before any change, tell the user and continue only with items whose Verify step does not depend on it.

Commit points (see the `commit` skill): the plan before implementing; one commit per item, with the item's tick in the backlog; one commit for the conclusion. Work happens on a work branch (see `request-branch`).
