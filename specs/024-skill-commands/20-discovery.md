---
step: discovery
runs:
  - agent: light-tech-lead
    model: deepseek/deepseek-flash
    thinking: high
    level: medium
usage:
  tokens: 7,160,797 input · 0 cache read · 0 cache write · 35,046 output · 7,195,843 total
  time: 6m 3s
---

# Discovery

## Where commands live now
`kit/prompts/*.md` (10 files) → `tools/build.mjs` renders them per client:

| Client | Path | Shape |
|---|---|---|
| Claude Code | `.claude/commands/<name>.md` | `description`, `argument-hint`, `$ARGUMENTS` |
| Copilot | `.github/prompts/<name>.prompt.md` (project), VS Code profile `prompts/` (user level) | `description`, `agent`, `${input:request:...}` |
| Cursor | `.cursor/commands/<name>.md` | body only, "the text the user typed" |
| Codex | `.codex/prompts/<name>.md` | `description`, `argument-hint`, `$ARGUMENTS`; manual copy to `~/.codex/prompts` |

Four formats, three argument conventions, two install locations for Copilot alone. Skills already have one shape
(`<name>/SKILL.md`, `name` + `description`) and one standard folder per client, which the kit already generates:
`.claude/skills`, `.github/skills` (`~/.copilot/skills`), `.agents/skills`, and Cursor rules.

## Constraints found in the tree
- `tools/build.mjs`: `ARGS`/`promptBody`, prompt loops in `CLIENTS`, prompt mapping in `USER_PATHS.copilot`,
  `vscodePromptDirs`, `adaptKit`, `auditManifest`.
- `kit/audit/audit.mjs` and `rules.json`: a `prompt` component type and a `commands` cost bucket.
- `kit/instructions/core.md`: the "Commands" section; `kit/workflows/*`: "started with that command".
- Hooks: `require-spec` and `session-context` messages, `kit/hooks/README.md`.
- Install/uninstall: the Codex copy note, the `.copilot/prompts` sweep.
- Tests: `kit`, `audit`, `models`, `workspace`, `uninstall` all assert the command paths.
- Docs: `README`, `docs/{installation,usage,development,auditing,commits,safety-hooks,model-routing}`.

## Decision
One skill per command, same names, bodies rewritten without a client argument placeholder. The two commands
that only delegate to a skill (`light-triage`, `light-audit`) merge into those skills. No command or prompt file is
generated any more; the installer sweeps the marker files earlier versions wrote, from every folder they used,
including the VS Code prompt folders at user level.

## Risk
Users lose the `/light-*` slash entry point where a client only lists prompt files. Mitigation: skill names are
unchanged, so a client that lists skills by name still offers `light-*`; the descriptions are written to select
them from plain words, and the docs say so.
