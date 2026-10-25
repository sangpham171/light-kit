# light-kit

A high-level spec-driven development kit that works with any language or framework and with Claude Code, GitHub Copilot, Cursor and Codex.

You write agents, skills, prompts and workflows once in `kit/` (client-neutral markdown). `tools/install.mjs` generates the files each client expects.

## Quick start
```sh
node tools/install.mjs /path/to/your/project --clients claude,copilot,cursor,codex
```
Omit `--clients` to reuse `kit.config.json` (or install all four). Use `--dry-run` to preview. Re-running is safe:
- instruction files (`CLAUDE.md`, `AGENTS.md`, `.github/copilot-instructions.md`) only get a `<!-- light-kit:start/end -->` block replaced or appended
- generated files are overwritten only if they carry the light-kit marker; your own files are skipped and listed

Then, in your AI client, run the **init** command:
- **Existing project (adopt):** detects your stack and conventions, writes `.light-kit/project-profile.md` and a one-time `.light-kit/codebase-map.md`. Nothing is restructured. Then use `request`.
- **New project (greenfield):** asks for stack and constraints, proposes best practices, writes the profile. Then run `bootstrap` to define the vision, architecture and a working skeleton.

`.light-kit/project-profile.md` is yours: kit upgrades never overwrite it.

## How a request flows
`request "<what you want>"` creates `specs/NNN-slug/` and triages the request:

| Workflow | When | Steps |
|---|---|---|
| `direct` | easy, clear, low risk | understand → implement → review → conclude, no questions |
| `standard` | medium | + discovery, plan; tester and reviewer in parallel |
| `full` | complex, ambiguous or risky | clarify (gate) → discover → design (gate) → plan → implement → tester/reviewer/security in parallel → conclude |

`bootstrap` (new projects, started by the `bootstrap` command rather than triage) runs vision → architecture → plan → skeleton → review, with gates after the vision and the architecture. Override triage with `--workflow`. Artifacts: `00-request`, `10-understanding`, `20-discovery`, `30-design`, `40-plan`, `50-implementation`, `60-conclusion`, plus `status.md`.

Agents: orchestrator, product-owner, business-analyst, ux-designer, architect, tech-lead, developer, tester, reviewer, security-reviewer, tech-writer. Any agent or command can be invoked manually.

## Safety hooks
Installed by default for every client that supports hooks (use `--no-hooks` to skip). They protect against the common mistakes of agent-driven work, with no stack assumptions built in:
- block reading or editing files that hold secrets, and writing secrets into files or prompts
- block dangerous commands (mass deletion, force push, hard reset, piping downloads into a shell, environment dumps, destructive database statements)
- protect version-control internals, the hooks themselves and paths you declare generated or locked
- warn when work starts without an active request, run your format/lint commands after edits, flag secrets in tool output, and give each session its context
- optional: verify before the agent finishes, and an audit log

What is specific to your project (secret file names, secret variable naming, generated paths, format/lint/test commands) lives in `.light-kit/hooks.config.json`, which `init` fills from what it finds in your repo. See `kit/hooks/README.md` for every hook and key. Hooks need Node 18+ on the machine running the AI client.

## Generated layout
| Client | Output |
|---|---|
| Claude Code | `.claude/{agents,commands,skills}`, `CLAUDE.md` |
| Copilot | `.github/{agents,prompts,skills}`, `copilot-instructions.md` |
| Cursor | `.cursor/{rules,commands}` |
| Codex | `.codex/agents/*.toml`, `.agents/skills`, `AGENTS.md` (prompts in `.codex/prompts/` to copy to `~/.codex/prompts/`) |
| all | `AGENTS.md`, `.light-kit/{workflows,templates,profiles,project-profile.md,hooks.config.json,hooks/}` |
| hooks | `.claude/settings.json`, `.codex/hooks.json`, `.cursor/hooks.json`, `.github/hooks/light-kit.json` (merged, your own hooks are kept) |

Client formats change often; they are defined in one place (`CLIENTS` in `tools/build.mjs`). Copilot and Cursor have no parallel subagents here, so parallel steps run sequentially there.

## Develop
`npm test` lints the kit (e.g. workflows reference real agents) and tests generation and install.
