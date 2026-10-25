---
runs:
  - step: understand | agent: light-orchestrator | model: deepseek-flash[1m] | thinking: unknown | level: easy
---

# Understanding

## Restatement
Add `tools/uninstall.mjs`, the reverse of `tools/install.mjs`, with two modes: `--soft` (default) removes everything the installer generated while keeping the user's project knowledge and request artifacts; `--hard` also deletes the kit's own folders (`.light-kit/` and `specs/`). Both modes leave files the kit does not own untouched.

## Mode semantics
| Item | soft (default) | hard |
|---|---|---|
| Generated client files (agents, commands, skills, rules, prompts, TOML) | removed | removed |
| light-kit block in `CLAUDE.md`, `AGENTS.md`, copilot instructions | removed, user text kept | same |
| light-kit entries in client hook settings | removed, user hooks kept | same |
| `.light-kit/{workflows,profiles,hooks,audit,templates}` | removed | removed |
| `kit.config.json` / `.light-kit/kit.config.json` | removed | removed |
| `.light-kit/{project-profile.md,hooks.config.json,models.json,projects.md,codebase-map.md,assessment.md,standardization-backlog.md}` | kept | removed |
| `specs/` | kept | removed |
| Files without the light-kit marker at a kit path | kept | kept |

At user level hard removes `~/.light-kit/` only (no `specs/`, which is not a user-level artifact). At workspace level hard removes the kit folders of the workspace root and of every registered project.

## Assumptions
- Reversing an install is idempotent and safe to re-run.
- Unmanaged files (no marker, not kit-owned seeds) are never deleted.
- Invalid JSON in a client hook file is reported and left alone, never clobbered.
- Hard mode is destructive and asks for confirmation unless `--yes` is given.

## Requirements
1. `tools/uninstall.mjs` exports `uninstall(target, clients, opts)` and a CLI.
2. CLI flags: `--soft` (default), `--hard`, `--yes`, `--dry-run`, `--level`, `--clients`, `--projects`; resolve level and clients from `kit.config.json` like the installer.
3. Same input handling as install: target folder, home as `--level user`, client folder shortcuts.
4. Report removed, kept and skipped paths.
5. Tests cover soft, hard, dry run, idempotency, unmanaged files, user level and hard confirmation.
6. Docs: README, `docs/installation.md`, `docs/development.md`; `package.json` script.

## Acceptance criteria
- After `install` then soft `uninstall`, no kit-generated file remains, while `specs/`, the profile, hooks config, models and init knowledge remain.
- After hard `uninstall`, `.light-kit/` and `specs/` are gone; a user file at a kit path without the marker still exists.
- A user's own hook entry in `.claude/settings.json` survives both modes.
- `CLAUDE.md` keeps the user's text and loses only the marked block.
- `npm test` passes.
- `uninstall.mjs --hard` without `--yes` and without a TTY exits non-zero without deleting anything.

## In scope / Out of scope
In: `tools/uninstall.mjs`, `tools/install.mjs` (export the obsolete-file finder), tests, docs, `package.json`.
Out: uninstalling the kit from the machine's npm/global state (the kit is copied, not a package), removing client folders themselves, changing install behavior.

## Triage
Scores: scope 1, ambiguity 1, risk 1, novelty 2, impact 1 (total 6)
Workflow: standard
Why: a new tool following the installer's structure; destructive only behind an explicit hard flag, and the default is safe.

## Routing
- understand: easy — semantics chosen and recorded.
- discover: easy — reverse of a known generator.
- plan: easy — four small tasks.
- implement: medium — mixed file categories and destructive paths.
- verify-and-review: medium — reviewer checks the safety of every delete.
- conclude: easy — short summary.
