# light-kit

A high-level spec-driven development kit that works with any language or framework and with Claude Code, GitHub Copilot, Cursor and Codex.

You write agents, skills, prompts and workflows once in `kit/` (client-neutral markdown). `tools/install.mjs` generates the files each client expects.

## Three install levels
| Level | Where | For |
|---|---|---|
| **user** | your home folder: `~/.claude`, `~/.copilot`, `~/.cursor`, `~/.codex` (+ `~/.agents`, `~/.light-kit`) | the kit available in **every** project you open |
| **workspace** | a folder holding several projects | several projects (separate repositories, or one repository with several projects), each with its own stack |
| **project** | one project | everything lives in that project |

**User level.** Agents, skills, commands, workflows and hooks are installed once, in the folders your clients read for all projects (existing files are kept; instruction files and settings only get a marked block or merged entries). Nothing project-specific is installed: the safety hooks (secrets, sensitive files, dangerous commands, protected paths) protect every project right away, while the specs, commit and branch workflow turn on **per project** when you run `init` there (it creates that project's `.light-kit/` with its profile, map and hooks config). Hook settings stack: `~/.light-kit/hooks.config.json` (yours, for all projects), then a workspace's, then the project's. A project that has its own project-level install uses that instead of the user-level hooks for the same client. Limits: Copilot prompt files and Cursor rules cannot be installed globally (Cursor keeps user rules in its settings, VS Code keeps prompts in its profile folder), so use a project-level install for those.

**Workspace level.** The kit's agents, skills, commands, workflows and hooks are installed **once at the workspace folder**. Each project keeps its **own** profile, codebase map, hooks config, assessment and `specs/` in `<project>/.light-kit/`, and these override the workspace defaults, so a project is never judged by another's conventions. `.light-kit/projects.md` is the registry (purpose, stack as found, repository, who talks to whom). The `request` command first works out which project(s) a request touches (`project-scope` skill), keeps each request in the right project's `specs/`, and handles several repositories (a branch and commits per repository, one `repos` entry in `status.md`). Start your AI client from the workspace folder, not from a project inside it.

**Picking the level.** The installer chooses for you: `user` when the target is your home folder (or with `--level user`, which needs no folder), `workspace` when it finds two or more nested repositories (or `--projects api,web`), otherwise `project`. Force it with `--level user|workspace|project`. Pointing at a client's own folder works too: `node tools/install.mjs ~/.claude` installs the user-level kit for Claude only (into your home folder, never nested inside `.claude`), and `proj/.cursor` installs the project-level kit for Cursor into `proj`. Without `--clients` it detects the clients from their folders (at user level: `~/.claude`, `~/.copilot`, `~/.cursor`, `~/.codex`/`~/.agents`; otherwise `.claude`/`CLAUDE.md`, `.cursor`, Copilot files under `.github`, `.codex`/`.agents`, also inside workspace projects). At project and workspace level, finding none installs all four; at user level it stops and asks you to pass `--clients`, rather than create folders for tools you may not use. Monorepo projects (one repository) are discovered by `init`. Try `--dry-run` first.

## Quick start
```sh
node tools/install.mjs /path/to/your/project-or-workspace [--level user|workspace|project] [--clients claude,copilot,cursor,codex] [--projects api,web]
```
For all your projects at once: `node tools/install.mjs --level user`.

Omit `--clients` to reuse `kit.config.json` (or install all four). Use `--dry-run` to preview. Re-running is safe:
- instruction files (`CLAUDE.md`, `AGENTS.md`, `.github/copilot-instructions.md`) only get a `<!-- light-kit:start/end -->` block replaced or appended
- generated files are overwritten only if they carry the light-kit marker; your own files are skipped and listed

Then, in your AI client, run the **init** command:
- **Existing project (adopt):** detects your stack and conventions, writes `.light-kit/project-profile.md` and a one-time `.light-kit/codebase-map.md`, then assesses the project against **its own** standards (what is good, what deviates). It proposes only minor, behavior-preserving, non-breaking fixes in `.light-kit/standardization-backlog.md` (never refactors) and changes nothing until you run `standardize` (all items, or some by id; one verified commit per item, on a work branch), then use `request`.
- **New project (greenfield):** asks for stack and constraints, proposes best practices, writes the profile. Then run `bootstrap` to define the vision, architecture and a working skeleton.

`.light-kit/project-profile.md` is yours: kit upgrades never overwrite it.

## How a request flows
`request "<what you want>"` creates `specs/NNN-slug/` and triages the request:

| Workflow | When | Steps |
|---|---|---|
| `direct` | easy, clear, low risk | understand → implement → review → conclude, no questions |
| `standard` | medium | + discovery, plan; tester and reviewer in parallel |
| `full` | complex, ambiguous or risky | clarify → discover → design → plan → implement → tester/reviewer/security in parallel → conclude |

`bootstrap` (new projects, started by the `bootstrap` command rather than triage) runs vision → architecture → plan → skeleton → review. Override triage with `--workflow`. Artifacts: `00-request`, `10-understanding`, `20-discovery`, `30-design`, `40-plan`, `50-implementation`, `60-conclusion`, plus `status.md`.

Agents: orchestrator, product-owner, business-analyst, ux-designer, architect, tech-lead, developer, tester, reviewer, security-reviewer, tech-writer. Any agent or command can be invoked manually.

## Safety hooks
Installed by default for every client that supports hooks (use `--no-hooks` to skip). They protect against the common mistakes of agent-driven work, with no stack assumptions built in:
- block reading or editing files that hold secrets, and writing secrets into files or prompts
- block dangerous commands (mass deletion, force push, hard reset, piping downloads into a shell, environment dumps, destructive database statements)
- keep commit messages and pull request text clean: no AI attribution (`Co-Authored-By` an assistant, "Generated with …") and no trailers
- protect version-control internals, the hooks themselves and paths you declare generated or locked
- warn when work starts without an active request, run your format/lint commands after edits, flag secrets in tool output, and give each session its context
- optional: verify before the agent finishes, and an audit log

What is specific to your project (secret file names, secret variable naming, generated paths, format/lint/test commands) lives in `.light-kit/hooks.config.json`, which `init` fills from what it finds in your repo. See `kit/hooks/README.md` for every hook and key. Hooks need Node 18+ on the machine running the AI client.

## Decisions
The agents decide and move on: they pick the best option, record it with a one-line reason, and tell you in one line. They stop to ask only when two or more options are genuinely equivalent, or when a fact only you have is missing. Questions are short, plain and functional, with trade-offs as a comparison table (`approval-summary` skill).

## Commits
The agent commits as it goes, so history stays reviewable (`commit` skill, set up by `init`):
- the plan is committed once validated, **before** implementation starts; understanding and design are committed once settled
- one commit per verified plan task, one per review fix, one for the conclusion
- only the files of each unit are staged, messages follow your convention (Conventional Commits by default) and contain only the change description (no trailers, no AI attribution: the instructions forbid it, a hook blocks it, and for Claude Code the installer switches off its own `attribution` setting unless you set one), and nothing is ever pushed
- at the start of a request the agent records the base branch and base commit in `status.md` (so reviewers know exactly where to start: `git diff <base_commit>..HEAD`), and if you are on `main`, `master` or another protected branch it first moves to a new `<type>/<NNN-slug>` branch; a hook refuses commits on protected branches
- `Mode: auto | ask | off` in `.light-kit/project-profile.md` controls it; a hook reminds the agent when too many files pile up uncommitted

## Generated layout
| Client | Output |
|---|---|
| Claude Code | `.claude/{agents,commands,skills}`, `CLAUDE.md` |
| Copilot | `.github/{agents,prompts,skills}`, `copilot-instructions.md` |
| Cursor | `.cursor/{rules,commands}` |
| Codex | `.codex/agents/*.toml`, `.agents/skills`, `AGENTS.md` (prompts in `.codex/prompts/` to copy to `~/.codex/prompts/`) |
| all | `AGENTS.md`, `.light-kit/{workflows,templates,profiles,project-profile.md,hooks.config.json,hooks/}` (at user level: `~/.light-kit/...`, and `~/.codex/AGENTS.md`, `~/.claude/CLAUDE.md`, `~/.copilot/copilot-instructions.md`) |
| hooks | `.claude/settings.json`, `.codex/hooks.json`, `.cursor/hooks.json`, `.github/hooks/light-kit.json` (merged, your own hooks are kept) |

Client formats change often; they are defined in one place (`CLIENTS` in `tools/build.mjs`). Copilot and Cursor have no parallel subagents here, so parallel steps run sequentially there.

## Develop
`npm test` lints the kit (e.g. workflows reference real agents) and tests generation and install.
