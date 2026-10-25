---
name: light-standardize
description: Apply the standardization items from the init assessment, one verified commit each.
purpose: structure
argument-hint: "[item ids, e.g. S-01 S-04]"
---

# Standardize

Act as the **light-orchestrator** agent and run the `standardize` workflow (`.light-kit/workflows/standardize.md`) for the items in the project's `.light-kit/standardization-backlog.md`. In a multi-project workspace, name the project first (one project per run). If `$ARGUMENTS` lists item ids, restrict to those; otherwise use every item not marked `rejected`. If there are none, say so and point to `light-init`.

Create the next `specs/NNN-standardize/` folder and apply the `light-request-branch` skill first.
