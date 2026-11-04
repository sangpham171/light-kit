---
step: understand
runs:
  - agent: light-orchestrator
    model: deepseek-flash
    thinking: unknown
    level: easy
usage:
  tokens: 0 input · 0 cache read · 0 cache write · 0 output · 0 total
  time: 0s
---

# Understanding

## Goal
Every tool call the agent makes leaves one row in `specs/tool-log.md`, so a project can read what actually ran.

## Scope
- New hook `tool-log`, event `post-tool`, on by default, silent (writes no message, never blocks).
- File created on first call with a short header and a Markdown table; one row per call.
- Row: ISO time, client, tool name, tool kind, target (edited files, else the redacted command).
- Written only when `specs/` already exists (scope first, then root), and never for a write of the log itself.

## Out of scope
- Splitting the log per request.
- Storing tool output or payloads (other than the truncated, redacted command).
- Replacing the optional `audit-log` hook, which keeps JSON in `.light-kit/`.

## Acceptance criteria
- A `post-tool` call appends one row; a second call appends a second row.
- Without a `specs/` folder nothing is written and the hook outputs nothing.
- Mode `off` stops it; the hook never changes the exit code or prints a warning.
- Kit docs (`kit/hooks/README.md`, `docs/safety-hooks.md`, `specs/README.md`) describe the file.
