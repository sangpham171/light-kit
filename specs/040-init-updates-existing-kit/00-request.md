---
step: request
runs:
  - agent: light-orchestrator
    part: request capture
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 59,866 input · 1,008,640 cache read · 0 cache write · 24,144 output · 1,092,650 total
  time: 3m 45s
---

# Request 040 — Update an existing `.light-kit/` on light-init

Date: 2026-11-22
Requested by: the user

## Original request
> when running light-init, if there is already .light-kit folder, update all documents in this folder to the new kit. don't ecrase the current documents, but update it

## References
- `kit/skills/light-init/SKILL.md` — currently only creates missing documents; no update path for an existing install.
- `tools/build.mjs` — `.light-kit/templates/*` and `.light-kit/hooks.config.json` are seeds, so an upgrade never refreshes them.
- `tools/install.mjs` — install loop and the `seed` / `overwrite` rules.
- `docs/installation.md:56` — states that a soft install updates `.light-kit/{audit,templates}`, which the code contradicts.
- `specs/039-rules-promotion-threshold/60-conclusion.md:52` — deferred debt: existing `.light-kit/rules.md` keeps the old literal-3 prose after an upgrade.
- `specs/037-project-rules/60-conclusion.md` — rules seeding and the user-owned-file rule.
- `kit/templates/project-profile.md`, `kit/templates/rules.md`, `kit/templates/project-hooks.config.json`, `kit/templates/models.json`, `kit/templates/projects.md` — the documents to reconcile.
- `kit/hooks/lib/config.mjs` — `DEFAULT_MODES` and the existing recursive JSON merge semantics.
