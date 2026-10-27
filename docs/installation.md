# Installation

## Requirements
- Node 18 or newer on the machine running your AI client.
- At least one supported client: Claude Code, GitHub Copilot, Cursor or Codex.

## Platforms
The installer and uninstaller are plain Node scripts: they use Node's own home-folder and path APIs and run no POSIX-only commands, so they are not tied to an OS. Only the paths differ.

| Platform | Project install | Home folder |
|---|---|---|
| macOS, Linux | `node tools/install.mjs /path/to/project` | `~` (`/Users/you`, `/home/you`) |
| Windows (PowerShell or Command Prompt) | `node tools\install.mjs C:\path\to\project` | `%USERPROFILE%` (`C:\Users\you`) |
| WSL | as macOS/Linux | `~` in the WSL distribution |

At user level, the `~/.claude`, `~/.light-kit` and other paths in this document are `%USERPROFILE%\.claude`, `%USERPROFILE%\.light-kit`, and so on on Windows. The generated instructions keep the `~/...` spelling for brevity.

The safety hooks are registered as shell commands. Claude Code and Codex use POSIX expansions in their project hooks (`"$CLAUDE_PROJECT_DIR"/`, `"$(git rev-parse --show-toplevel)"/`), and every client's user-level hooks use `"$HOME"/`; Cursor and Copilot project hooks use a plain relative path. Claude Code and Codex, and any user-level install, therefore need a POSIX shell — bash or sh, as provided by macOS, Linux and WSL. Native Windows hook execution is not verified: use WSL, or install with `--no-hooks` if the hooks do not fire. The hook checks are Node scripts; they use `git` and `sqlite3` when available and stay silent when those are missing.

## Quick start
```sh
node tools/install.mjs /path/to/your/project-or-workspace [--level user|workspace|project] [--clients claude,copilot,cursor,codex] [--projects api,web] [--force | --force-all]
```
For every project on the machine: `node tools/install.mjs --level user`.

