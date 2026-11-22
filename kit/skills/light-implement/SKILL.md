---
name: light-implement
description: Implement the plan of an existing request task by task, verifying and committing each. Use when 40-plan.md exists and the user asks to build it.
purpose: structure
---

# Implement

For the request folder named in the request (a `specs/NNN-slug` path; if none is named, use the active request in `specs/*/status.md`): act as **light-developer** and execute `40-plan.md` task by task, verifying each task and logging in `50-implementation.md`. Before each task, apply the `light-rules` skill and keep the applicable `confirmed` rules as hard constraints; after each task, apply it again to record violations, promotions and new rules. A failed verification, a user correction or a defect found while fixing is also a trigger: record it immediately, not only at the review. Tick off tasks as they pass and commit each task on its own with the `light-commit` skill before starting the next.

Do not implement from the chat. If the request followed a discussion or plan-mode session and its artifacts are missing or incomplete, apply the `light-conversation-capture` skill first: write `00-request.md`, `10-understanding.md` and `40-plan.md` from the whole exchange, then implement. A plan agreed in the conversation is transcribed to `40-plan.md`, and the plan is stored even when the work is one task.
