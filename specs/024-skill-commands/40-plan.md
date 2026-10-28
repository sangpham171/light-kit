---
step: plan
runs:
  - agent: light-tech-lead
    model: deepseek/deepseek-flash
    thinking: high
    level: medium
usage:
  tokens: 0 input · 0 cache read · 0 cache write · 0 output · 0 total
  time: 0s
---

# Plan

- [x] 1. Move the eight commands that own a procedure into skills (`light-init`, `light-bootstrap`, `light-standardize`, `light-request`, `light-plan`, `light-implement`, `light-review`, `light-status`) — level: medium — files: `kit/skills/*/SKILL.md` — verify: each has `name`, `description`, `purpose`, no `$ARGUMENTS` — commit: `refactor(kit): ship commands as skills`
- [x] 2. Merge the two delegating commands into their skills (`light-triage`, `light-audit`) and delete `kit/prompts/` — level: easy — files: `kit/skills/light-{triage,audit}/SKILL.md` — verify: `loadKit()` has no `prompts` — commit: as task 1
- [x] 3. Stop generating command/prompt files for every client and drop the client argument tables — level: medium — files: `tools/build.mjs` — verify: generated paths contain no `/commands/` or `/prompts/` — commit: `refactor(tools): drop per-client prompt generation`
- [x] 4. Sweep the command files earlier versions wrote, including the VS Code prompt folders at user level — level: medium — files: `tools/{build,install,uninstall}.mjs` — verify: upgrade test removes marker files and keeps the user's own — commit: as task 3
- [x] 5. Drop the prompt component type from the audit and count skills listed under Commands as entry points — level: easy — files: `kit/audit/audit.mjs` — verify: `node kit/audit/audit.mjs --source kit` reports no unreferenced skill and no stale reference — commit: `refactor(audit): audit skills only`
- [x] 6. Reword the instructions, workflows, hook messages and docs — level: medium — files: `kit/instructions/core.md`, `kit/workflows/standardize.md`, `kit/hooks/checks/*.mjs`, `kit/hooks/README.md`, `README.md`, `docs/*.md`, `.light-kit/codebase-map.md` — verify: no `/light-*` reference is left — commit: `docs: describe the light-* entry points as skills`
- [x] 7. Update the tests that assert command paths, and cover the sweep — level: medium — files: `tests/*.test.mjs` — verify: `npm test` green — commit: `test: cover commands as skills`

## Risks
- A client that only lists prompt files loses the slash entry point; names and descriptions keep the skills
  discoverable and explicit invocation works wherever the client lists skills.
- The sweep must never delete a user's own command file: it stays marker-checked.

## Test strategy
`npm test` (kit lint, generation, install, upgrade, uninstall, audit) plus a manual install into a temporary
folder to inspect the generated layout.

## Parallelisable tasks
1 and 2 are the same edit batch; 5 and 6 are independent of 3–4; 7 depends on all.
