---
name: light-discovery
description: Explore the codebase and context for a request and write 20-discovery.md.
purpose: compensation
---

# Discovery

Goal: learn what exists before deciding what to build.

0. Read `.light-kit/project-profile.md` and `.light-kit/codebase-map.md` if they exist; start from them instead of re-exploring from scratch.
1. Search earlier requests for the same, similar or related work. List `specs/` and judge each folder by its name alone; open only the candidates that look relevant, from the end backwards: `60-conclusion.md` says what it settled, `50-implementation.md` adds detail only when you need it, and `20-discovery.md` shows what it already explored. Open the other artifacts only when a specific question sends you there.
2. Treat earlier artifacts as leads, not facts: they may be stale. Verify what you take from them against the current code and the project profile.
3. Find code, tests, docs and ADRs related to the request. Prefer reusing existing utilities over proposing new ones.
4. Note conventions that apply (naming, layering, error handling, test style).
5. List constraints (compatibility, performance, security, deadlines) and unknowns.
6. Write `20-discovery.md` using the template: *Prior requests*, *Relevant code*, *Conventions*, *Constraints*, *Reuse candidates*, *Unknowns / risks*.

Cite file paths. Mark anything you did not verify as an assumption.
