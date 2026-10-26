---
runs:
  - step: plan
    agent: light-orchestrator
    model: deepseek-flash[1m]
    thinking: high
    level: easy
---

# Plan

## T1 — Effort detection library
Files: `kit/hooks/lib/effort.mjs`, `tests/effort.test.mjs`.
- Export `effortFromTranscript(file)`, `effortFromCodex(home)`, `effortFromVscode(home, { model, platform, query })`, `detectEffort(ctx, opts)`.
- Claude Code: scan the transcript backwards for an `assistant` entry with `effort`, else `params.output_config.effort`.
- Copilot: query each existing VS Code `state.vscdb` for the model configuration; pick the entry matching `ctx.model` (exact, then suffix), else the first with `reasoningEffort`.
- Cursor: same reader, Cursor's state path only.
- Codex: `model_reasoning_effort` from `~/.codex/config.toml` (honour `CODEX_HOME`).
- All readers return `''` on any failure; no writes, no network.

Acceptance: `node --test tests/effort.test.mjs` passes for transcript, VS Code (injected query), Codex, model preference, and the empty case.

## T2 — Inject into session context
Files: `kit/hooks/checks/session-context.mjs`, `tests/hooks.test.mjs`.
- Call `detectEffort(ctx)`; when a value is returned, append one line: `The client reports thinking effort "<value>"; use it as thinking in the runs: headers.`
- No line when the value is empty; failures stay silent.

Acceptance: `npm test` passes; an installed kit with a transcript fixture injects the line for Claude Code; no-transcript sessions are unchanged.

## T3 — Align rules and docs
Files: `kit/instructions/core.md`, `kit/hooks/README.md`, `docs/usage.md`.
- Core rule 12: record the reasoning setting when the client or the session context reports it.
- Hooks table: say `session-context` also reports the detected thinking effort.
- Usage doc: state which clients expose it and that others stay `unknown`.

Acceptance: wording consistent, no claim that Cursor/Copilot CLI can be detected.
