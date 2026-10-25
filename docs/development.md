# Development

## Repository layout
| Path | Contents |
|---|---|
| `kit/agents/` | Agent definitions. |
| `kit/skills/` | Skills used by the agents and commands. |
| `kit/prompts/` | The `/light-*` commands. |
| `kit/workflows/` | `direct`, `standard`, `full`, `bootstrap`, `standardize`. |
| `kit/instructions/` | The core rules installed into each client's instruction file. |
| `kit/profiles/` | Init profiles (adopt, greenfield). |
| `kit/templates/` | Artifact templates and seed configs. |
| `kit/hooks/` | Safety hooks and their reference (`kit/hooks/README.md`). |
| `kit/audit/` | The audit tool used by `/light-audit`. |
| `tools/build.mjs` | Generates each client's files. Client formats live here, in `CLIENTS`. |
| `tools/install.mjs` | Installs a generated kit into a target folder (see [Installation](installation.md)). |
| `tools/uninstall.mjs` | Removes an installed kit, soft or hard (see [Uninstall](installation.md#uninstall)). |
| `tests/` | Kit lint, generation and install tests. |

## Tests
```sh
npm test
```
This lints the kit (for example: workflows reference real agents, every component has a `purpose`) and tests generation and install.

## Changing the kit
1. Edit the source in `kit/` or the scripts in `tools/`.
2. Run `npm test`.
3. To try an install, use `--dry-run` first, or install into a scratch folder.
4. Changing a client's file format means editing `CLIENTS` in `tools/build.mjs`, not the generated output in a target project.
