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

## Output style
Style: concise

## Review cycle
Review turns: 1

## Commit policy
Mode: auto
Branch convention: <type>/<NNN-slug>
Convention: Conventional Commits (type(scope): subject)
