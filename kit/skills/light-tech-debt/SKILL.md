---
name: light-tech-debt
description: When implementation is done, list the technical debt the change introduced, then resolve it. Used by the developer before review.
purpose: compensation
---

# Technical debt

Run this when the implementation is finished and verified, **before** asking for review.

## What counts as debt (in the code of this change)
Shortcuts and workarounds, TODO / FIXME / temporary code, duplicated logic, hard-coded values that should be configuration, missing or weak tests for new behavior, unhandled edge cases or errors you know about, unclear names or missing docs where the project's standard requires them, partial migrations, and anything you would apologise for in review.

Pre-existing debt you notice in the surrounding code is **not** yours to fix in this request. List it as `noticed` so nobody loses it.

## 1. List it
Add a `## Technical debt` section to `50-implementation.md`. One entry per item:
```
- TD-1 <where: path or area> — <what the debt is> — <why it exists> — status: open
```
If there is none, write `None.` Be honest: an empty list must mean you looked.

## 2. Resolve it
For every `open` item introduced by this change: change the code to remove the debt, rerun the verification of the affected tasks, and commit with the `light-commit` skill (one commit per item or per coherent group; subject like `refactor(scope): remove duplicated mapping`). Then set `status: resolved (<short hash>)`.

Look again at the final state once: fixing debt can create new debt. Repeat until nothing introduced by this change is open, at most twice.

## 3. Defer only with a reason
An item may stay unresolved only if resolving it needs more than this request's scope (a refactor, a public-interface change, work in another project, a decision from the user). Then set `status: deferred (<reason>, suggested follow-up>)`. Never delete an item or mark it resolved without a change.

Deferred items and `noticed` items go to the conclusion and to the user. Do not describe the work as done without them.
