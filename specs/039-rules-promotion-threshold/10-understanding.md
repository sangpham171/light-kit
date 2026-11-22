---
step: understand
runs:
  - agent: light-orchestrator
    part: understanding and triage
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 2,335 input · 99,968 cache read · 0 cache write · 1,726 output · 104,029 total
  time: 10s
---

# Understanding

## Goal
The number of violations that promotes a `pending` rule to `confirmed` is a per-project setting instead of the hardcoded `3`, and every kit source, template and doc reads that setting.

## Restatement
The rules system (request 037) hardcodes `3` in `.light-kit/rules.md`, its template, the `light-rules` skill, the core instructions and the user docs. The user wants to choose that number. The project profile is the existing place for per-project settings (`Output style`, `Review turns`, `Commit policy`), is read before work and is never overwritten by upgrades, so the threshold goes there.

## Prior requests
| Request | What was reused or contradicted |
|---|---|
| `037-project-rules` | Created the rules system, its template, the skill and the `3` threshold. Its split (short rule in core instructions, procedure in the skill) is kept. Its `3` is what this request makes configurable; nothing contradicts it. |
| `025-conversation-capture` | Not related. |

Verified against current code: the `3` still appears in `kit/templates/rules.md` (lines 12, 14, 35), `kit/skills/light-rules/SKILL.md` (line 24), `kit/instructions/core.md` (lines 25, 46), `docs/usage.md` (line 11), this repo's `.light-kit/rules.md`, and the assertions in `tests/kit.test.mjs` (lines 198, 202). No hook or generated client file computes the threshold; it is instruction-only.

## Assumptions
- One threshold per project, not a per-rule override. Prompt says "the 3 times violated in rules", singular.
- Integer >= 1; a missing, non-numeric or lower value falls back to `3`.
- Default `3` keeps today's behavior, so existing installs need no migration.
- `brainstorm: skipped — precise, familiar request with an existing settings pattern.`

## Open questions (with proposed defaults)
- Where should the setting live? — default: `.light-kit/project-profile.md` under `## Rules`, because it already holds optional per-project settings and survives upgrades. Rejected: a line in `rules.md` (mixes config with rule rows) and `hooks.config.json` (no hook enforces rules).

## Requirements
1. `kit/templates/project-profile.md` gains `## Rules` with `Promotion threshold: 3` and a comment stating the default and allowed values.
2. `kit/skills/light-rules/SKILL.md` reads the threshold from the profile (`Promotion threshold`, default `3`) before applying or promoting a rule.
3. `kit/templates/rules.md` and this repo's `.light-kit/rules.md` describe promotion by "the promotion threshold in the project profile (default 3)", not a literal 3.
4. `kit/instructions/core.md` says the count is compared with the project's promotion threshold (default 3), in rule 15 and the project-knowledge bullet.
5. `docs/usage.md` explains where to set the threshold and that the default is 3.
6. Tests assert the profile template exposes the setting and the skill/template/instructions reference it instead of a bare 3.

## Acceptance criteria
- Changing `Promotion threshold` in a project profile changes the number the instructions tell agents to compare `Count` against.
- With no setting, behavior is unchanged (`3`).
- No kit source states the threshold as a fixed 3 except as the documented default.
- `npm test` passes.

## In scope / Out of scope
- In scope: kit template, skill, core instructions, user docs, this repo's profile and rules seed, tests.
- Out of scope: per-rule thresholds; hook enforcement; changing the states or counting semantics.

## Triage
Scores: scope 1, ambiguity 0, risk 0, novelty 0, impact 1 (total 2)
Workflow: direct
Why: one subsystem, a clear outcome, and the same pattern as the existing profile settings; no new capability or breaking change.

## Routing
- understand: easy — one message, known files.
- plan: easy — a mechanical edit list.
- implement: easy — text and test edits following the existing settings pattern.
- review: easy — small textual change, no runtime risk.
- fix: easy — review fixes only if any.
- conclude: easy — short summary.
