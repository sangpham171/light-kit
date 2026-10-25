---
name: standardize
description: Apply the accepted standardization items from the init assessment, one verified commit each.
argument-hint: "[item ids, e.g. S-01 S-04]"
---

# Standardize

Act as the **orchestrator** agent and run the `standardize` workflow (`.light-kit/workflows/standardize.md`) for the accepted items in the project's `.light-kit/standardization-backlog.md`. In a multi-project workspace, name the project first (one project per run). If `$ARGUMENTS` lists item ids, restrict to those; otherwise use every item marked accepted. If there are none, say so and point to `init`.

Create the next `specs/NNN-standardize/` folder and apply the `request-branch` skill first.
