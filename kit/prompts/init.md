---
name: init
description: Set up light-kit for this project — detect or ask for language, framework and constraints, then fill the project profile.
argument-hint: "[adopt | greenfield]"
---

# Init

First work out where the kit is set up:
- `kit.config.json` has `level: workspace`: this folder is a **workspace of several projects**; follow *Workspace procedure* below.
- This project has no `.light-kit/` folder and no `kit.config.json`: the kit was installed once for the user (in the home folder) and this project is **not enabled yet**. Create `.light-kit/` here and seed `project-profile.md` from `.light-kit/templates/project-profile.md` and `hooks.config.json` from `.light-kit/templates/project-hooks.config.json`, then follow the project steps. (Shared files such as workflows and templates stay in the home folder; only this project's knowledge lives here.)
- Otherwise follow the project steps.

Mode: `$ARGUMENTS` (if empty, ask whether to **adopt** the existing project or start **greenfield** with best practices).

1. **Adopt:** inspect the repo (manifests, CI config, test layout, linters, README, existing AI instruction files). Summarise what you detected and ask the user to confirm or correct it.
   **Greenfield:** ask for language(s), framework(s), hosting, testing policy, style rules and any constraints (compliance, performance, team conventions). Propose best practices for that stack and let the user accept or trim them.
2. Write `.light-kit/project-profile.md` (keep its headings): languages, frameworks, build / test / lint commands, conventions, constraints. This file is yours to edit and is never overwritten by kit upgrades. Do not edit the light-kit marked blocks in instruction files.
3. **Adopt only:** apply the `codebase-map` skill and write `.light-kit/codebase-map.md`.
4. **Adopt only:** apply the `project-assessment` skill: find the project's own standards, assess strengths, deviations and gaps, and propose only minor, behavior-preserving, non-breaking standardization items (never refactors). Write `.light-kit/assessment.md` and `.light-kit/standardization-backlog.md`, present the backlog and ask which items to accept. Do not change any project code now; accepted items are applied later with `standardize`.
5. Apply the `hooks-config` skill to adapt the safety hooks (`.light-kit/hooks.config.json`) to this project: sensitive files, secret variable names, protected paths, format / lint / verify commands. In greenfield mode, fill what the chosen stack implies and revisit after `bootstrap`.
6. Ask how commits should work and write the **Commit policy** in the profile: mode (`auto` is the default and recommended: the agent commits at each checkpoint; `ask`; `off`) and message convention. **Adopt:** infer the convention from recent history and confirm it. Greenfield: default to Conventional Commits. Also set the **Branch convention** (adopt: infer from existing branch names; default `<type>/<NNN-slug>`). Protected branches default to `main`, `master`, `trunk`, `develop`, `production`, `release/*` and the remote default; add project-specific ones to `branches.protected` in the hooks config. The kit never pushes.
7. Create the `specs/` folder (add a short `specs/README.md` explaining the layout).
8. Report what you wrote (including the hooks you tuned) and how to start. **Greenfield:** run `bootstrap` to define the vision, architecture and skeleton. **Adopt:** run `standardize` to apply the items you accepted, then `request "<what you want>"`.

## Workspace procedure (level `workspace`)
1. **Discover the projects.** The installer pre-filled `.light-kit/projects.md` with nested repositories. Look for the rest (sub-folders up to three levels deep that are separate deployables, libraries or apps in one shared repository: look for their own build or package manifests, READMEs, entry points). Propose the list to the user and let them add, remove or rename.
2. **Write the registry** `.light-kit/projects.md`: name, path, purpose, stack (free text, exactly as found), own repository?, and which projects each one talks to.
3. **Profile each confirmed project separately**, in its own folder `<project>/.light-kit/`: run the project steps above (profile, codebase map, and in adopt mode the assessment and backlog; hooks config) with that project as the unit. When the client supports subagents, do projects in parallel; otherwise one at a time. Never copy conventions from one project into another. The project's `hooks.config.json` is a layer on top of the workspace one (see `hooks-config`).
4. **Workspace defaults** in `.light-kit/project-profile.md`: only what is shared by all projects (commit policy, branch convention, security rules, how projects interact). Nothing stack-specific. Set protected branches and shared hook modes in the workspace `.light-kit/hooks.config.json`.
5. Create `specs/` at the workspace root only if cross-project requests are expected (each project gets its own `specs/` when its first request starts).
6. Report the projects registered and what was written for each. Remind the user: start the AI client from the workspace folder, and use `request` (it picks the project) or `standardize` per project.

Greenfield workspace: ask which project to create first, then use `bootstrap` for it.
