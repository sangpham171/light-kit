# light-kit

Spec-driven development for AI coding clients: Claude Code, GitHub Copilot, Cursor and Codex.

You write agents, skills, prompts and workflows once in `kit/`; `tools/install.mjs` generates the files each client expects. Work is organised per request: each one is triaged, runs the workflow it needs, and leaves a trail of spec artifacts in `specs/NNN-slug/`.

## Requirements
Node 18 or newer, and at least one supported client.

## Install
```sh
node tools/install.mjs /path/to/your/project
```
For every project on the machine:
```sh
node tools/install.mjs --level user
```
`--dry-run` previews the install. Re-running is safe: only kit-generated files are replaced.

Levels, client detection and flags: [docs/installation.md](docs/installation.md).

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
| [docs/installation.md](docs/installation.md) | Install levels, flags, client detection, generated layout, upgrades. |
| [docs/usage.md](docs/usage.md) | Request flow, workflows, artifacts, agents, names, decisions. |
| [docs/model-routing.md](docs/model-routing.md) | Choosing a model per step and per plan task. |
| [docs/commits.md](docs/commits.md) | Branches, commit checkpoints, message rules. |
| [docs/safety-hooks.md](docs/safety-hooks.md) | What the hooks block and warn about. |
| [docs/auditing.md](docs/auditing.md) | Auditing and trimming the kit. |
| [docs/development.md](docs/development.md) | Repository layout, tests, changing the kit. |
| [kit/hooks/README.md](kit/hooks/README.md) | Every hook and config key. |
