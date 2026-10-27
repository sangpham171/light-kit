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

Every artifact starts with a header recording which step it belongs to and which agent produced it, with what, so you can see how a result came about:
```
---
step: plan
runs:
  - agent: light-tech-lead
    model: <model id>
    thinking: <reasoning setting or unknown>
    level: hard
---
```
Each agent run adds one entry (parallel or retried runs add their own). Agents write only what they know, `unknown` otherwise. The `session-context` hook reports the model and the thinking effort from the client's own state where one exists, because an agent does not reliably know either: Claude Code (session transcript), GitHub Copilot (the session's own record: the agent-host event log at `~/.copilot/session-state/<id>/events.jsonl`, or `COPILOT_HOME` when set, then the VS Code chat session log, then the chat model configuration in `state.vscdb`), Cursor (the chat model configuration in `state.vscdb`) and Codex (`~/.codex/config.toml`). The model comes from the hook payload when the client sends it, otherwise from the Copilot session record (`selectedModel` in the event log, then `identifier` of the selected model in the chat session log) or the Claude Code transcript (`message.model`). Reading the Copilot session record matters because `state.vscdb` holds only per-model overrides: when the model keeps its default effort, that key is empty and the session record is the only place with the value in effect. A fresh Claude Code session has no assistant turn in its transcript yet, so it falls back to the newest transcript of the same project. The model and the effort are reported even when only the user-level kit is installed and the project never ran `light-init`. Otherwise they stay `unknown`. It covers the files in `specs/<NNN-slug>/` except `status.md`, plus the codebase map, assessment, backlog and audit reports. An `artifact-header` hook warns when a header is missing or incomplete.

Each artifact also records its usage in the same header: a `usage:` block holding a `tokens:` value labelling uncached input, cache read, cache write, output and total with thousands grouped (`63,200 input · 4,400,000 cache read · 1,100 cache write · 36,700 output · 4,501,000 total`) and a `time:` value with the time spent as a duration (`45s`, `2m 5s`). The step templates show that labelled shape as a placeholder. `60-conclusion.md` covers every step, so its `usage:` is a list with one `- step:` row per step plus a `total` row. After an artifact is written, the `token-usage` hook reads the client's session record (the Claude Code transcript, or the Copilot session record in VS Code: the agent host's event log, else the chat panel's log), reports the delta since the previous artifact (this write, the step total and the request total) and keeps the request totals in `.light-kit/usage.json` (under a user-level install in a project without `.light-kit/`, in `~/.light-kit/state/`, one file per project, so reporting does not look like `light-init` ran); the agent then fills the block (or the rows, in the conclusion). It works whether or not the project ran `light-init`, because a file under `specs/` is what matters. Usage and time spent in a session before the request's first artifact are assigned to that artifact.

