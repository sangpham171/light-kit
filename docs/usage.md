# Usage

## Setting up a project
`/light-init` prepares the project once:
- **Existing project (adopt):** detects the stack and conventions, writes `.light-kit/project-profile.md` and a one-time `.light-kit/codebase-map.md`, then assesses the project against **its own** standards (what is good, what deviates). It proposes only minor, behavior-preserving, non-breaking fixes in `.light-kit/standardization-backlog.md` (never refactors) and changes nothing until you run `/light-standardize` (all items, or some by id; one verified commit per item, on a work branch).
- **New project (greenfield):** asks for stack and constraints, proposes best practices, writes the profile. Then run `/light-bootstrap` to define the vision, architecture and a working skeleton.

`.light-kit/project-profile.md` is yours: kit upgrades never overwrite it.

## How a request flows
`/light-request "<what you want>"` creates `specs/NNN-slug/` and triages the request:

| Workflow | When | Steps |
|---|---|---|
| `direct` | easy, clear, low risk | understand → implement → review → conclude, no questions |
| `standard` | medium | + discovery, plan; tester and reviewer in parallel |
| `full` | complex, ambiguous or risky | clarify → discover → design → plan → implement → tester/reviewer/security in parallel → conclude |

Override triage with `--workflow`. The `bootstrap` workflow (new projects, started by `/light-bootstrap` rather than triage) runs vision → architecture → plan → skeleton → review.

Artifacts: `00-request`, `10-understanding`, `20-discovery`, `30-design`, `40-plan`, `50-implementation`, `60-conclusion`, plus `status.md`. Skip files the workflow does not need.

Every artifact starts with a `runs:` header recording which agent produced it, with what, so you can see how a result came about:
```
---
runs:
  - step: plan
    agent: light-tech-lead
    model: <model id>
    thinking: <reasoning setting or unknown>
    level: hard
---
```
Each agent run adds one entry (parallel or retried runs add their own). Agents write only what they know, `unknown` otherwise (a model usually knows its own name but not always its reasoning setting). The `session-context` hook detects the thinking effort from the client's own state where one exists: Claude Code (session transcript), VS Code-based clients (the chat model configuration in `state.vscdb`: Copilot, and Cursor when present) and Codex (`~/.codex/config.toml`). Otherwise it stays `unknown`. It covers the files in `specs/<NNN-slug>/` except `status.md`, plus the codebase map, assessment, backlog and audit reports. An `artifact-header` hook warns when a header is missing or incomplete.

Each artifact also ends with a `## Token usage` section holding the step's consumption as `<input>/<output>` (input includes cached prompt tokens), and `60-conclusion.md` holds one row per step plus the overall total. After an artifact is written, the `token-usage` hook reads the Claude Code session transcript, reports the delta since the previous artifact and keeps the request totals in `.light-kit/usage.json` (under a user-level install in a project without `.light-kit/`, in `~/.light-kit/state/`, one file per project, so reporting does not look like `light-init` ran); the agent then fills the section. It works whether or not the project ran `light-init`, because a file under `specs/` is what matters. Usage spent in a session before the request's first artifact is assigned to that artifact. Clients that expose no session record (Copilot, Cursor, Codex) stay `unknown`. The count is best-effort: usage written to a separate subagent transcript is not seen, and the last edit to an artifact is not included.

## Agents
light-orchestrator, light-product-owner, light-business-analyst, light-ux-designer, light-architect, light-tech-lead, light-developer, light-tester, light-reviewer, light-security-reviewer, light-tech-writer. Any agent or command can be invoked manually.

## Names
Everything your AI client lists is prefixed `light-`, so it never clashes with other frameworks: agents (`light-developer`), skills (`light-commit`), commands (`/light-init`, `/light-request`, `/light-bootstrap`, `/light-standardize`, `/light-triage`, `/light-plan`, `/light-implement`, `/light-review`, `/light-status`, `/light-audit`) and Cursor rules. The kit's own folder is `.light-kit`, and its hooks and workflows live inside it. Your project's request folders stay `specs/`. When you upgrade, the installer removes the obsolete generated files of the earlier names (only files carrying the light-kit marker; your own files are never touched).

## Decisions
The agents decide and move on: they pick the best option, record it with a one-line reason, and tell you in one line. They stop to ask only when two or more options are genuinely equivalent, or when a fact only you have is missing. Questions are short, plain and functional, with trade-offs as a comparison table (`light-approval-summary` skill).
