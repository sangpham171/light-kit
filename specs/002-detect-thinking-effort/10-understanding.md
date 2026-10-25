---
runs:
  - step: understand | agent: light-orchestrator | model: deepseek-flash[1m] | thinking: high | level: easy
---

# Understanding

## Restatement
The kit's `session-context` hook detects the client's thinking-effort setting where a client exposes it, and injects it into the session context so agents write the real value in the `runs:` headers instead of `unknown`.

## Assumptions
- The values found on this machine (transcript field, VS Code state key, Codex config key) are the current client formats and may change; every reader must fail soft and fall back to `unknown`.
- Detection is best-effort and silent: no warnings when a source is missing.
- Cursor and Copilot CLI have no readable source, so they stay `unknown`.

## Open questions (with proposed defaults)
None blocking. Defaults: model-specific entry chosen by exact id, then suffix match, then the first entry that has an effort; `sqlite3` binary for the VS Code state DB, `unknown` if absent.

## Requirements
1. `kit/hooks/lib/effort.mjs` exposes `detectEffort(ctx)` plus per-source helpers.
2. Sources: Claude Code transcript, VS Code state DB (Copilot, Cursor), Codex config.
3. No network, no write; readers wrapped so a failure never breaks a hook.
4. `session-context` appends one line with the detected effort, only when found.
5. Source of truth elsewhere stays `unknown`.
6. Tests cover each source and the fallback.

## Acceptance criteria
- A Claude Code session-start with a transcript carrying `effort: high` injects `thinking effort: high`.
- Copilot/Cursor/Codex sources read their documented locations and are unit-tested through injectable readers.
- Missing sources produce no line and no error; `npm test` passes.
- `runs:` header wording in the rules and docs matches the new behavior.

## In scope / Out of scope
In: `kit/hooks/lib/effort.mjs`, `kit/hooks/checks/session-context.mjs`, `kit/hooks/README.md`, `kit/instructions/core.md`, `docs/usage.md`, tests.
Out: changing what clients store, reading anything beyond the effort value, Cursor/Copilot CLI sources not found.

## Triage
Scores: scope 1, ambiguity 1, risk 1, novelty 2, impact 1 (total 6)
Workflow: standard
Why: one component (hooks) with client-internal formats and new tests; no data, security or public API change.

## Routing
- understand: easy — known scope, no open questions.
- discover: easy — sources already found; confirm file formats in the repo.
- plan: easy — three small tasks.
- implement: medium — new module, edge cases, tests across clients.
- verify-and-review: medium — reviewer checks fail-soft behavior and test coverage.
- conclude: easy — short summary.
