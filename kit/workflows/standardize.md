---
name: standardize
description: Apply the minor standardization items from the assessment backlog, one verified commit per item, without changing behavior.
purpose: structure
---

# Workflow: standardize

Use after `light-init` (adopt mode) produced `.light-kit/standardization-backlog.md` and the user runs `light-standardize`. Started with that skill, not chosen by triage. The assessment is the discovery; skip discovery.

steps:
1. plan — agent: light-tech-lead — writes: 40-plan.md (one task per item, in backlog order, each with its Verify step and a commit subject)
2. baseline — agent: light-tester — writes: 50-implementation.md (run the project's tests and lint now and record the result, so later runs can be compared)
3. implement — agent: light-developer — skill: light-tech-debt — writes: 50-implementation.md (one item at a time; after each, rerun its Verify step and the baseline checks; the debt check covers only what the items' changes introduced)
4. review — agent: light-reviewer — writes: notes in 50-implementation.md (confirm every change is cosmetic or additive and behavior-preserving; flag anything that goes beyond its item)
5. fix — agent: light-developer — skill: light-review-cycle — writes: 50-implementation.md
6. conclude — agent: light-tech-writer — writes: 60-conclusion.md (and tick the items done in the backlog)

Rules:
- Only items in the backlog: all of them, or the ids given to the command; skip items marked `rejected`. Never add items.
- **Stop-and-skip:** if an item turns out to need more than described (touches a public API, needs a refactor, changes behavior, or breaks the baseline), revert that item's change, mark it `needs-own-request` in the backlog with one line of why, and continue with the next.
- Debt: never fix debt beyond the backlog items; list what you notice as `noticed`. Review fixes must stay within an item's scope.
- Commit each item with its tick in the backlog.
- If the baseline is already failing before any change, tell the user and continue only with items whose Verify step does not depend on it.
