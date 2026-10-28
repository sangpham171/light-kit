---
name: light-implement
description: Implement the plan of an existing request task by task, verifying and committing each. Use when 40-plan.md exists and the user asks to build it.
purpose: structure
---

# Implement

For the request folder named in the request (a `specs/NNN-slug` path; if none is named, use the active request in `specs/*/status.md`): act as **light-developer** and execute `40-plan.md` task by task, verifying each task and logging in `50-implementation.md`. Tick off tasks as they pass and commit each task on its own with the `light-commit` skill before starting the next.
