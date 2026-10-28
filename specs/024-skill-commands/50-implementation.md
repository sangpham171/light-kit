---
step: implement
runs:
  - agent: light-developer
    model: deepseek/deepseek-flash
    thinking: high
    level: medium
usage:
  tokens: 1,047,258 input · 0 cache read · 0 cache write · 4,871 output · 1,052,129 total
  time: 57s
---

# Implementation log

## Progress
- `kit/skills/light-{init,bootstrap,standardize,request,plan,implement,review,status}/SKILL.md` (new): the eight
  commands that own a procedure, with `name`, `description` and `purpose`; bodies rewritten without a client
  argument placeholder and with the options (`adopt|greenfield`, item ids, `--workflow`, `--review-turns`,
  `--apply`, a `specs/NNN-slug` path) described as text the user may include.
- `kit/skills/light-triage/SKILL.md`, `kit/skills/light-audit/SKILL.md`: absorb their command (report-only
  triage; `--apply` in the kit's own repository) and say when they are used as an entry point.
- `kit/prompts/` deleted.
- `tools/build.mjs`: `prompts` gone from `loadKit`, `lint`, `adaptKit`, `auditManifest` and every `CLIENTS`
  entry; the `ARGS`/`promptBody` argument tables and the Copilot prompt mapping in `USER_PATHS` are gone;
  `legacyPromptRoots(clients, level, home)` lists the folders earlier versions wrote commands to.
- `tools/install.mjs`, `tools/uninstall.mjs`: sweep those folders on install and uninstall (marker-checked);
  the Codex "copy `.codex/prompts`" note is gone.
- `kit/audit/audit.mjs`: no `prompt` component type or `commands` cost bucket; skills named in the Commands
  section count as used by the user, so entry points are not reported as orphans.
- `kit/instructions/core.md`, `kit/workflows/standardize.md`, `kit/hooks/checks/{require-spec,session-context}.mjs`,
  `kit/hooks/README.md`: wording follows the new shape.
- `tests/{kit,audit,models,workspace,uninstall}.test.mjs`: assert skills instead of command files; new coverage
  for "no client gets a command or prompt file" and for the legacy sweep at project and user level.
- `README.md`, `docs/{installation,usage,development,auditing,commits,safety-hooks,model-routing}.md`,
  `.light-kit/codebase-map.md`: describe the entry points as skills and the sweep on upgrade.

## Decisions
- **One skill per command, same names** (not a single catch-all skill): users keep the vocabulary the
  instructions and workflows already use, and a client that lists skills still shows ten entry points.
- **The two delegating commands merge into their skills** rather than getting a duplicate skill, because their
  whole body was "apply `light-audit` / `light-triage`".
- **Cursor keeps rules as its skill surface** (unchanged): `.cursor/rules/light-*.mdc`, one per skill.
- **The legacy sweep is kept, not deleted**, so an upgrade does not leave stale `/light-*` commands beside the
  new skills; it only removes files carrying the light-kit marker.

## Verification
- `npm test`: 150 passed, 0 failed (kit lint, generation for all four clients, install, upgrade, uninstall, audit).
- `node kit/audit/audit.mjs --source kit`: 23 skills, no unreferenced component, no stale reference.
- `node tools/install.mjs <tmp> --clients claude,copilot,cursor,codex`: 202 files, no `commands/` or `prompts/`
  folder; skills under `.claude/skills`, `.github/skills`, `.agents/skills` and `.cursor/rules`.

## Technical debt
- `vscodePromptDirs` and the `home` parameter of `USER_PATHS.copilot` now serve the legacy sweep only; drop them
  in a release that no longer needs to clean up after 0.x installs.
- `detectClients` still treats `.github/prompts` as evidence of a Copilot project: useful for detection, but it
  will outlive the files it looks for.
- No test checks that a skill description contains wording a model will match on; the entry points rely on
  their descriptions being good.

## Review rounds
Round 1 (reviewer, checklist `light-review-checklist`):
- F-1.1 nit, fixed — `README.md`: the get-started example read like a shell command; it now reads
  `light-request: …`, which is what a user types in chat.
- F-1.2 nit, fixed — `tools/build.mjs`: `USER_PATHS.copilot` carried a `home` parameter no branch used.
Verdict: approve. `npm test` 150/150 after the fixes.
