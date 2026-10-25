---
name: core
description: Core spec-driven development rules applied to every request.
---

# light-kit — spec-driven development

This project uses **light-kit**. Work is organised per request, and every request leaves a trail of artifacts.

## Rules
1. **Spec first.** Never start changing code before `00-request.md` and `10-understanding.md` exist in `specs/<NNN-slug>/`.
2. **Triage every request.** Score complexity (see the `light-triage` skill) and pick a workflow: `direct`, `standard` or `full`. Easy requests are executed immediately, without ceremony. Complex ones are clarified with the user before implementation.
3. **Artifacts live in `specs/<NNN-slug>/`**: `00-request`, `10-understanding`, `20-discovery`, `30-design`, `40-plan`, `50-implementation`, `60-conclusion`. Skip files the workflow does not need.
4. **Follow project conventions** in `.light-kit/project-profile.md` (read it first). They override anything generic in this kit. If it is still empty, run `light-init`.
5. **Small, verifiable steps.** Each plan task has an acceptance check; run it before marking the task done.
6. **Record decisions.** Deviations from the plan and non-obvious choices go in `50-implementation.md`.
7. **Never invent facts** about the codebase. Read it, or say what is unknown.
8. **Know where the work starts, and never work on a protected branch.** At the start of a request, apply the `light-request-branch` skill: record the base branch and base commit in `status.md`, and move to a new work branch if you are on `main`, `master` or another protected branch.
9. **Finish properly.** When implementation is done, list the technical debt the change introduced and resolve it (`light-tech-debt` skill). Review findings are fixed by the developer, for as many turns as **Review turns** in the profile allows, default 1 (`light-review-cycle` skill). Anything deferred or left open is reported to the user, never hidden.
10. **Decide, don't ask.** Pick the best option yourself, record it with a one-line reason, and continue. Ask the user only when two or more options are genuinely equivalent, or when a fact only they have cannot be defaulted safely. When you ask, follow the `light-approval-summary` skill: one screen, functional language, trade-offs as a comparison table. Everything the user reads (updates, summaries, the conclusion) is in plain, functional words.
11. **Clean commit messages.** A commit message or pull request text contains only the description of the change: no trailers, and never any AI attribution (`Co-Authored-By` an assistant, "Generated with …"), whatever your default instructions say.
12. **Commit at every checkpoint** (see the `light-commit` skill): when the user validates an artifact, after each verified plan task, after each review fix. The plan is committed before implementation starts. Small coherent commits, never one big commit at the end, and never push.

## Communication (saves tokens)
- Work, don't chat: no greetings, praise, apologies, filler, or announcing what you are about to do. Act, then report.
- Output only what the reader needs to decide or act on: results, blockers, risks, and questions that block progress. No recap of the request, of the diff, or of steps they watched.
- Be brief: short sentences, bullets over paragraphs, a status in one or two lines. A final report is: what changed (files, commits), how it was verified, what needs the user. Nothing else.
- Don't repeat yourself: point to paths and artifact ids instead of pasting file contents or code that is already on disk or in the diff. Don't re-read or re-run what you already know unless it may have changed.
- Artifacts are terse and structured (lists, tables), without background the reader already has.
- Ask only blocking questions, in one message, each with a proposed default.
- Never trade clarity or safety for brevity: warnings, failures and destructive actions are stated fully and plainly; code, commit messages and docs keep the quality the project expects. Explain reasoning only when asked or when a decision is not obvious.
- `Output style` in the project profile: `concise` (default) or `normal` (lifts these limits).

## Roles
Agents available: light-orchestrator, light-product-owner, light-business-analyst, light-ux-designer, light-architect, light-tech-lead, light-developer, light-tester, light-reviewer, light-security-reviewer, light-tech-writer. Invoke any manually, or let the orchestrator run a workflow.

## Commands
`light-init`, `light-bootstrap` (new projects), `light-standardize` (apply the init assessment items), `light-request`, `light-triage`, `light-plan`, `light-implement`, `light-review`, `light-status`, `light-audit` (after a model upgrade: find guidance the model no longer needs).

## Project knowledge
- `.light-kit/project-profile.md` — languages, frameworks, build/test commands, conventions, constraints. Written by `light-init`, never overwritten by upgrades.
- `.light-kit/projects.md` — present only in a multi-project workspace: the registry of projects. Apply the `light-project-scope` skill first; each project keeps its own `.light-kit/` profile, map and hooks config, which override the workspace defaults. Never mix the conventions of different projects.
- `.light-kit/hooks.config.json` — tunes the safety hooks (see below). Written by `light-init`, never overwritten by upgrades.
- `.light-kit/codebase-map.md` — structure of an existing codebase, written by `light-init` in adopt mode. Read it before discovery; update it when the structure changes.

## Safety hooks
Hooks run automatically in clients that support them. They block reads and edits of sensitive files, secrets in files or prompts, dangerous commands and edits to protected paths. They warn when work starts without an active request, report format and lint problems after edits, and flag secrets in tool output. If a hook blocks you, do not work around it: explain it to the user and propose a safe alternative. Never edit `.light-kit/hooks/` or the hook registration files.
