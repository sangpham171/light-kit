---
step: conclude
runs:
  - agent: light-tech-writer
    part: conclusion
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  - step: 00-request
    tokens: 59,866 input · 1,008,640 cache read · 0 cache write · 24,144 output · 1,092,650 total
    time: 3m 45s
  - step: 10-understanding
    tokens: 1,604 input · 82,688 cache read · 0 cache write · 817 output · 85,109 total
    time: 3s
  - step: 20-discovery
    tokens: 1,878 input · 258,176 cache read · 0 cache write · 2,877 output · 262,931 total
    time: 15s
  - step: 40-plan
    tokens: 228 input · 89,472 cache read · 0 cache write · 2,705 output · 92,405 total
    time: 12s
  - step: 50-implementation
    tokens: 24,084 input · 7,149,440 cache read · 0 cache write · 40,909 output · 7,214,433 total
    time: 9m 34s
  - step: 60-conclusion
    tokens: 622 input · 452,864 cache read · 0 cache write · 1,600 output · 455,086 total
    time: 9s
  - step: total
    tokens: 88,282 input · 9,041,280 cache read · 0 cache write · 73,052 output · 9,202,614 total
    time: 14m 2s
---

# Conclusion

## Summary
Running `light-init` on a project that already has `.light-kit/` now updates that folder in place instead of re-creating it. A generated script, `.light-kit/init/merge.mjs`, adds the `##` sections, settings and JSON keys the current kit introduced to the project profile, rules, hooks config, models table and workspace registry. Nothing that is already there is changed or deleted, and a second run writes nothing. Kit copies under `.light-kit/templates/` are refreshed by the installer, which they previously were not.

## What changed
Range: `5b3a612b41c905af781a1e32c6d15531d491ab60..HEAD` on `feat/040-init-update-existing-kit-docs`
- `kit/init/merge.mjs` — the additive merge (section/setting lines for Markdown, recursive keys for JSON, modes when the config lists them), with a `--project`/`--dry-run` CLI.
- `tools/build.mjs` — loads and generates `kit/init`, and refreshes `.light-kit/templates/*` on reinstall; `adaptText` rewrites the init path at user level.
- `kit/skills/light-init/SKILL.md` — the existing-install update branch, keep-don't-rewrite wording for the profile, map, assessment and backlog, and the workspace `--project` step.
- `kit/templates/project-hooks.config.json` — complete tuning skeleton (`branches`, `commit`, `audit`, `timeoutSec`).
- `tests/init.test.mjs` (new), `tests/kit.test.mjs`, `tests/workspace.test.mjs` — coverage for the merge, data preservation, idempotence, invalid JSON, CLI paths and user/project path rewriting.
- `docs/usage.md`, `docs/installation.md`, `docs/development.md` — the in-place update, template refresh and the new source folder.
- `specs/040-init-updates-existing-kit/` — request, understanding, discovery, plan, implementation log and this conclusion.

## Verification evidence
- `node --test tests/init.test.mjs` — 11 pass.
- `node --test tests/kit.test.mjs` — 24 pass.
- `node --test tests/workspace.test.mjs` — 23 pass.
- `npm test` — 194 pass, 0 fail.
- Independent tester probe: temp install, customized all five documents, newer templates, merge run — every customized line and JSON leaf survived, new content appeared, the second run wrote nothing; invalid JSON stayed byte-identical; user-level and workspace `--project` runs touched only the intended project.
- Review round 1: all findings addressed (F-1.1 to F-1.6; see `50-implementation.md`).

## Deferred technical debt and open findings
- **039 TD-1 remains open for `.light-kit/rules.md`:** the merge is section-level, so old prose inside an existing `## States` / `## After a task` section is not replaced. The profile side of 039 is fixed (new `## Rules` section and `Promotion threshold` line). Carried follow-up: a `light-standardize` item that refreshes the paragraph on request.
- `splitSections` treats `## ` inside a fenced code block as a heading; the merged kit documents contain no fences. Accepted.
- JSON is reformatted only when keys are added; unchanged files stay byte-for-byte. Accepted.
- `.light-kit/templates/*` is refreshed on every install, so hand-edited template copies are overwritten; they are kit copies and uninstall already treats them that way. Accepted.
- A section the user deliberately deleted is re-added by the additive contract; intentional deletions are not remembered. Accepted.
- A new setting can be inserted next to the previous one without a blank separator. Cosmetic.

## Follow-ups
- Optional: a `light-standardize` item that refreshes the 039 rules paragraph, closing 039 TD-1.
- Users upgrade in two steps: reinstall the kit (refreshes templates and adds the script), then run `light-init` (merges new content into existing documents).
