---
runs:
  - step: discover | agent: light-orchestrator | model: deepseek-flash[1m] | thinking: high | level: easy
---

# Discovery

## Where the code goes
- `kit/hooks/run.mjs` — single entry point; normalizes the payload, runs checks, emits each client's format.
- `kit/hooks/lib/normalize.mjs` — builds `ctx`; keeps the raw payload as `ctx.payload` (so `transcript_path` is reachable) and sets `ctx.model` from `p.model_id`/`p.model`. It does not copy other session metadata.
- `kit/hooks/checks/session-context.mjs` — runs on `session-start`, returns `{ message }`; `run.mjs` prints session-context messages without the `light-kit warning` prefix.
- `kit/hooks/checks/index.mjs` — check registry (no new check needed; extend session-context).
- `kit/hooks/lib/*.mjs` — plain ESM, no dependencies; Node 18+ is the floor (installer note).
- `kit/hooks/README.md` — hook table, `session-context` row at line 20.

## Existing conventions
- Hooks fail open: `run.mjs` wraps each check in try/catch and ignores errors.
- No third-party dependencies anywhere (`package.json` has no deps).
- Tests: `tests/hooks.test.mjs` installs the kit into a temp dir (`project()`), then spawns `run.mjs` with a JSON payload; allows env overrides. Unit-level tests import source modules directly (e.g. `tests/audit.test.mjs`).

## Sources verified on this machine
- Claude Code transcript: `/Users/light/.claude/projects/-Users-light-Documents-code-light-kit/<session>.jsonl`; assistant entries carry top-level `effort`, `api-request` entries carry `params.output_config.effort`.
- Copilot in VS Code: `~/Library/Application Support/Code/User/globalStorage/state.vscdb`, key `chat.modelConfiguration.panel` → `{"deepseek/deepseek-v4-flash":{"reasoningEffort":"high"}}`; schema enum `none|low|high|max`.
- Codex: `~/.codex/config.toml` → `model_reasoning_effort = "high"`.
- Cursor and Copilot CLI: no effort key found.

## Constraints
- The VS Code state DB is SQLite; the kit has no dependencies and must stay Node 18-compatible, so query it with `sqlite3` via `child_process` and fall back to nothing when unavailable.
- Storage paths are OS-specific and client-internal; all readers must be wrapped.
- Do not read anything from these files except the effort value.
