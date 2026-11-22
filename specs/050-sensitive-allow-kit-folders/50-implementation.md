---
step: implementation
runs:
  - agent: light-orchestrator
    part: allow-list change, tests and docs
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 1,531 input · 186,240 cache read · 0 cache write · 2,027 output · 189,798 total
  time: 12s
---

# Implementation log

## Progress
- Task 1 — `dfa4911` fix(hooks): exempt kit-managed folders from the sensitive-file check
- Task 2 — `dfa4911` same commit: the test covers both directions
- Task 3 — `d59e819` chore(config): exempt kit-managed folders in this project
- Task 4 — `9884e7d` docs(kit): note the built-in sensitive-file exemptions
- Task 5 — this commit

## Diagnosis
The allowance is a pure data change: `isSensitive` is `sensitiveFiles` match minus `sensitiveAllow` match, so adding folder globs to the built-in allow list exempts every file under them, and the same globs in the project layer take effect in the already-installed hooks without a refresh.

## Technical debt
- TD-1 The user-level install (`~/.light-kit`) still carries the previous built-in list, so outside this repository the exemption applies only after `node tools/install.mjs ~ --clients <clients>` — status: open — accepted: the project layer makes this repository correct now, and a reinstall writes outside the repository.
- TD-2 The exemption covers any folder named `.claude`, `.copilot`, `.light-kit` or `specs` at any depth, not only the project's own — status: noticed — accepted: those names are reserved by the tooling; a user folder with the same name is still configuration, not credentials.

## Decisions and deviations
- Added the globs to the built-in list rather than repeating them in each generated client: they hold for every install, the same way template names and the detector source are built in.
- Kept `**/kit/hooks/lib/secrets.mjs`: the kit's source tree is not under `.light-kit/`.
- Also added the globs to `.light-kit/hooks.config.json` so the running user-level hooks pick them up immediately — the redundancy disappears at the next install refresh.

## Verification (commands run and results)
- `node --test tests/hooks.test.mjs` — 76 pass, 0 fail.
- `npm test` — 219 pass, 0 fail.
- Installed-hook probe: a read of `specs/050-sensitive-allow-kit-folders/credentials` exits 0, a read of the project-root `credentials` exits 2 with the `protect-sensitive-files` message.

## Rules
- R-001 applied: earlier open debt is untouched by this change and stays open — 049 TD-1/TD-2, 042 TD-1/TD-2, 004/006, 027, 036, 038, 039/040, 041, 046, 047, 048.
- R-004 applied: `.light-kit/usage.json`, `.light-kit/agent-skill-usage.json`/`.md` and the request's `tool-log.md` are committed with the conclusion.
- R-008 applied: `status.md` starts with the frontmatter delimiter.
- R-002, R-003, R-005, R-006, R-007 — not applicable.
- Rules: no change.

## Review rounds
Review turns for this project: 1.
- Round 1 (self-review against `light-review-checklist`): no finding. Requirements 1–4 are met; the root name stays blocked while the four folders pass; `protect-paths` still blocks client settings files, so the exemption does not open them to edits; docs and tests match the change.
Verdict: approve
