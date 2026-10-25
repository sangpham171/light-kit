---
name: init
description: Set up light-kit for this project — detect or ask for language, framework and constraints, then fill the project profile.
argument-hint: "[adopt | greenfield]"
---

# Init

Mode: `$ARGUMENTS` (if empty, ask whether to **adopt** the existing project or start **greenfield** with best practices).

1. **Adopt:** inspect the repo (manifests, CI config, test layout, linters, README, existing AI instruction files). Summarise what you detected and ask the user to confirm or correct it.
   **Greenfield:** ask for language(s), framework(s), hosting, testing policy, style rules and any constraints (compliance, performance, team conventions). Propose best practices for that stack and let the user accept or trim them.
2. Fill the **Project profile** section of the project instructions: languages, frameworks, build / test / lint commands, conventions, constraints. Keep existing content outside the light-kit marked block untouched.
3. Create the `specs/` folder (add a short `specs/README.md` explaining the layout).
4. Report what you wrote and how to start: `request "<what you want>"`.
