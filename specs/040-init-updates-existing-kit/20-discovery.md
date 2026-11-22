---
step: discover
runs:
  - agent: light-tech-lead
    part: code and convention discovery
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 1,878 input · 258,176 cache read · 0 cache write · 2,877 output · 262,931 total
  time: 15s
---

# Discovery

## Prior requests
- **037** seeded `.light-kit/rules.md` per project and made it user-owned; `tools/uninstall.mjs` keeps it on soft uninstall.
- **039** added `## Rules` / `Promotion threshold: 3` to the profile template and left TD-1 open: existing profiles and rules keep the old wording after an upgrade. This request closes TD-1 with an additive update, not a prose rewrite.
- **032, 033, 038** built the header/usage, prior-spec and tool-log hooks; the new script follows the same generated-script pattern as `.light-kit/audit/audit.mjs` and `.light-kit/hooks/run.mjs`.

## Relevant code
- `tools/build.mjs:58` — `loadKit()` reads `kit/hooks` and `kit/audit` with `loadFiles`; a new `kit/init` folder joins the same list.
- `tools/build.mjs:297-339` — `build()` emits shared files. Line 302 marks every `.light-kit/templates/*` as `seed: true`; lines 305-306 and 318 do the same for the profile, rules and models seeds; line 332 seeds the full hooks config.
- `tools/install.mjs:99-100` — `seed` files are skipped when they exist; `overwrite: true` files are rewritten. The install report already lists `written`, `unchanged` and `skipped`.
- `tools/uninstall.mjs:20-21,108` — templates are already treated as kit-owned (`kitOwned`, and the template tree is removed on soft uninstall), which confirms the seed flag is inconsistent with the rest of the kit.
- `kit/hooks/lib/config.mjs` — `DEFAULT_MODES` lists every hook mode; `deepMerge` shows the kit's additive JSON merge (arrays union, scalars from the nearer layer).
- `kit/skills/light-init/SKILL.md:11-14,18` — install-level detection, and step 2 which creates the profile and rules only when missing; no update path exists.
- `docs/installation.md:56` — claims a soft install updates `.light-kit/{audit,templates}`; line `tools/build.mjs:302` contradicts it (pre-existing doc/code drift).
- `docs/usage.md:8,11` — the profile and rules are user-owned; line 11 tells users to add new settings by hand because upgrades never overwrite them.
- `tests/kit.test.mjs:228-233` — pins templates as seeds ("both survive an upgrade"); this test must change.
- `tests/kit.test.mjs:8-9` — tests import `build`/`install` directly and inspect a temp install; the new merge module is tested the same way.

## Conventions
- Two-space indentation, ES modules, no dependencies.
- Generated kit scripts carry `// light-kit:generated`; the installer overwrites them and uninstall removes them.
- Kit sources stay under `kit/`, generators under `tools/`, tests under `tests/` (`.test.mjs`), docs under `docs/`.
- User-owned files are additive-only: never rewrite or delete content the user may have edited.

## Constraints
- No new dependency. Node 18+ only.
- The generated script must work at project, workspace and user level; at user level the kit lives in `~/.light-kit` and the project is the current folder.
- Hooks installed in a project protect `.light-kit/hooks/**`; `.light-kit/init/**` is not protected, so the generated script can be replaced on upgrade.
- `light-init` in an installed project can only read what the installer wrote; it cannot fetch a new kit version.

## Reuse candidates
- `deepMerge` (`kit/hooks/lib/config.mjs`) for JSON semantics, reimplemented inside the standalone generated script (it cannot import `tools/`).
- `loadFiles` + the audit/hooks emission pattern in `build()` for the new `kit/init` folder.
- The install report shape (`written`/`unchanged`/`skipped`) for the merge report.
- `formatUsage`/header patterns are unrelated; no reuse.

## Unknowns / risks
- **Stale templates on the first upgrade:** installs made before this change carry templates that were never refreshed. The merge can only add what the current template has after the installer has refreshed it; docs must state this.
- **Section-only merge skips changed prose.** A changed sentence inside an existing section is not replaced. Accepted per the understanding's default; documents the limit in the skill/docs.
- **Setting-line heuristic** (`^[A-Z][\w ]+: value`) could match a user's own line that looks like a setting. Adding a duplicate is avoided by exact-line comparison; the risk is only a missing addition, never data loss.
- **Workspace level:** the merge script lives once at the workspace root and must accept `--project <path>` to update a project's `.light-kit`; template root stays next to the script.
- **User level:** the script and templates live in `~/.light-kit`; the target is the current project, so the script must not mistake its own folder for the target.
