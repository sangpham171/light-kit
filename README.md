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

Then, in your AI client, run the **init** command. It adapts to an existing project (adopt) or proposes best practices (greenfield) and fills the project profile.

## How a request flows
`request "<what you want>"` creates `specs/NNN-slug/` and triages the request:

| Workflow | When | Steps |
|---|---|---|
| `direct` | easy, clear, low risk | understand → implement → review → conclude, no questions |
| `standard` | medium | + discovery, plan; tester and reviewer in parallel |
| `full` | complex, ambiguous or risky | clarify (gate) → discover → design (gate) → plan → implement → tester/reviewer/security in parallel → conclude |

Override with `--workflow`. Artifacts: `00-request`, `10-understanding`, `20-discovery`, `30-design`, `40-plan`, `50-implementation`, `60-conclusion`, plus `status.md`.

Agents: orchestrator, product-owner, business-analyst, ux-designer, architect, tech-lead, developer, tester, reviewer, security-reviewer, tech-writer. Any agent or command can be invoked manually.

## Generated layout
| Client | Output |
|---|---|
| Claude Code | `.claude/{agents,commands,skills}`, `CLAUDE.md` |
| Copilot | `.github/{agents,prompts,skills}`, `copilot-instructions.md` |
| Cursor | `.cursor/{rules,commands}` |
| Codex | `.codex/agents/*.toml`, `.agents/skills`, `AGENTS.md` (prompts in `.codex/prompts/` to copy to `~/.codex/prompts/`) |
| all | `AGENTS.md`, `.light-kit/{workflows,templates,profiles}` |

Client formats change often; they are defined in one place (`CLIENTS` in `tools/build.mjs`). Copilot and Cursor have no parallel subagents here, so parallel steps run sequentially there.

## Develop
`npm test` lints the kit (e.g. workflows reference real agents) and tests generation and install.
