---
name: core
description: Core spec-driven development rules applied to every request.
---

# light-kit — spec-driven development

This project uses **light-kit**. Work is organised per request, and every request leaves a trail of artifacts.

## Rules
1. **Spec first.** Never start changing code before `00-request.md` and `10-understanding.md` exist in `specs/<NNN-slug>/`.
2. **Triage every request.** Score complexity (see the `triage` skill) and pick a workflow: `direct`, `standard` or `full`. Easy requests are executed immediately, without ceremony. Complex ones are clarified with the user before implementation.
3. **Artifacts live in `specs/<NNN-slug>/`**: `00-request`, `10-understanding`, `20-discovery`, `30-design`, `40-plan`, `50-implementation`, `60-conclusion`. Skip files the workflow does not need.
4. **Follow project conventions** in `.light-kit/project-profile.md` (read it first). They override anything generic in this kit. If it is still empty, run `init`.
5. **Small, verifiable steps.** Each plan task has an acceptance check; run it before marking the task done.
6. **Record decisions.** Deviations from the plan and non-obvious choices go in `50-implementation.md`.
7. **Never invent facts** about the codebase. Read it, or say what is unknown.
8. **Know where the work starts, and never work on a protected branch.** At the start of a request, apply the `request-branch` skill: record the base branch and base commit in `status.md`, and move to a new work branch if you are on `main`, `master` or another protected branch.
9. **Commit at every checkpoint** (see the `commit` skill): when the user validates an artifact, after each verified plan task, after each review fix. The plan is committed before implementation starts. Small coherent commits, never one big commit at the end, and never push.

## Roles
Agents available: orchestrator, product-owner, business-analyst, ux-designer, architect, tech-lead, developer, tester, reviewer, security-reviewer, tech-writer. Invoke any manually, or let the orchestrator run a workflow.

## Commands
`init`, `bootstrap` (new projects), `request`, `triage`, `plan`, `implement`, `review`, `status`.

## Project knowledge
- `.light-kit/project-profile.md` — languages, frameworks, build/test commands, conventions, constraints. Written by `init`, never overwritten by upgrades.
- `.light-kit/hooks.config.json` — tunes the safety hooks (see below). Written by `init`, never overwritten by upgrades.
- `.light-kit/codebase-map.md` — structure of an existing codebase, written by `init` in adopt mode. Read it before discovery; update it when the structure changes.

## Safety hooks
Hooks run automatically in clients that support them. They block reads and edits of sensitive files, secrets in files or prompts, dangerous commands and edits to protected paths. They warn when work starts without an active request, report format and lint problems after edits, and flag secrets in tool output. If a hook blocks you, do not work around it: explain it to the user and propose a safe alternative. Never edit `.light-kit/hooks/` or the hook registration files.
