---
name: light-project-assessment
description: For an existing project, assess what is good and where it deviates from its own conventions, then propose only minor, behavior-preserving standardization items. Used by init in adopt mode.
purpose: compensation
---

# Project assessment

In a workspace, `.light-kit/...` paths below refer to the **project's own** `.light-kit/` folder (`<project>/.light-kit/`) and you assess one project at a time.

Goal: help the project become **consistent with itself**. The standard is what the project already does and documents, not what you or this kit would prefer. Never propose refactors or breaking changes.

## 1. Find the project's standards
Use the codebase map as a start, then sample each area (source, tests, config, scripts, docs). For every convention, record the rule and its evidence:
- **Documented rules win:** contribution guides, README, linter and formatter configuration, editor config, CI checks.
- **Otherwise infer from the majority:** naming, file layout, error handling, logging, test style and naming, configuration and secret handling, comments and docs, commit and branch naming.
- Cite at least three example paths for an inferred rule. If two styles are about equally common, **do not choose**: ask the user which one is the standard (equivalent options).

## 2. Assess
- **Strengths** — what the project does well and must be preserved (clear structure, good tests, consistent naming in an area, solid docs).
- **Deviations** — specific files, functions or names that break a standard found above. These are the raw material for proposals.
- **Gaps** — basics missing relative to the project's own practice (a documented way to run the tests, an ignore entry for local configuration files, a missing doc comment where every sibling has one).
- **Urgent risks** — a secret committed to the repository, or similar. Report these to the user immediately and separately; they are not part of the backlog.

## 3. Propose: only what passes every test
A proposal is allowed only if **all** hold:
1. **Behavior-preserving** — the program does exactly the same thing afterwards.
2. **Non-breaking** — no change to public APIs, signatures, data formats, configuration keys, exported names, or anything another module, service or user depends on.
3. **Small** — a few lines or one file; one reviewable commit.
4. **Standard-backed** — it moves something toward a rule from step 1, with evidence.
5. **Easy to verify and revert** — say how (existing tests, lint, a diff that is cosmetic).

Typical acceptable items: formatting and naming fixes inside a single file, matching the project's comment or doc style, adding a missing test for existing behavior following sibling tests, adding the missing ignore entries, documenting how to build and test, removing a clearly dead commented-out block, aligning a private local name with its siblings.

**Never propose:** refactors, restructuring or moving files, renaming anything exported or shared, dependency or tool upgrades and migrations, framework or architecture changes, performance work, rewrites, new features. If tempted, drop it. Do not list such ideas as observations either; the user can ask for them in a normal request.

## 4. Write the results (no project code is changed)
`.light-kit/assessment.md`: *Summary*, *Standards found* (rule + evidence), *Strengths*, *Deviations*, *Gaps*, *Questions for the user* (the split conventions).

`.light-kit/standardization-backlog.md`: at most 15 items, most valuable first, grouped by theme. One block per item:
```
- [ ] S-01 <title>
  Where: <paths>
  Standard: <the rule and its evidence>
  Change: <exactly what changes>
  Risk: low — <why behavior is unchanged>
  Verify: <command or check>
```

## 5. Report
Summarise the backlog for the user in a few plain lines (`light-approval-summary` style: what would become more consistent, how many items, nothing risky). Do not ask for approval: running the `light-standardize` command is the user's consent. Tell them they can apply every item with `light-standardize`, only some with `light-standardize S-01 S-04`, and skip one by marking it `rejected` in the backlog. Ask a question only for a split convention (step 1). Do not change any project code during this phase.
