---
name: light-review-checklist
description: Checklist for reviewing an implementation against its spec and plan.
purpose: compensation
---

# Review checklist

0. **Scope** — start from `base_commit` in `status.md`; review `git log` and `git diff` from there to `HEAD`, on `work_branch`.
1. **Spec fit** — every requirement and acceptance criterion in `10-understanding.md` / `40-plan.md` is met; nothing extra was added.
2. **Correctness** — edge cases, error paths, concurrency and data handling.
3. **Tests** — new behaviour is covered; tests fail without the change; the suite passes.
4. **Conventions** — matches the project profile and surrounding code.
5. **Security** — input validation, authn/authz, secrets, dependency risk.
6. **Maintainability** — naming, duplication, unnecessary complexity, docs updated.
7. **Plan fidelity** — deviations are recorded in `50-implementation.md`.
8. **Technical debt** — the developer's Technical debt section is complete and honest: nothing introduced by the change is left open without a reason.

Report findings as `blocker`, `should-fix` or `nit`, each with file and line and a suggested fix. End with a verdict: approve or changes requested.
