---
step: implement
runs:
  - agent: light-orchestrator
    model: deepseek-flash
    thinking: unknown
    level: easy
usage:
  tokens: 882 input · 278,272 cache read · 0 cache write · 1,398 output · 280,552 total
  time: 49s
---

# Implementation

## What changed
- `kit/hooks/checks/tool-log.mjs`: new `tool-log` check on `post-tool`. It finds the innermost `specs/` folder (project scope, else root), creates `specs/tool-log.md` with a short header on first use, and appends one Markdown row: ISO time, client, tool name, tool kind, target. Target is the edited files, or the shell command redacted through `redact()` and truncated to 200 characters. Tool output is never stored, and a call that writes the log itself is skipped. Returns `null`, so it prints nothing and never blocks.
- `kit/hooks/checks/index.mjs`: registers the check.
- `kit/hooks/lib/config.mjs`, `kit/hooks/hooks.config.json`: default mode `warn` (on, silent); `hooks.tool-log: "off"` disables it.
- `tests/hooks.test.mjs`: two tests — one row per call with the header and both row types, and redaction / no `specs/` / `off` / self-write skip.
- Docs: `kit/hooks/README.md` (table row plus a paragraph on path, content and mode), `docs/safety-hooks.md`, `specs/README.md`.

## Verification
- `node --test tests/hooks.test.mjs`: 54 passed (was 52; two new tests).
- `npm test`: 158 passed (was 156).
- Generated output: the hooks tests install the kit into a temporary project, so the new check file, registry entry and seeded config mode are proven through `run.mjs` end to end.

## Deviations
None.

## Technical debt
- The log is append-only with no rotation. Rows are small and carry no output; the file is generated and safe to delete, documented in `specs/README.md`. Left as is, since rotation would add state for little gain.
