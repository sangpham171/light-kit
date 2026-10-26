---
runs:
  - step: conclude
    agent: light-orchestrator
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
---

# Conclusion

## Summary
The `runs:` front matter is now valid YAML in every artifact template. Each agent run is a block mapping instead of a ` | `-separated one-liner, so Markdown front matter parsers load it without the "nested mappings are not allowed in compact mappings" error.

## What changed
Range: `f8f11a724bc98c16c4791c3195c249c059f01fb7..HEAD` on `fix/006-token-usage-unknown`
- `kit/templates/*.md` — seven artifact templates use one block mapping per run.
- `kit/hooks/checks/artifact-header.mjs` — groups the front matter into entries at each `- ` line and checks `agent`, `model`, `thinking` within an entry.
- `tests/kit.test.mjs`, `tests/hooks.test.mjs` — fixtures and the template assertion use the new shape.
- `docs/usage.md`, `kit/instructions/core.md`, `kit/skills/light-model-routing/SKILL.md` — describe one entry per run.
- `specs/001`–`specs/006` — 38 existing run entries migrated; content unchanged.
- Commit: `77058e5`.

## Verification evidence
- All 7 template front matter blocks and all `specs/*/*.md` front matter parse with Ruby Psych (`YAML.safe_load`), including real values such as `deepseek-flash[1m]`.
- `npm test`: 109 tests, 109 pass, 0 fail.
- Direct workflow, so no separate review round.

## Token usage
| Step | Input | Output | Total |
|---|---|---|---|
| 00-request | 1230544 | 31052 | 1261596 |
| 10-understanding | 141462 | 2649 | 144111 |
| 50-implementation | 2212462 | 23934 | 2236396 |
| 60-conclusion | 640498 | 4440 | 644938 |
| **Total** | 4224966 | 62075 | 4287041 |

## Deferred technical debt and open findings
- None introduced.
- Installed copies keep the old templates until the kit is reinstalled; the user-level install in `~/.light-kit` must be refreshed.

## Follow-ups
- None.