For Claude Code, the token figures are cumulative processed tokens, not a context size: input counts uncached prompt tokens only; cache reads (`cache_read_input_tokens`) and cache writes (`cache_creation_input_tokens`) are reported on their own and added to the total with input and output. Each response is counted once per message id (Claude Code repeats a turn's usage on one entry per content block, and the reader deduplicates by `message.id`). Every turn re-reads the prompt, so a long session reports millions of cache reads while `/context` shows only the current window (for example 100k of a 786k window); the last turn's prompt is the comparable figure. Time comes from the transcript's entry timestamps: the gaps between consecutive entries, with a gap over 15 minutes treated as idle, so tool runs count and time away does not.

For Copilot, the `sessionId` the hook payload provides selects one of two records. Agent sessions (VS Code's agent host and the CLI) write `$COPILOT_HOME` (default `~/.copilot`)/`session-state/<sessionId>/events.jsonl`: each `session.usage_record` event carries that model call's `inputTokens`, `outputTokens`, `cacheReadTokens` and `cacheWriteTokens`, summed per call; there `inputTokens` is the whole prompt with the cache figures folded in, so they are subtracted from it and `input` stays the uncached prompt, as for Claude Code (a record reporting fewer tokens than its own cache figures yields 0), and time comes from the gaps between the log's event timestamps, with a gap over 15 minutes treated as idle like Claude Code, plus the time since the last event while a call is still running. The chat panel writes `User/workspaceStorage/<ws>/chatSessions/<sessionId>.jsonl` in the default `User/` or a named profile's `User/profiles/<profile>/`: there each request carries `promptTokens` (the latest model call of that request, not a sum over its tool rounds) and `completionTokens`, cache reads and writes are not exposed and stay 0, and the time is `result.timings.totalElapsed` once the request ends, or the elapsed time since it started while it runs, capped at 15 minutes. The event log is read first, because it is the record of the session in use and the only one with cache figures.

| Client | What it stores locally | What the kit reads |
|---|---|---|
| Claude Code | one `message.usage` per assistant entry in `~/.claude/projects/<project>/<session>.jsonl`, repeated per content block; ISO timestamps | tokens, deduplicated by message id, with cache reads and writes separate, and active time |
| Codex | `token_count` events in `~/.codex/sessions/**/rollout-*.jsonl`: cumulative and last usage, plus `model_context_window` | nothing yet; `unknown` |
| Copilot agent sessions (VS Code agent host, CLI) | one `session.usage_record` per model call with `inputTokens` (cache included), `outputTokens`, `cacheReadTokens`, `cacheWriteTokens` and an ISO timestamp on every event in `$COPILOT_HOME` (default `~/.copilot`)/`session-state/<sessionId>/events.jsonl` | cache reads and writes taken out of `inputTokens` so `input` is the uncached prompt, summed over the calls, plus active time |
| Copilot chat panel in VS Code | `promptTokens` / `completionTokens` per request and `result.timings.totalElapsed` in `User/workspaceStorage/<ws>/chatSessions/<sessionId>.jsonl` or `User/profiles/<profile>/workspaceStorage/<ws>/chatSessions/<sessionId>.jsonl` | `promptTokens` as input, `completionTokens` as output, elapsed time; cache reads and writes 0 |
| Cursor | VS Code-style `state.vscdb`; token fields unverified | nothing; `unknown` |

The count is best-effort: usage written to a separate subagent transcript is not seen, the last edit to an artifact is not included, and the overall time adds the steps that expose it. A `0` cache read is what the client recorded, not a fault in the kit: a BYOK provider reached over an OpenAI-compatible endpoint can report `cacheReadTokens: 0` on every call, even when the model caches the prompt, because the provider never returns the cached-token detail Copilot stores (compare with a Copilot-hosted model in the same client, which does report cache reads). A state file written by an older counting version (responses counted twice, or input folding in cache reads) is restarted on first run, while totals already written in `specs/` keep their numbers.

## Agents
light-orchestrator, light-product-owner, light-business-analyst, light-ux-designer, light-architect, light-tech-lead, light-developer, light-tester, light-reviewer, light-security-reviewer, light-tech-writer. Any agent or command can be invoked manually.

## Names
Everything your AI client lists is prefixed `light-`, so it never clashes with other frameworks: agents (`light-developer`), skills (`light-commit`), commands (`/light-init`, `/light-request`, `/light-bootstrap`, `/light-standardize`, `/light-triage`, `/light-plan`, `/light-implement`, `/light-review`, `/light-status`, `/light-audit`) and Cursor rules. The kit's own folder is `.light-kit`, and its hooks and workflows live inside it. Your project's request folders stay `specs/`. When you upgrade, the installer removes the obsolete generated files of the earlier names (only files carrying the light-kit marker; your own files are never touched).

## Decisions
The agents decide and move on: they pick the best option, record it with a one-line reason, and tell you in one line. They stop to ask only when two or more options are genuinely equivalent, or when a fact only you have is missing. Questions are short, plain and functional, with trade-offs as a comparison table (`light-approval-summary` skill).
