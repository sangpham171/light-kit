---
step: request
runs:
  - agent: light-orchestrator
    part: request capture
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 42,273 input · 387,072 cache read · 0 cache write · 7,311 output · 436,656 total
  time: 3m 36s
---

# Request 050 — Kit-managed folders are not sensitive files

Date: 2026-11-22
Requested by: the user

## Original request
> add .claude, .copilot, .light-kit, specs folder to hook sensitive allow list

## Conversation context
| # | User turn | What it established |
|---|---|---|
| 1 | The sentence above. | The sensitive-file check must never treat files inside `.claude`, `.copilot`, `.light-kit` or `specs` as secrets. |

### Decisions
- Add the four folder globs to the built-in `sensitiveAllow` in `kit/hooks/lib/config.mjs`, not to a project file only, so every install and every generated client gets the same exemption — the same reason `031` added the detector's own source there.
- Also add the globs to `.light-kit/hooks.config.json` of this repository, so the hooks already installed for the user pick them up before the next refresh, without requiring a reinstall.
- Keep the existing `**/kit/hooks/lib/secrets.mjs` entry: it covers the kit's source tree, which is not under `.light-kit/`.

### Constraints and preferences
- Do not weaken secret detection for file names or content outside those folders.
- Dependency-free, no new hook, no new config key.
- Direct workflow: one list, its config layer, tests and docs.

### References
- `kit/hooks/lib/config.mjs` (`BUILTIN.sensitiveAllow`), `kit/hooks/checks/protect-sensitive-files.mjs`
- `specs/031-session-id-secret-false-positive` (prior change to the same lists)
- `tests/hooks.test.mjs`, `kit/hooks/README.md`

### Still open
None.
