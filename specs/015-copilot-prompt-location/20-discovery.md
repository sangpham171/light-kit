---
runs:
  - step: discover
    agent: light-tech-lead
    model: deepseek-v4-flash
    thinking: unknown
    level: medium
---

# Discovery

## Files involved
| File | Role |
|---|---|
| `tools/build.mjs` | `CLIENTS.copilot` emits `.github/prompts/<name>.prompt.md`; `USER_PATHS` remaps it at user level; `build()` filters empty paths; `USER_NOTES` holds the installer note |
| `tools/install.mjs` | passes `level`/`projects` to `build()`, runs `findObsolete()` on the folders the kit writes to |
| `tools/uninstall.mjs` | rebuilds the same file list to know what to remove (needs the same home folder) |
| `tests/workspace.test.mjs` | user-level layout test, reads `.copilot/prompts/light-request.prompt.md` |
| `tests/uninstall.test.mjs` | user-level install/uninstall with Copilot, asserts `.copilot/prompts` is removed |
| `docs/installation.md`, `README.md` | state the old limit |

## Constraints found
- `build()` is pure and receives no target folder; user-level paths are relative to the home folder that `install()`/`uninstall()` write into. Any VS Code path must therefore be computed from that same folder, not from `os.homedir()`, or tests would write into the real home.
- VS Code stores profiles under `<User Data>/profiles/<name>`; `profiles/builtin` is not a profile (holds agent global storage only) and is skipped.

## Token usage
Tokens: unknown
Time: unknown
