---
step: 50-implementation
runs:
  - agent: light-developer
    part: header reconciliation, attribution, skill reads, tests and docs
    model: deepseek-flash[1m]
    thinking: unknown
    level: medium
usage:
  tokens: 21,279 input · 9,346,688 cache read · 0 cache write · 51,594 output · 9,419,561 total
  time: 10m 27s
---

# Implementation log

## Progress

- Task 1 — `0406c89` — `kit/hooks/lib/runs.mjs` (new): `headerOf` and `runsOf` return one object per
  `runs:` entry (`agent`, `part`, `model`, `thinking`, `level`, raw `block`), stopping at `usage:` so
  a conclusion's `- step:` rows are not runs; `artifact-header.mjs` uses it.
- Task 2 — `0406c89` — `usage-stats.mjs`: `reconcileAgents` raises each agent's count to the number of
  header runs, never lowers it, and repairs a malformed row (R-002); JSON version and shape unchanged.
- Task 3 — `0406c89` — `agent-skill-usage.mjs`: prompt-named attribution, installed skill-file reads,
  post-tool header reconciliation, stop reconciliation of tracked/active requests, best-effort writes,
  real-path home dedupe (R-007); the off switch stays in `run.mjs` (R-010).
- Task 4 — `0406c89` — `tests/agent-skill-usage.test.mjs`: 16 new tests for acceptance 1–6.
- Task 5 — `0406c89` — `kit/hooks/README.md`, `kit/instructions/core.md`, `docs/safety-hooks.md`
  describe the new sources and the remaining manual gap.
- Task 6 — `c5cddaf6` (ai-it-team) — reconciled request 095: added `light-developer: 1` and two more
  `light-orchestrator` runs (1 → 3); both state pairs updated.
- Review turn 1 — see `## Review rounds`; findings F-1.1 to F-1.6 and F-1.8 fixed in the fix commit.

## Technical debt

- TD-1 `usage-stats.mjs` / `reconcileAgents` — the floor is per agent, so a call-recorded run that
  leaves no artifact and a header-recorded run of the same agent collapse to one count — exact
  matching needs a per-run identity that neither the tool call nor the header carries — status: open,
  follow-up when a consumer needs exact counts; documented in `kit/hooks/README.md` and
  `docs/safety-hooks.md`.
- TD-2 `~/.light-kit` — the installed user-level hook stays on the old behavior until the kit is
  reinstalled (`npm run install-kit -- ~`); the repository's own hook and tests already run the new
  code — status: deferred (install step, outside the repository).
- TD-3 `docs/safety-hooks.md` — the agent/skill paragraph still described the pre-change behavior —
  status: resolved (review F-1.1, fix commit).
- TD-4 `agent-skill-usage.mjs` — a failed write in one project home could abort the stop loop and
  surface as a hook error — status: resolved (review F-1.8, fix commit).

## Decisions and deviations

- The stop loop accepts a tracked request even without `10-understanding.md`, and an untracked one
  only when it is active by the hook's own predicate (`understood`, not `done`, has `status.md`).
  Reason: a tracked request must not lose a run because an artifact was removed; an inactive leftover
  must not gain a row (R-006).
- Attribution prefers the most frequently named active request; a project that contains the working
  folder wins a tie, then the first root (scope), so two workspace projects sharing a slug cannot
  cross-write.
- No separate backfill script: reconciliation is the backfill and is limited to tracked or active
  requests.
- F-1.7 declined: the `status.md` filter in `workingRequest` is not new; it is identical in
  `48b1c16:kit/hooks/checks/agent-skill-usage.mjs`, so the fallback behavior did not change.

## Verification

- `node --test tests/agent-skill-usage.test.mjs tests/record-usage.test.mjs` — 38 pass.
- `node --test tests/hooks.test.mjs tests/kit.test.mjs` — 102 pass.
- `npm test` — 253 pass, 0 fail before the review fixes; rerun after them is in the conclusion.

## Review rounds

Round 1 of 1:

- F-1.1 [should-fix] `docs/safety-hooks.md:14` — stale pre-change paragraph, no header/attribution/stop
  text, backfill attribution conflated with the hook — rewrote the paragraph to match
  `kit/hooks/README.md` and split the backfill sentence — status: fixed.
- F-1.2 [should-fix] `agent-skill-usage.mjs` stop gate — `understood` ran before `tracked`, so a
  tracked request without understanding was skipped while a statusless untracked folder gained a row —
  tracked first, active reuses the working predicate — status: fixed.
- F-1.3 [should-fix] `namedRequest` keyed only by slug — same slug in two workspace projects collided,
  the later root won — score by name count plus containment of the working folder, first root on a
  tie — status: fixed.
- F-1.4 [should-fix] per-agent floor can undercount a call-run without an artifact plus a header run of
  the same agent — documented as TD-1 in the README and `docs/safety-hooks.md`; an exact fix needs a
  per-run identity — status: deferred (TD-1).
- F-1.5 [should-fix] `50-implementation.md` lacked the template sections — added Progress, Technical
  debt, Decisions and deviations, Verification, Review rounds — status: fixed.
- F-1.6 [should-fix] missing coverage for nested project homes, a statusless untracked folder,
  two-spec naming, a named done request, a shared slug, and a tracked request without understanding —
  six tests added, each able to fail (R-009) — status: fixed.
- F-1.7 [nit] fallback behavior changed — declined: the base hook already filtered on `status.md`
  (`git show 48b1c16:kit/hooks/checks/agent-skill-usage.mjs`), so no change was made.
- F-1.8 [nit] unguarded multi-home writes and an inaccurate "parsing stops" comment — each home and
  each post-tool write is wrapped, and the comment now says the header is parsed from one read; the
  docs note that the first stop may reconcile several requests — status: fixed.

Verdict: changes requested → every should-fix addressed; F-1.4 deferred as documented debt and F-1.7
declined with evidence.
