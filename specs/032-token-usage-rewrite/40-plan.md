---
step: plan
runs:
  - agent: light-tech-lead
    part: task list and verification strategy
    model: deepseek-flash
    thinking: unknown
    level: easy
usage:
  tokens: 3,560 input · 330,496 cache read · 0 cache write · 2,108 output · 336,164 total
  time: 21s
---

# Plan

- [x] 1. Rewrite the step artifact header: after `saveState`, locate the header `usage:` entry (from the `usage:` line up to the next unindented header key or the closing `---`), replace it with the canonical `  tokens: …` / `  time: …` block, skip the write when the text is unchanged, and return `null` on success; keep the current message as fallback for a missing `usage:` entry, an unfilled legacy `## Token usage` section, or a write error, and leave `60-conclusion.md` on today's message path for now. Update the step-artifact tests to assert the written file and empty output. — level: medium — files: kit/hooks/checks/token-usage.mjs, tests/hooks.test.mjs — verify: `node --test --test-name-pattern='token-usage' tests/hooks.test.mjs` and read a written artifact — commit: `feat(hooks): rewrite the step usage in the artifact header`
- [ ] 2. Rewrite the conclusion list: for `60-conclusion.md`, replace the header `usage:` list with one sorted `- step:` row per recorded step (including the conclusion itself) plus the `total` row, preserving the header's other entries and the body; return `null` on success and use the same fallbacks. Update the conclusion tests to assert the list on disk. — level: medium — files: kit/hooks/checks/token-usage.mjs, tests/hooks.test.mjs — verify: `node --test --test-name-pattern='token-usage' tests/hooks.test.mjs` and read a rewritten conclusion — commit: `feat(hooks): rewrite the conclusion usage rows`
- [ ] 3. Cover the fallbacks and preservation: add tests for a header with no `usage:` entry (message, file untouched), an unfilled legacy section (message, file untouched), a filled legacy section (silent), a `usage:` entry followed by another header key, byte-for-byte preservation of the rest of the file, an idempotent second run, sorted conclusion rows and the `total` sum, and a write failure (read-only file, skipped as root) falling back to the message. — level: medium — files: tests/hooks.test.mjs (kit/hooks/checks/token-usage.mjs only if a test exposes a defect) — verify: targeted token-usage tests and `npm test` — commit: `test(hooks): cover usage rewrite fallbacks and preservation`
- [ ] 4. Document the new behaviour: the hook writes the header `usage:` itself after saving state, and the message is only a fallback, in the hook table and detail paragraph of `kit/hooks/README.md`, the usage paragraph in `docs/usage.md`, and rule 12 in `kit/instructions/core.md`. — level: easy — files: kit/hooks/README.md, docs/usage.md, kit/instructions/core.md — verify: read the three passages against the implemented behaviour; `npm test` (kit install still finds `token-usage` in CLAUDE.md) — commit: `docs(hooks): the hook fills usage itself`
- [ ] 5. Inspect and commit the remainder: run `git status --short` and `git diff`, record the decisions and any deviation in `50-implementation.md`, update `status.md`, and commit every remaining task change; leave `.light-kit/usage.json` untracked as local hook state and note that in the log. — level: easy — files: specs/032-token-usage-rewrite/50-implementation.md, specs/032-token-usage-rewrite/status.md, specs/032-token-usage-rewrite/tool-log.md — verify: `git status --short` shows no uncommitted task change and `npm test` passes — commit: `docs(specs): log request 032 implementation`

## Risks

- The `usage:` entry is not always the last header key; the region must stop at the next unindented key or the closing `---`, or a following key is swallowed. Cover with a test.
- Today an agent-filled artifact suppresses the message; the new path rewrites it on every write, so hook totals replace whatever the agent wrote. This is intended (state is the source of truth) and must be stated in the docs; an artifact already equal to the totals must produce no write and no message.
- The conclusion rebuilds rows from `state.requests[request].steps`, so a row the agent wrote for a step the hook never recorded is dropped. Accepted: the requirement is one row per recorded step; note it in `50-implementation.md`.
- A failed artifact write must not lose the state update: save state first, then attempt the rewrite, and fall back to the message on `writeFileSync` throwing.
- The rewrite must not touch the trailing legacy `## Token usage` section: keep the existing `filled()` branch for those files and never rewrite them.
- `headerOf` matches `\n` only; CRLF artifacts stay unsupported as today (out of scope).
- Under a user-level install the hook now writes a project artifact while state lives in `~/.light-kit/state/`; this is the same file it already reads, so no new permission assumption.

## Test strategy

- Use the existing integration harness (`project`, `withSpec`, `write`, `run`) and assert the artifact with `readFileSync`, plus `out === ''` when the rewrite succeeds; keep message assertions only for the fallback cases.
- Adapt every token-usage test that currently asserts the suggestion for a header-usage artifact: the step report, thousands grouping, unknown time, template placeholder, both Copilot readers, user level, state-version restart, and the two conclusion tests.
- Add the task 3 cases: missing `usage:` entry, filled and unfilled legacy section, following header key, byte-for-byte body and other header entries, idempotent second run, conclusion sorting/total/own row, and write failure.
- No lint script is configured; the gate is `npm test` after every task, with targeted `--test-name-pattern` runs while iterating.

## Parallelisable tasks

- Tasks 1 and 2 are sequential (task 2 builds on the rewrite seam from task 1).
- Task 4 can run in parallel with task 3 once task 2 lands; they touch disjoint files.
- Task 5 runs last, after 1-4.
