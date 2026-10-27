---
runs:
  - step: conclude
    agent: light-orchestrator
    model: deepseek-v4-flash
    thinking: unknown
    level: easy
---

# Conclusion — 014 Copilot prompts at user level

A user-level install now writes the kit's `/light-*` prompts to `~/.copilot/prompts`. One path mapping in `USER_PATHS` plus the docs, installer note and tests that described the old limit.

Changed: `tools/build.mjs`, `docs/installation.md`, `README.md`, `tests/workspace.test.mjs`, `tests/uninstall.test.mjs`.
Verified: `npm test` (121/121); real `install --level user` wrote 10 prompt files into `~/.copilot/prompts`.

Known limit: VS Code reads user prompt files from its own profile folder, not `~/.copilot/prompts`; a project-level install is still what gives `/light-*` in Copilot Chat. Stated in the installer note and both docs.

## Token usage
| Step | Tokens | Time |
|---|---|---|
| request | unknown | unknown |
| understand | unknown | unknown |
| implement | unknown | unknown |
| verify-and-review | unknown | unknown |
| conclude | unknown | unknown |
| **total** | unknown | unknown |

Tokens: unknown
Time: unknown
