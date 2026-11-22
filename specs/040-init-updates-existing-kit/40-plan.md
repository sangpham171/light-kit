---
step: plan
runs:
  - agent: light-tech-lead
    part: implementation plan
    model: deepseek-flash[1m]
    thinking: unknown
    level: medium
usage:
  tokens: 228 input · 89,472 cache read · 0 cache write · 2,705 output · 92,405 total
  time: 12s
---

# Plan

- [ ] 1. Add `kit/init/merge.mjs`: a standalone, dependency-free module with a CLI (`node merge.mjs [--project <dir>] [--dry-run]`). It updates existing project documents from the templates next to the script: Markdown (`project-profile.md`, `rules.md`, `projects.md`) gains missing `##` sections and missing `key: value` setting lines; JSON (`hooks.config.json`, `models.json`) gains missing keys recursively, plus missing hook modes from `hooks/lib/config.mjs` when hooks are installed. It never changes or deletes an existing line, value or file, skips invalid JSON untouched, and is idempotent — level: medium — files: kit/init/merge.mjs — verify: `node -e "import('./kit/init/merge.mjs').then(m => console.log(typeof m.mergeProject))"` — commit: feat(kit): add the init merge script
- [ ] 2. Wire the script and refresh kit templates: `loadKit()` loads `kit/init`, `build()` emits `.light-kit/init/<file>` with the generated marker, and `.light-kit/templates/*` stop being seeds (`overwrite: true`) so an upgrade refreshes them — level: medium — files: tools/build.mjs — verify: `node -e "import('./tools/build.mjs').then(async ({loadKit,build}) => { const f = build(loadKit(), ['claude']); console.log(f.filter(x => x.path.includes('/init/') || x.path.includes('/templates/')).map(x => x.path + (x.seed ? ' seed' : x.overwrite ? ' overwrite' : '')).join('\n')) })"` — commit: feat(kit): generate the init merge script and refresh templates
- [ ] 3. Cover the behaviour: update the template-seed test in `tests/kit.test.mjs` (templates refreshed, user seeds kept) and add `tests/init.test.mjs` for markdown sections/settings, JSON keys/modes, preserved user content, idempotence, missing files not created, invalid JSON untouched, and `--project` — level: medium — files: tests/kit.test.mjs, tests/init.test.mjs — verify: `node --test tests/init.test.mjs tests/kit.test.mjs && npm test` — commit: test(kit): cover updating an existing light-kit folder
- [ ] 4. Teach `light-init` the update path: an existing `.light-kit/` is updated, not re-created — run `node .light-kit/init/merge.mjs` (user level: `node ~/.light-kit/init/merge.mjs`; workspace: `--project <project>`), report what it added, keep an existing profile, codebase map, assessment and backlog, and fill only what is missing. Adjust the create-only wording of step 2 and the rules sentence — level: easy — files: kit/skills/light-init/SKILL.md — verify: `grep -n "merge.mjs\|Existing install\|never rewrite" kit/skills/light-init/SKILL.md` — commit: docs(kit): update existing documents on light-init
- [ ] 5. Document the in-place update: what `light-init` adds to an existing install, that kit templates are refreshed and user files are only added to, and that the first update after this change needs the installer to have refreshed the templates — level: easy — files: docs/usage.md, docs/installation.md — verify: `grep -n "existing\|in place\|templates" docs/usage.md docs/installation.md | grep -i "update\|add"` — commit: docs(kit): document the in-place kit update
- [ ] 6. Review the change against the `light-review-checklist` skill and the acceptance criteria, fix findings, and log decisions, fixes and the rules update in `50-implementation.md` — level: medium — files: specs/040-init-updates-existing-kit/50-implementation.md; a fix commit touches only the files a finding names — verify: `npm test` — commit: chore(kit): address the round 1 review for request 040
- [ ] 7. Write `60-conclusion.md` with what changed, how it was verified, deferred debt and open items — level: easy — files: specs/040-init-updates-existing-kit/60-conclusion.md — verify: header has `step:`, `runs:` and `usage:`; every step has a usage row — commit: docs(spec): conclude request 040

Plan commit before task 1: `docs(spec): record plan for request 040`.

## Risks
- `.light-kit/templates/*` becoming `overwrite: true` changes the "seeds survive" contract; the existing test pins that contract and must change in the same commit as the build change (task 2's test update lands in task 3, so keep `npm test` failing only on that assertion until task 3; do not merge between).
- A Markdown merge that inserts sections at the end is order-stable but may put a new section after "Commit policy"; acceptable, and safer than reordering user content.
- The setting-line heuristic must be conservative (no tables, lists or indented lines) so it cannot duplicate or alter user prose.
- JSON merge rewrites the file with 2-space indentation; a user file with other formatting is normalized. Accepted: the content is identical and the kit already writes these files this way.
- The generated script resolves templates relative to itself; at user level and workspace level the target project is passed with `--project`, so the home folder or workspace root is never merged by mistake.

## Test strategy
- `node --test tests/init.test.mjs` after each behaviour change in the merge script.
- `node --test tests/kit.test.mjs` after the build/install change.
- `npm test` at task 3 and task 6 (it also runs kit lint).
- Manual temp-install probe: customize all five documents, change the template, reinstall, run the merge, and diff.

## Parallelisable tasks
- Tasks 1 and 2 touch disjoint files; task 2 depends on task 1 only for the generated path name, which is fixed in the plan.
- Tasks 4 and 5 touch docs only and can run together after task 3.
- Task 3 depends on 1-2; task 6 depends on all; task 7 last.
