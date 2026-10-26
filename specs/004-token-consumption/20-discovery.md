---
runs:
  - step: discover | agent: light-orchestrator | model: deepseek-flash[1m] | thinking: unknown | level: easy
---

# Discovery

## Relevant code
- `kit/hooks/lib/effort.mjs` — the template for a fail-soft client-state reader; `detectEffort(ctx)` picks a source per client.
- `kit/hooks/checks/session-context.mjs` — reports what the client exposes at session start; the place that already tells agents about provenance values.
- `kit/hooks/checks/artifact-header.mjs` — matches spec artifacts on a post-write event and warns with a message; the model for `token-usage`.
- `kit/hooks/checks/index.mjs`, `kit/hooks/lib/config.mjs`, `kit/hooks/hooks.config.json` — a check is registered here and gets a default mode.
- `kit/templates/*.md` — every artifact's shape, including `60-conclusion.md`.
- `kit/instructions/core.md` — rule 12 defines the `runs:` header.
- `tests/effort.test.mjs` — unit-test style; `tests/hooks.test.mjs` installs into a temp dir and spawns `run.mjs` with client payloads.
- `tests/kit.test.mjs` — asserts installed templates and generated client files.

## Existing conventions
- Hooks are plain ESM with no dependencies, Node 18+, and fail open: `run.mjs` catches each check's errors.
- A check returns `{ message }` or `null`; messages reach the agent through each client's response.
- Generated state the hooks own is written under `.light-kit/` (`audit-log` uses `.light-kit/audit.log`).
- Templates are terse; explanatory detail goes in `docs/` and `kit/hooks/README.md`.

## Constraints
- Claude Code transcript entries of type `assistant` carry `message.usage`: `input_tokens`, `cache_creation_input_tokens`, `cache_read_input_tokens`, `output_tokens`.
- The hook runs after a write, so the artifact is already on disk; it must not edit it.
- Repeated writes to the same artifact must not nag: once the section has a numeric value, the hook stays silent but keeps the state accurate.
- Per-session deltas need a baseline; it is local state, not project knowledge.
- Copilot, Cursor and Codex expose no readable usage source in the kit's current sources; they stay `unknown`.

## Reuse candidates
- `usageFromTranscript` mirrors `effortFromTranscript`: same file, same fail-soft split.
- The artifact path regex in `artifact-header.mjs` can be reused for the trigger.

## Unknowns / risks
- Claude Code may write subagent usage to separate transcripts; those tokens are then not counted. Documented as a limit.
- Transcript compaction could reset cumulative counters; a negative delta is clamped to zero and the baseline resets.
- Tokens spent before the first artifact write in a session (the request step) are assigned to the first artifact written, which is the request step's artifact in normal flow.
