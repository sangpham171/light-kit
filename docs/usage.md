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

Each artifact also ends with a `## Token usage` section: a `Tokens:` line labelling uncached input, cache read, cache write, output and total with thousands grouped (`63,200 input · 4,400,000 cache read · 1,100 cache write · 36,700 output · 4,501,000 total`) and a `Time:` line with the time spent as a duration (`45s`, `2m 5s`). `60-conclusion.md` holds one row per step, with a Time column and the same grouping, plus the overall totals. After an artifact is written, the `token-usage` hook reads the Claude Code session transcript, reports the delta since the previous artifact (this write, the step total and the request total) and keeps the request totals in `.light-kit/usage.json` (under a user-level install in a project without `.light-kit/`, in `~/.light-kit/state/`, one file per project, so reporting does not look like `light-init` ran); the agent then fills the section. It works whether or not the project ran `light-init`, because a file under `specs/` is what matters. Usage and time spent in a session before the request's first artifact are assigned to that artifact.

The token figures are cumulative processed tokens, not a context size: input counts uncached prompt tokens only; cache reads (`cache_read_input_tokens`) and cache writes (`cache_creation_input_tokens`) are reported on their own and added to the total with input and output. Each response is counted once per message id (Claude Code repeats a turn's usage on one entry per content block, and the reader deduplicates by `message.id`). Every turn re-reads the prompt, so a long session reports millions of cache reads while `/context` shows only the current window (for example 100k of a 786k window); the last turn's prompt is the comparable figure. Time comes from the transcript's entry timestamps: the gaps between consecutive entries, with a gap over 15 minutes treated as idle, so tool runs count and time away does not.

| Client | What it stores locally | What the kit reads |
|---|---|---|
| Claude Code | one `message.usage` per assistant entry in `~/.claude/projects/<project>/<session>.jsonl`, repeated per content block; ISO timestamps | tokens, deduplicated by message id, with cache reads and writes separate, and active time |
| Codex | `token_count` events in `~/.codex/sessions/**/rollout-*.jsonl`: cumulative and last usage, plus `model_context_window` | nothing yet; `unknown` |
| Copilot in VS Code | `promptTokens` / `completionTokens` per request in `workspaceStorage/<ws>/chatSessions/*.jsonl` | nothing yet; `unknown` |
| Cursor | VS Code-style `state.vscdb`; token fields unverified | nothing; `unknown` |

The count is best-effort: usage written to a separate subagent transcript is not seen, the last edit to an artifact is not included, and the overall time adds the steps that expose it. A state file written by an older counting version (responses counted twice, or input folding in cache reads) is restarted on first run, while totals already written in `specs/` keep their numbers.

## Agents
light-orchestrator, light-product-owner, light-business-analyst, light-ux-designer, light-architect, light-tech-lead, light-developer, light-tester, light-reviewer, light-security-reviewer, light-tech-writer. Any agent or command can be invoked manually.

## Names
Everything your AI client lists is prefixed `light-`, so it never clashes with other frameworks: agents (`light-developer`), skills (`light-commit`), commands (`/light-init`, `/light-request`, `/light-bootstrap`, `/light-standardize`, `/light-triage`, `/light-plan`, `/light-implement`, `/light-review`, `/light-status`, `/light-audit`) and Cursor rules. The kit's own folder is `.light-kit`, and its hooks and workflows live inside it. Your project's request folders stay `specs/`. When you upgrade, the installer removes the obsolete generated files of the earlier names (only files carrying the light-kit marker; your own files are never touched).

## Decisions
The agents decide and move on: they pick the best option, record it with a one-line reason, and tell you in one line. They stop to ask only when two or more options are genuinely equivalent, or when a fact only you have is missing. Questions are short, plain and functional, with trade-offs as a comparison table (`light-approval-summary` skill).
