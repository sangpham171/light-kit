---
step: understanding
runs:
  - agent: light-orchestrator
    part: requirements and design
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 0 input · 0 cache read · 0 cache write · 0 output · 0 total
  time: 6s
---

# Understanding

## Goal
Keep this repository's `package.json` version in step with the requests it finishes, without changing
the kit that is installed into other projects.

## Behaviour
1. A request declares its release impact in `specs/<NNN-slug>/status.md`:
   `version_bump: patch | minor | major`. Missing or invalid means `patch`.
2. When a `Stop` event fires, `tools/version-bump.mjs`:
   - lists `specs/<NNN>-*` folders numbered above the recorded baseline;
   - for each, in numeric order, whose `status.md` says `state: done` and whose number is not already
     applied, applies its bump to `package.json` (`0.1.0` + patch → `0.1.1`; + minor → `0.2.0`;
     + major → `1.0.0`);
   - records each applied number and resulting version in `.light-kit/version-bump.json`;
   - stages and commits only `package.json` as `chore(release): vX.Y.Z` unless the branch is protected
     or the state file sets `"commit": false`.
3. If nothing new is finished, or the state cannot be read, it does nothing and exits 0.
4. A missing state file is seeded with `baseline` = highest existing request number and the current
   version, so no historical jump occurs.

## Semver mapping (this project)
| Level | Use for |
|---|---|
| `patch` | fix, docs, chore, refactor with no new capability |
| `minor` | new capability, backward compatible |
| `major` | breaking change to generated files, CLI, hook behaviour or config format |

## Edge cases
- Status file without front matter (R-008 class): treated as not done; no bump.
- Invalid `version_bump` value: `patch`, with one stderr note.
- `package.json` version not a numeric triple: no write, one stderr note, exit 0.
- Multiple finished requests since the last stop: applied one by one in numeric order.
- Protected branch (`main`, `master`, `trunk`, `develop`, `production`, `release/*`): bump is written
  but not committed; the agent or user commits it.
- A deleted state file: re-seeds at the highest current request, so older requests never re-bump.
- The same Stop event twice: applied map prevents a second bump.
- Script copied to another project: it exits 0 unless `package.json` name is `light-kit`.

## Acceptance criteria
- `0.1.0` + patch → `0.1.1`; + minor → `0.2.0`; + major → `1.0.0`.
- Only finished requests above the baseline bump; the current 51 requests cause no change.
- Applying 052 (`minor`) once yields `0.2.0`; a second run changes nothing.
- No file under `kit/` differs after the change.
- The hook exits 0 on malformed input and never prints to stdout.

## Triage
Scores: scope 1, ambiguity 0, risk 1, novelty 1, impact 0 (total 3)
Workflow: direct
Why: the user fixed the scope and the version scheme; the change is one standalone script in `tools/`,
one project config file and one profile convention. No shared kit file is touched.

## Constraints from rules
- R-004: commit `.light-kit/version-bump.json` and `package.json` at the conclusion checkpoint.
- R-007: compare real paths, not normalized strings, if any path equality is needed.
- R-010: the switch (`commit`, baseline) is read by every entry point — the hook and manual runs.
