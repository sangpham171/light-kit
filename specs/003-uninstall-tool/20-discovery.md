---
runs:
  - step: discover
    agent: light-tech-lead
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
---

# Discovery

## How the installer produces files
- `build(kit, clients, { hooks, level, projects })` in `tools/build.mjs` returns every path the installer may write, with one of four shapes:
  - managed content carrying `light-kit:generated` (`isManaged`)
  - `block`: a marked block merged into a user instruction file (`START`/`END`)
  - `hooks`: entries merged into a client hook JSON (`HOOK_MARK`)
  - `seed`: written once, then owned by the user
- `install.mjs` adds `kit.config.json` (`.light-kit/kit.config.json` at user level) outside `build`.
- Two generated files carry no marker: `kit.config.json` and `.light-kit/audit/manifest.json`. Template copies (`.light-kit/templates/*`) are seeds with no user knowledge.
- `findObsolete` (install.mjs) already locates managed files from earlier versions; reuse it for both modes.

## Where each removal lives
| Shape | Removal |
|---|---|
| managed content | delete file, prune emptied folders |
| `block` | strip `START..END`, keep user text, delete file only if what remains is blank |
| `hooks` | parse JSON, drop entries containing `HOOK_MARK`, delete emptied event keys, delete file if only `version` remains |
| seed | soft keeps project knowledge; hard removes `.light-kit/` wholesale |
| config | delete in both modes |

## Constraints
- No dependencies; Node 18+, like the rest of `tools/`.
- Never delete paths outside the target, including project paths read from `kit.config.json` or `--projects`.
- Unmanaged files at kit paths stay, even in hard mode; hard deletes only the kit's own folders.
- Existing tests install into temp dirs; `tools/uninstall.mjs` can be imported directly for tests.
