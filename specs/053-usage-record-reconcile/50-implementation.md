---
step: 50-implementation
runs:
  - agent: light-developer
    part: header reconciliation, attribution, skill reads, tests and docs
    model: deepseek-flash[1m]
    thinking: unknown
    level: medium
usage:
  tokens: 8,992 input · 4,461,568 cache read · 0 cache write · 30,068 output · 4,500,628 total
  time: 4m 43s
---

# Implementation

## Task 1 — Shared `runs:` parser

- `kit/hooks/lib/runs.mjs` (new): `headerOf` and `runsOf` return one object per `runs:` entry
  (`agent`, `part`, `model`, `thinking`, `level`, raw `block`), stopping at the `usage:` block so a
  conclusion's `- step:` rows are not runs.
- `kit/hooks/checks/artifact-header.mjs` now uses it; behavior unchanged.
- Verified: `node --test tests/hooks.test.mjs` — 76 pass.

## Task 2 — `reconcileAgents`

- `kit/hooks/lib/usage-stats.mjs`: raises each agent's count to the number of `runs:` entries the
  request's artifacts credit. Counts never fall, so a call or manual record already counted is left
  alone; a malformed row is repaired before use (R-002). Version and JSON shape unchanged.

## Task 3 — Hook

- `kit/hooks/checks/agent-skill-usage.mjs`:
  - `namedRequest` reads `specs/<slug>` from an `Agent`/`Skill` input and prefers the active request
    named most often; `currentRequest` is only the fallback. This would have put 095's reviewer call
    under 095, not 083.
  - `skillRead` counts a read of an installed `.{claude,github,copilot,agents}/skills/light-*/SKILL.md`;
    the kit source layout is ignored.
  - `requestOfFile` reconciles the request whose `NN-*.md` artifact was just written, so a role the
    session performed itself is counted from the header it signed.
  - Events are now `post-tool` and `stop`. On stop, every request already tracked or still active in
    each project home is reconciled; untracked finished requests are skipped so old history is not
    invented (R-006). Project homes are deduped by real path (R-007).
  - The off switch still comes from `run.mjs`; no new writer bypasses it (R-010).

## Task 4 — Tests

- `tests/agent-skill-usage.test.mjs`: 10 new tests — header-only count, no double count with a tool
  call, no double count with a manual record, two header runs, prompt attribution against a more
  recently touched request, installed skill read, kit source ignored, headerless artifact writes
  nothing, stop reconciliation of tracked/active but not finished, and stop under the off switch.
- Each fixture can produce the forbidden state: e.g. the attribution test would land on `001-x`
  under the old fallback (R-009).
- Verified: `node --test tests/agent-skill-usage.test.mjs tests/record-usage.test.mjs` — 32 pass.

## Task 5 — Docs

- `kit/hooks/README.md`: hook row and reference paragraph now describe header reconciliation, prompt
  attribution, skill reads and stop reconciliation; the manual command covers only uses with no other
  record.
- `kit/instructions/core.md`: same rule in the installed instructions.

## Task 6 — Reported row repaired

- Ran the new reconciliation over `ai-it-team/specs/095-…`. It added 3 uses the state was missing:
  `light-developer: 1` and two more `light-orchestrator` runs (1 → 3, matching the three artifacts
  that credit it).
- Committed in ai-it-team as `c5cddaf6 chore(spec): record the runs request 095 headers credit`.
- The installed user-level hook in `~/.light-kit` is not updated by this repo change; it picks the
  behavior up after the next kit install (`npm run install-kit -- ~` or the same install the user ran).

## Deviations

- The stop loop filters on `understood` (a `10-understanding.md`) rather than `requested`
  (`00-request.md`). Reason: the hook's own working-request rule treats an understood folder as a
  request, and old folders can miss `00-request.md`; requiring it skipped tracked requests.
- No discovery/design of a separate backfill script: reconciliation is the backfill, and it is limited
  to tracked or active requests by design.

## Verification

- `node --test tests/agent-skill-usage.test.mjs tests/record-usage.test.mjs` — 32 pass.
- `node --test tests/hooks.test.mjs tests/kit.test.mjs` — 102 pass.
- `npm test` — 253 pass, 0 fail.

## Rules

- R-002, R-004, R-006, R-007, R-009, R-010 applied.
- R-011 added (pending, Count 1) with the 095 report as evidence.
- No confirmed rule was broken.
