---
name: light-review-checklist
description: Checklist for reviewing an implementation against its spec and plan.
purpose: compensation
---

# Review checklist

1. **Spec fit** — every requirement and acceptance criterion in `10-understanding.md` / `40-plan.md` is met; nothing extra was added.
2. **Correctness** — edge cases, error paths, concurrency and data handling.
3. **Tests** — new behaviour is covered; tests fail without the change; the suite passes.
4. **Conventions** — matches the project profile and surrounding code.
5. **Security** — input validation, authn/authz, secrets, dependency risk.
6. **Maintainability** — naming, duplication, unnecessary complexity, docs updated.
7. **Plan fidelity** — deviations are recorded in `50-implementation.md`.
8. **Technical debt** — the developer's Technical debt section is complete and honest: nothing introduced by the change is left open without a reason.
9. **Project rules** — every applicable `confirmed` rule in `.light-kit/rules.md` was followed; report each violation so the orchestrator can record it. A review is one trigger, not the only one: a user-reported bug or regression, a failed test, build, lint or manual check, a tester or security finding, and a user correction all record a rule too; say so in the finding when one applies.

Report findings as `blocker`, `should-fix` or `nit`, each with file and line and a suggested fix. End with a verdict: approve or changes requested.
