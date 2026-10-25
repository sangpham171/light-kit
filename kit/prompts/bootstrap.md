---
name: bootstrap
description: Start a new project — define the vision, choose the architecture, plan and build the initial skeleton.
argument-hint: "<what the project is for>"
---

# Bootstrap

Run the `bootstrap` workflow as the **orchestrator** agent for: `$ARGUMENTS`

Read `.light-kit/project-profile.md` first (run `init` if it is empty). In a multi-project workspace (`.light-kit/projects.md` exists), ask for the new project's folder name, create it under the workspace, add it to the registry, and seed `<project>/.light-kit/` (profile and hooks config) from `.light-kit/templates`; the new project's stack choices go in its own profile. Create the next `specs/NNN-bootstrap/` folder and follow `.light-kit/workflows/bootstrap.md`, stopping at its gates.
