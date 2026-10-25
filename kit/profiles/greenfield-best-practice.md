---
name: greenfield-best-practice
description: Baseline practices proposed by init for a new project; tailored to the chosen stack.
---

# Greenfield best practices

Apply by default, tailored to the chosen stack (the user can trim them):
- Version control with conventional commits and short-lived branches.
- Automated tests (unit first, a few integration tests, minimal end-to-end) and a single command to run them.
- Formatter and linter configured and enforced in CI.
- CI pipeline: build, lint, test on every pull request.
- Dependency pinning and automated update checks.
- Secrets outside the repo; `.env.example` for configuration.
- ADRs for significant decisions; README with setup and run steps.
- Security baseline: input validation, least privilege, dependency scanning.
