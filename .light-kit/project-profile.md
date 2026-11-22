# Project profile

## Languages and frameworks
- JavaScript (ES modules), Node.js 18+; no application framework.

## Commands (build / test / lint / run)
- Test (includes kit lint): `npm test`
- Install generated client files: `npm run install-kit -- <target-dir>`
- No separate format or lint command is configured.

## Conventions (structure, naming, style, commit and branch rules)
- Keep kit source under `kit/`, generators under `tools/`, tests under `tests/`, and documentation under `docs/`.
- Use Node's built-in test runner and `.test.mjs` test files.
- Use two-space indentation and ES module imports/exports.
- Commit policy: auto at verified checkpoints; Conventional Commits (`type(scope): subject`).
- Branch convention: `<type>/<NNN-slug>`; never work directly on protected branches or push.

## Constraints (compliance, performance, hosting, team rules)
- Keep changes dependency-free unless the request requires otherwise.
- Preserve the shared safety hooks and generated-client behavior.

## Testing policy
- Run the focused Node test file for a local change, then `npm test` when practical.

## Version bumps (this repository only)
- Each request declares `version_bump: patch | minor | major` in `specs/<NNN-slug>/status.md`; missing or invalid means `patch`.
- `patch`: fix, docs, chore or refactor with no new capability. `minor`: new capability, backward compatible. `major`: breaking change to generated files, CLI, hook behaviour or config format.
- `tools/version-bump.mjs` (Stop hook, registered only in this repository) applies the bump when a request reaches `state: done`, records it in `.light-kit/version-bump.json`, and commits `package.json` plus that state file as `chore(release): vX.Y.Z` unless the branch is protected. It is not part of the shared kit.
- Requests 001–051 are the baseline at version `0.1.0`; only requests from 052 bump.

## Rules
Promotion threshold: 3   <!-- violations that promote a `pending` rule to `confirmed`; integer >= 1. Default 3. -->

## Output style
Style: concise

## Review cycle
Review turns: 1

## Commit policy
Mode: auto
Branch convention: <type>/<NNN-slug>
Convention: Conventional Commits (type(scope): subject)
