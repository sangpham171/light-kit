---
name: codebase-map
description: Survey an existing codebase once and write a reusable map to .light-kit/codebase-map.md.
---

# Codebase map

In a workspace, `.light-kit/...` paths below refer to the **project's own** `.light-kit/` folder (`<project>/.light-kit/`) and you assess one project at a time.

Goal: let later requests skip basic exploration. Keep it under about two pages.

Write `.light-kit/codebase-map.md` with:
1. **Purpose** — what the system does, in two sentences.
2. **Structure** — top-level directories and what lives in each; entry points.
3. **Components and boundaries** — main modules or services, how they talk to each other, external dependencies.
4. **Data** — main entities, storage, migrations.
5. **Tooling** — build, test, lint, run and deploy commands as found in manifests and CI config (verify they exist).
6. **Conventions** — naming, layering, error handling, test style, with one example path each.
7. **Hotspots and gaps** — fragile or complex areas, missing tests or CI.

Cite paths. Mark anything not verified as an assumption. Do not change any project code.
