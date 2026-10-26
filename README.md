# light-kit

Spec-driven development for AI coding clients: Claude Code, GitHub Copilot, Cursor and Codex.

You write agents, skills, prompts and workflows once in `kit/`; `tools/install.mjs` generates the files each client expects. Work is organised per request: each one is triaged, runs the workflow it needs, and leaves a trail of spec artifacts in `specs/NNN-slug/`.

## Requirements
- **Node 18 or newer** on the machine that runs your AI client.
- At least one supported client: Claude Code, GitHub Copilot, Cursor or Codex.
- macOS, Linux, WSL or Windows. The installer is plain Node; the Claude Code and Codex safety hooks need a POSIX shell (see [Platforms](docs/installation.md#platforms)).

## Install

### 1. Get the kit
```sh
git clone https://github.com/sangpham171/light-kit.git
cd light-kit
```

### 2. Install it
One project, from the kit folder:

| Platform | Command |
|---|---|
| macOS, Linux, WSL | `node tools/install.mjs /path/to/your/project` |
| Windows (PowerShell or Command Prompt) | `node tools\install.mjs C:\path\to\your\project` |

Every project on the machine (user level):
```sh
node tools/install.mjs --level user
```
This installs into your home folder — `~` (`/Users/<you>`, `/home/<you>`), or `%USERPROFILE%` (`C:\Users\<you>`) on Windows — creating `.claude`, `.copilot`, `.cursor`, `.codex`, `.agents` and `.light-kit` there (`%USERPROFILE%\.claude` on Windows). At this level only the clients whose folder already exists are installed; pass `--clients` to create the others.

Several projects in one folder (workspace level):
```sh
node tools/install.mjs /path/to/your/workspace
```
Some clients only:
```sh
node tools/install.mjs /path/to/your/project --clients claude,cursor
```
`--dry-run` previews what would be written; `--no-hooks` skips the safety hooks. Re-running is safe: kit-generated files are replaced, your own files are left alone.

At project and workspace level, without `--clients` the clients are detected from the folders already there (`.claude`, `CLAUDE.md`, `.cursor`, Copilot files under `.github`, `.codex`/`.agents`); if it finds none, it installs all four.

### 3. Open your client
Run `/light-init` once per project: it writes the project profile, codebase map and assessment.

| Client | Files written | After install |
|---|---|---|
| **Claude Code** | `CLAUDE.md`, `.claude/{agents,commands,skills}`, hooks merged into `.claude/settings.json` | Open the project and run `/light-init`. |
| **GitHub Copilot** | `.github/copilot-instructions.md`, `.github/{agents,prompts,skills}`, `.github/hooks/light-kit.json` | Open the repository in VS Code; the `/light-*` commands are available in Copilot Chat. |
| **Cursor** | `.cursor/rules/*.mdc`, `.cursor/commands/`, hooks merged into `.cursor/hooks.json` | Open the project in Cursor; the `/light-*` commands are available in chat. |
| **Codex** | `AGENTS.md`, `.codex/agents/*.toml`, `.agents/skills/`, hooks merged into `.codex/hooks.json` | Start `codex` in the project, run `/hooks` once to trust the hooks, and copy `.codex/prompts/*` to `~/.codex/prompts/` for the `/light-*` commands (a user-level install already places them there). |

At project and workspace level, `AGENTS.md` is also written for Copilot and Cursor. At user level, Copilot prompt files and Cursor rules are not installed (VS Code keeps prompts in its profile folder, Cursor keeps user rules in its settings); use a project-level install to get those.

Install levels, detection rules, all flags, the generated layout and uninstall: [docs/installation.md](docs/installation.md).

## Uninstall
```sh
node tools/uninstall.mjs /path/to/your/project          # soft: keep your profile, settings and specs/
node tools/uninstall.mjs /path/to/your/project --hard   # also delete .light-kit/ and specs/
```
Soft is the default: it removes every file the installer generated and leaves your project knowledge and request artifacts. `--hard` also removes the kit's own folders and asks for confirmation (`--yes` skips the question). Outside those folders, neither mode deletes a file the kit does not own.

## Get started
1. Install the kit.
2. Open the project in your AI client and run `/light-init`. It detects the stack and turns the kit on for this project (`.light-kit/project-profile.md`).
3. Ask for work:
   ```
   /light-request "Add an export button to the report page"
   ```
   The request is triaged. Easy work starts immediately; complex work is clarified first. Artifacts land in `specs/001-add-export-button/`.
4. `/light-status` shows where every request stands.

For a new project, run `/light-bootstrap "<what the project is for>"` after `/light-init` to define the vision, architecture and skeleton.

## Commands
| Command | What it does |
|---|---|
| `/light-init` | Set up the kit in this project: profile, codebase map, assessment. |
| `/light-request "<what you want>"` | Start a request; triage picks the workflow and runs it end to end. |
| `/light-triage "<request>"` | Score a request and recommend a workflow without running it. |
| `/light-plan <specs/NNN-slug>` | Produce or refresh discovery, design and plan for a request. |
| `/light-implement <specs/NNN-slug>` | Implement an existing request's plan, task by task. |
| `/light-review <specs/NNN-slug>` | Review a request's implementation. |
| `/light-status [specs/NNN-slug]` | Show request state, current step and blockers. |
| `/light-bootstrap "<project idea>"` | Define the vision, architecture and skeleton of a new project. |
| `/light-standardize [S-01 …]` | Apply the standardization items found by init. |
| `/light-audit [--apply]` | Find kit guidance that a newer model no longer needs. |

## Documentation
| File | Contents |
|---|---|
| [docs/installation.md](docs/installation.md) | Platforms, install levels, flags, client detection, generated layout, after install, upgrades. |
| [docs/usage.md](docs/usage.md) | Request flow, workflows, artifacts, agents, names, decisions. |
| [docs/model-routing.md](docs/model-routing.md) | Choosing a model per step and per plan task. |
| [docs/commits.md](docs/commits.md) | Branches, commit checkpoints, message rules. |
| [docs/safety-hooks.md](docs/safety-hooks.md) | What the hooks block and warn about. |
| [docs/auditing.md](docs/auditing.md) | Auditing and trimming the kit. |
| [docs/development.md](docs/development.md) | Repository layout, tests, changing the kit. |
| [kit/hooks/README.md](kit/hooks/README.md) | Every hook and config key. |
