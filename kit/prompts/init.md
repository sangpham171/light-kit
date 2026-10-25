---
name: init
description: Set up light-kit for this project — detect or ask for language, framework and constraints, then fill the project profile.
argument-hint: "[adopt | greenfield]"
---

# Init

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
