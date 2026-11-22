---
step: understand
runs:
  - agent: light-orchestrator
    part: understanding and triage
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 440 input · 109,312 cache read · 0 cache write · 2,044 output · 111,796 total
  time: 9s
---

# Understanding

## Restatement
The agent and skill counts already kept in `.light-kit/agent-skill-usage.json` and `.md` must also
be written into the folder of the request that caused them: `specs/<NNN-slug>/agent-skill-usage.json`
and `specs/<NNN-slug>/agent-skill-usage.md`. The project-level aggregate stays.

## Prior requests
- `042-agent-skill-usage` — created the stats, `usage-stats.mjs` (reader, atomic writer, table
  renderer) and the post-tool check this request extends.
- `048-usage-history` + `tools/backfill-usage.mjs` — import past calls into the aggregate; the same
  import must now populate per-request files.
- `049-usage-record-script` — `record-usage.mjs` writes the aggregate for uses no tool call reports;
  it must write the per-request file too.
- `028-tool-log-per-request` — precedent: generated per-request state lives in the request folder,
  and a call made before a request exists stays in the shared place.

## Assumptions
- A call belongs to one request only (the working request), so the per-request file is that
  request's row rendered alone.
- Per-request files are derived views: the aggregate JSON remains the source of truth, so deleting
  a per-request file loses nothing and the next call recreates it.
- `(no request)` calls never write into `specs/`.

## Open questions (with proposed defaults)
- None.

## Requirements
1. After a count changes in the aggregate, rewrite `specs/<slug>/agent-skill-usage.json` and `.md`
   for the request that call belongs to.
2. The per-request table uses the existing renderer and header wording, limited to that request.
3. `record-usage.mjs` and `tools/backfill-usage.mjs` write the same per-request files through the
   same helper.
4. Best-effort and atomic, like the aggregate: a corrupt per-request file restarts from the
   aggregate's data, never throws, never blocks the call.
5. `(no request)` and mixed project scopes keep the current behaviour: aggregate only, or the
   own project's request folder.
6. Config `off` disables the whole mechanism, per-request files included.

## Acceptance criteria
- An `Agent` call in request `001-x` writes `.light-kit/agent-skill-usage.{json,md}` and
  `specs/001-x/agent-skill-usage.{json,md}`; the latter holds only the `001-x` row plus the total.
- A second call for another request does not change `specs/001-x/agent-skill-usage.*`.
- `(no request)` writes no file under `specs/`.
- `record-usage.mjs --request 001-x` updates `specs/001-x/agent-skill-usage.*`.
- `backfill-usage.mjs` creates per-request files for every request it imported calls for.
- A corrupt per-request file is repaired from the aggregate or restarted, with exit status 0.
- `npm test` passes.

## In scope / Out of scope
- In: the hook check, `usage-stats.mjs` helper, `record-usage.mjs`, `backfill-usage.mjs`, tests,
  hook docs.
- Out: moving the aggregate out of `.light-kit/`, per-request files for `(no request)`, a new table
  format, UI.

## Triage
Scores: scope 1, ambiguity 0, risk 0, novelty 0, impact 1 (total 2)
Workflow: direct
Why: one additive output following the existing stats library and the per-request tool-log precedent.

## Routing
- understand: easy — one-line additive request, no ambiguity.
- plan: easy — known files, one helper.
- implement: medium — four call sites plus writes that must never fail.
- review: medium — attribution and write correctness.
- fix: easy — localized corrections.
- conclude: easy — short summary.

## Agent plan
- understand: light-orchestrator — baseline.
- plan: light-orchestrator — one component on a known pattern; the tech-lead step adds nothing.
- implement: light-orchestrator — code written in the main session; one helper and four small call sites.
- review: light-reviewer — independent read of the diff.
- fix: light-orchestrator — apply findings.
- rules, conclude: light-orchestrator — baseline.
