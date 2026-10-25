---
runs:
  - step: request | agent: light-orchestrator | model: deepseek-flash[1m] | thinking: unknown | level: easy
---

# Request 003 — Uninstall tool with soft and hard modes

Date: 2026-10-25
Requested by: user

## Original request
> add uninstall tools with 2 options soft and hard. default is soft

## Context
- The kit installs with `tools/install.mjs`; there is no reverse operation.
- An install writes three kinds of files: managed generated files (light-kit marker), seeds holding user knowledge, and merged blocks/registrations inside files the user also owns (instruction files, client hook settings).
- Soft must be safe by default; hard may delete the kit's own folders, including request artifacts.
- Hard deletion must never touch files the kit does not own.
