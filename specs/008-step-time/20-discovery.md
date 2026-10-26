---
runs:
  - step: discover
    agent: light-tech-lead
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
---

# Discovery

## Relevant code
- `kit/hooks/lib/usage.mjs` — `usageFromTranscript` sums `message.usage` per assistant entry; `deltaUsage` and `formatUsage` are pure helpers. Extend here.
- `kit/hooks/checks/token-usage.mjs` — reads the transcript, keeps baselines per session and totals per request/step in `.light-kit/usage.json`, and prints the fill instructions. Time follows the same path.
- `kit/templates/*.md` — six step templates end with `Tokens: unknown`; `60-conclusion.md` has the 4-column table.
- `tests/usage.test.mjs` — reader, formatter and delta; `tests/hooks.test.mjs` — hook scenarios; `tests/kit.test.mjs` — installed template assertions.
- `docs/usage.md`, `kit/hooks/README.md`, `docs/safety-hooks.md`, `kit/instructions/core.md` — describe tokens today.

## Conventions
- Best-effort readers never throw: missing or unreadable files yield zeros.
- State snapshots per session and totals per step are plain objects; a new field must tolerate state written by the previous version.
- Hook output is a single plain-text note; the agent fills the artifact because hooks cannot edit files.

## Constraints
- Only Claude Code exposes a transcript here; other clients keep `unknown`.
- Transcript entries carry `timestamp` (ISO 8601). Separate subagent transcripts remain out of reach.
- No new dependency; Node built-ins only.

## Reuse candidates
- `deltaUsage` already clamps resets; add the time delta there instead of a second helper.
- `formatUsage` pattern for a small `formatDuration`.

## Unknowns / risks
- Idle gaps are indistinguishable from long tool runs. Default: ignore gaps over 15 minutes and document the heuristic.
- Old state files lack `timeMs` and `timed`; treat missing values as unknown, never as zero-time.

## Token usage
Tokens: 232696/762 (total 233458)
Time: unknown (installed hook does not report time yet)
