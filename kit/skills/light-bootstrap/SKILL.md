---
name: light-bootstrap
description: Start a new project — define the vision, choose the architecture, plan and build the initial skeleton. Use for a greenfield project that has no code yet, after light-init.
purpose: structure
---

# Bootstrap

Run the `bootstrap` workflow as the **light-orchestrator** agent for what the request describes (what the project is for).

Read `.light-kit/project-profile.md` first (run `light-init` if it is empty). In a multi-project workspace (`.light-kit/projects.md` exists), choose a folder name from the request, create it under the workspace, add it to the registry, and seed `<project>/.light-kit/` (profile and hooks config) from `.light-kit/templates`; the new project's stack choices go in its own profile. Create the next `specs/NNN-bootstrap/` folder and follow `.light-kit/workflows/bootstrap.md`, stopping at its gates.
