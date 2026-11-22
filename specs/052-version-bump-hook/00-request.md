---
step: request
runs:
  - agent: light-orchestrator
    part: request capture
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 54,744 input · 890,624 cache read · 0 cache write · 27,126 output · 972,494 total
  time: 8m 38s
---

# Request 052 — Per-spec version bump, this project only

Date: 2026-11-22
Requested by: the user

## Original request
> add a hook for only this project to increment package.json version for each specs. hook fired in Stop event

## Conversation context

### Turn 1 — the request
Wanted: a hook, project-scoped, that increments `package.json` once per request (`specs/`), fired on the
client's `Stop` event.

### Turn 2 — how patch/minor/major is chosen
> how can we define patch, minor, major version for each spec ?

Established: the bump level is a property of each spec, not a fixed patch step. A spec declares its
level, and the hook applies it semver-style (patch resets nothing, minor resets patch, major resets
minor and patch).

### Turn 3 — scope
> i don't want to effect the fit. the version bump is only for this project

Read as "do not affect the kit": no file under `kit/` changes, no check added to the shared hooks that
other projects install. The feature lives in the kit repository only, enabled nowhere else.

## Decisions
- The bump level is declared per request as `version_bump: patch|minor|major` in `specs/<NNN-slug>/status.md`
  front matter; missing or invalid means `patch`. Chosen over a separate file (one more artifact) and
  over deriving it from `workflow:` (process size is not semantic impact).
- The bump is applied when the request is finished (`state: done`), not when its folder appears, so
  abandoned or in-progress work never changes the version.
- A request without `version_bump` bumps the patch number; the mapping is recorded in
  `.light-kit/project-profile.md`.
- State (which spec numbers were applied, and at which version) lives in `.light-kit/version-bump.json`.
  Existing requests are seeded at the current `0.1.0` with `baseline: 51`, so the 51 finished requests
  cause no jump; this request (052) is the first bump.
- This request declares `version_bump: minor`: it adds a capability, backward compatible.
- The hook is a standalone `tools/version-bump.mjs`. `tools/` is repo tooling and is not generated into
  client projects, so the shared kit is untouched.
- The hook commits only `package.json` after a bump (`chore(release): vX.Y.Z`), mirroring the existing
  `tool-log` stop behavior; it skips protected branches and can be disabled with `"commit": false` in
  the state file.
- Registration: `.claude/settings.json` gains one `Stop` command. The kit rules forbid the agent to
  edit hook registration files, so the user adds that block (provided in the conclusion); the script
  is complete and tested before then.

## Rejected options
- Add a `version-bump` check to `kit/hooks/`: rejected by the user's scope clarification (it would
  reach every project that installs the kit).
- One patch step per new spec folder regardless of content: rejected because the user asked how
  patch/minor/major are defined per spec.
- Derive the level from `workflow: direct|standard|full`: rejected because a one-line breaking change
  can be a `direct` request.
- A `version.txt` beside each spec: rejected as an extra artifact when `status.md` already exists and
  is parsed by the kit.

## Constraints
- No change under `kit/`.
- Node built-ins only; two-space indent; ES modules.
- Never block the agent: any error exits 0 silently.
- Commit messages carry no trailers or AI attribution.

## Open
- The user registers the Stop hook in `.claude/settings.json`; until then the script runs only manually.