After installing, open the project in your AI client and run `/light-init` (see [After installing](#after-installing)).

Flags:

| Flag | Effect |
|---|---|
| `--level user\|workspace\|project` | Force the install level (see below). |
| `--clients a,b` | Install for these clients only. Omit to reuse `kit.config.json` or detect the clients from their folders. |
| `--projects api,web` | Workspace level: the projects to register. |
| `--dry-run` | Preview what would be written, without changing anything. |
| `--no-hooks` | Skip the safety hooks. |
| `--force` | Overwrite kit files the installer would otherwise leave alone (files without the light-kit marker, and seeds such as the project profile). Shared instruction files stay merged. |
| `--force-all` | As `--force`, and also replace shared instruction files (`CLAUDE.md`, `AGENTS.md`, ...) with the kit block alone, discarding any content of your own in them. |

Hook registrations (`settings.json`, ...) are always merged, never replaced, because they hold unrelated settings.

## Re-running
Re-running the installer is safe:
- instruction files (`CLAUDE.md`, `AGENTS.md`, `.github/copilot-instructions.md`) only get a `<!-- light-kit:start/end -->` block replaced or appended
- generated files are overwritten only if they carry the light-kit marker; your own files are skipped and listed
- obsolete generated files from earlier kit versions are removed (only files carrying the light-kit marker)

## Uninstall
```sh
node tools/uninstall.mjs /path/to/project [--soft | --hard] [--dry-run]
```
Soft is the default. Both modes are idempotent and leave alone any file the kit does not own (no light-kit marker and not a kit-owned seed), so your own agents, skills and hooks survive.

| Mode | Removes | Keeps |
|---|---|---|
| `--soft` (default) | client agents, commands, skills, rules, prompts and TOML; the instruction blocks in `CLAUDE.md`, `AGENTS.md` and Copilot instructions; light-kit hook entries (`settings.json`, `hooks.json`) with your own hooks intact; the generated files in `.light-kit/{workflows,profiles,hooks}`; `.light-kit/{audit,templates}`; `kit.config.json` | `specs/`; `.light-kit/{project-profile.md,hooks.config.json,models.json,projects.md}`; the codebase map, assessment and backlog |
| `--hard` | all of soft, plus the kit's own folders: `.light-kit/` and `specs/` | files outside the kit's folders that the kit does not own |

Hard mode asks for confirmation; `--yes` skips the question, and without a terminal it refuses until `--yes` is passed. At user level hard removes `~/.light-kit/` only (there is no `specs/` at that level); at workspace level it also removes every registered project's `.light-kit/` and `specs/`.

Target, `--level`, `--clients` and `--projects` work as for the installer, and the saved `kit.config.json` fills them in when omitted. `--dry-run` shows what would be removed without changing anything.

## Three install levels
| Level | Where | For |
|---|---|---|
| **user** | your home folder: `~/.claude`, `~/.copilot`, `~/.cursor`, `~/.codex` (+ `~/.agents`, `~/.light-kit`) | the kit available in **every** project you open |
| **workspace** | a folder holding several projects | several projects (separate repositories, or one repository with several projects), each with its own stack |
| **project** | one project | everything lives in that project |

**User level.** Agents, skills, commands, prompts, workflows and hooks are installed once, in the folders your clients read for all projects (existing files are kept; instruction files and settings only get a marked block or merged entries). Nothing project-specific is installed: the safety hooks (secrets, sensitive files, dangerous commands, protected paths) protect every project right away, while the specs, commit and branch workflow turn on **per project** when you run `/light-init` there (it creates that project's `.light-kit/` with its profile, map and hooks config). Hook settings stack: `~/.light-kit/hooks.config.json` (yours, for all projects), then a workspace's, then the project's. A project that has its own project-level install uses that instead of the user-level hooks for the same client. Limits: Cursor rules cannot be installed globally (Cursor keeps user rules in its settings), so use a project-level install for those. Copilot prompts are installed in `~/.copilot/prompts`; VS Code reads user prompt files from its own profile folder, so the `/light-*` commands in Chat still need a project-level install.

**Workspace level.** The kit's agents, skills, commands, workflows and hooks are installed **once at the workspace folder**. Each project keeps its **own** profile, codebase map, hooks config, assessment and `specs/` in `<project>/.light-kit/`, and these override the workspace defaults, so a project is never judged by another's conventions. `.light-kit/projects.md` is the registry (purpose, stack as found, repository, who talks to whom). `/light-request` first works out which project(s) a request touches (`light-project-scope` skill), keeps each request in the right project's `specs/`, and handles several repositories (a branch and commits per repository, one `repos` entry in `status.md`). Start your AI client from the workspace folder, not from a project inside it.

## Choosing the level
The installer chooses for you:
- `user` when the target is your home folder (or with `--level user`, which needs no folder)
- `workspace` when it finds two or more nested repositories (or with `--projects api,web`)
- otherwise `project`

Force it with `--level user|workspace|project`.

Pointing at a client's own folder works too: `node tools/install.mjs ~/.claude` installs the user-level kit for Claude only (into your home folder, never nested inside `.claude`), and `proj/.cursor` installs the project-level kit for Cursor into `proj`.

Without `--clients` the clients are detected from their folders (at user level: `~/.claude`, `~/.copilot`, `~/.cursor`, `~/.codex`/`~/.agents`; otherwise `.claude`/`CLAUDE.md`, `.cursor`, Copilot files under `.github`, `.codex`/`.agents`, also inside workspace projects). At project and workspace level, finding none installs all four; at user level it stops and asks you to pass `--clients`, rather than create folders for tools you may not use.

Monorepo projects (one repository) are discovered by `/light-init`.

## Generated layout
| Client | Output |
|---|---|
| Claude Code | `.claude/{agents,commands,skills}`, `CLAUDE.md` |
| Copilot | `.github/{agents,prompts,skills}`, `copilot-instructions.md` |
| Cursor | `.cursor/{rules,commands}` |
| Codex | `.codex/agents/*.toml`, `.agents/skills`, `AGENTS.md` (prompts in `.codex/prompts/` to copy to `~/.codex/prompts/`) |
| all | `AGENTS.md`, `.light-kit/{workflows,templates,profiles,project-profile.md,hooks.config.json,hooks/}` (at user level: `~/.light-kit/...`, and `~/.codex/AGENTS.md`, `~/.claude/CLAUDE.md`, `~/.copilot/copilot-instructions.md`, `~/.copilot/{agents,prompts,skills,hooks}`) |
| hooks | `.claude/settings.json`, `.codex/hooks.json`, `.cursor/hooks.json`, `.github/hooks/light-kit.json` (merged, your own hooks are kept) |

Client formats change often; they are defined in one place, `CLIENTS` in `tools/build.mjs`. Copilot and Cursor have no parallel subagents here, so parallel steps run sequentially there.

## After installing
| Client | What to do |
|---|---|
| Claude Code | Run `/light-init` in the project. |
| Copilot | Open the repository in VS Code; project-level prompt files give the `/light-*` commands in Copilot Chat. |
| Cursor | Use the `/light-*` commands in chat; agent roles and skills are rules in `.cursor/rules/`. |
| Codex | Start `codex` in the project and run `/hooks` once to review and trust the installed hooks. Copy `.codex/prompts/*` to `~/.codex/prompts/` (`%USERPROFILE%\.codex\prompts` on Windows) for the `/light-*` commands; a user-level install puts them there already. |

After a user-level install, restart the client so it picks up the new files. The limits of a user-level install are listed under [Three install levels](#three-install-levels).
