---
runs:
  - step: discover
    agent: light-orchestrator
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
---

# Discovery

## Where usage is read and shown
- `kit/hooks/lib/usage.mjs:18-52` — `usageFromTranscript` returns `{ input, output, cacheRead, cacheWrite, calls, timeMs, timeKnown }`. It reads `cache_read_input_tokens` and `cache_creation_input_tokens` (42-43) but adds both to `input` (44); `cacheRead`/`cacheWrite` are returned and never consumed.
- `kit/hooks/lib/usage.mjs:54-62` — `deltaUsage` carries only `input`, `output`, `timeMs`, `timeKnown`; cache fields are dropped.
- `kit/hooks/lib/usage.mjs:64` — `totalUsage` is `input + output`.
- `kit/hooks/lib/usage.mjs:70-71` — `formatUsage` prints three figures.
- `kit/hooks/checks/token-usage.mjs:16` — `ZERO = { input, output, timeMs }`; sessions and steps store only these.
- `kit/hooks/checks/token-usage.mjs:59` — step rows are `| step | input | output | total | time |`.
- `kit/hooks/checks/token-usage.mjs:100-124` — request totals, suggestion line and total row; `step === '60-conclusion'` picks the table wording (010).
- `kit/hooks/checks/token-usage.mjs:14` — `STATE_VERSION = 2`; `readState` (37-42) discards a file with another version; `saveState` writes the constant.

## Templates and docs
- `kit/templates/60-conclusion.md:16-20` — 5-column table (`Step | Input | Output | Total | Time`) and total row.
- `kit/templates/{00-request,10-understanding,20-discovery,30-design,40-plan,50-implementation}.md` — `## Token usage` with `Tokens: unknown` / `Time: unknown`.
- `docs/usage.md:36` — describes the labelled line; `docs/usage.md:38` — says input counts fresh, cache-write and cache-read prompt tokens; `docs/usage.md:47` — best-effort notes.
- `kit/hooks/README.md:28` — says the figures are cumulative processed tokens and mentions cache reads only implicitly.
- `kit/instructions/core.md:22` — the artifact rule naming `Tokens:` and `Time:`.

## Tests
- `tests/usage.test.mjs:14-23` — reader sums cached tokens into input (`input: 20`, `totalUsage 25`) and `formatUsage` text.
- `tests/usage.test.mjs:63-70` — `deltaUsage` shape.
- `tests/hooks.test.mjs:416-417` — `usageEntry` builds only `input_tokens`/`output_tokens`; `usageArtifact` writes the section.
- `tests/hooks.test.mjs:419-441` — step delta and state shape; `:539-553` — conclusion table fill rule.

## Other consumers
No other code reads `.light-kit/usage.json` or `totalUsage`: `grep` over `kit/`, `tests/` and `docs/` finds only the files above. The state file is local and disposable (documented in `kit/hooks/README.md:28`), so a version bump costs only in-flight request totals.

## Transcript evidence
Current session transcript `2574ec1b-…jsonl`: 68 deduplicated messages, 66,918 fresh input, 4,522,368 cache read, 0 cache write, 40,976 output. The client's `/usage` for the same session: 63.2k input, 4.4m cache read, 36.7k output. The kit reports about 4.0M input, i.e. fresh input plus cache read.

## Constraints found
- The `filled()` checks (`kit/hooks/checks/token-usage.mjs:30-36`) only look for a digit after `Tokens:` and a `Time:` value (or a row's last cell), so a longer `Tokens:` line needs no parser change.
- A cache-hit percentage would need a denominator choice (input, or prompt tokens including cache); leaving it out avoids inventing a figure the client does not print for the whole session.

## Token usage
Tokens: 210,971 input · 1,237 output · 212,208 total
Time: 10s
