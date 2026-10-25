---
name: light-discovery
description: Explore the codebase and context for a request and write 20-discovery.md.
---

# Discovery

Goal: learn what exists before deciding what to build.

0. Read `.light-kit/project-profile.md` and `.light-kit/codebase-map.md` if they exist; start from them instead of re-exploring from scratch.
1. Find code, tests, docs and ADRs related to the request. Prefer reusing existing utilities over proposing new ones.
2. Note conventions that apply (naming, layering, error handling, test style).
3. List constraints (compatibility, performance, security, deadlines) and unknowns.
4. Write `20-discovery.md` using the template: *Relevant code*, *Conventions*, *Constraints*, *Reuse candidates*, *Unknowns / risks*.

Cite file paths. Mark anything you did not verify as an assumption.
