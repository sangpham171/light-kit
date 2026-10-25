---
name: light-project-scope
description: In a multi-project workspace, decide which project(s) a request touches, load each project's own knowledge, and decide where the request's artifacts and commits go. Use first when .light-kit/projects.md exists.
---

# Project scope

Applies when `.light-kit/projects.md` exists: the folder you work from holds several projects, each with its own language, framework, tools and conventions. Never mix them up.

## 1. Choose the project(s)
Read the registry `.light-kit/projects.md`. Decide from the request text, the paths it mentions and the current folder which project(s) it touches. If two projects are equally plausible, ask; otherwise pick the most likely one and say which. A request that needs a project not in the registry is either a typo to confirm or a new project (use `light-bootstrap`).

## 2. Load knowledge, nearest wins
1. Workspace defaults: `.light-kit/project-profile.md` (commit policy, branch convention, cross-cutting rules).
2. The project's own `<project>/.light-kit/project-profile.md` and `codebase-map.md`. These override the defaults.
3. Hook settings are layered the same way: `<project>/.light-kit/hooks.config.json` adds to the workspace one.

Build, test, lint and run commands always come from the target project's profile and run **from that project's folder**. Apply one project's conventions only to that project.

## 3. Where the request lives
- One project: `<project>/specs/NNN-slug/`, numbered within that project.
- Several projects: the workspace `specs/NNN-slug/` if the workspace folder itself is inside a git repository; otherwise inside the **primary** project's `specs/`.
- In `status.md` set `projects:` to the list of project names and mark the primary one (`primary:`).

## 4. Cross-project work
- **Discovery:** find the contracts between the projects involved (interfaces, schemas, messages, shared files) and who depends on whom, using the `Talks to` column.
- **Design:** state each project's part and the order of change. Keep every intermediate state compatible (change the provider so it supports old and new, then the consumer, then retire the old).
- **Plan:** tag every task with its project. One task = one commit in one project; a task never spans two projects.
- **Verification:** each project's own checks, plus the cross-project check named in the plan.

## 5. Git
A project may be its own repository, or all may share one. Apply `light-request-branch` and `light-commit` per repository (never one commit across repositories). Do not touch projects outside the request's scope.
