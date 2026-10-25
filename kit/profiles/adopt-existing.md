---
name: adopt-existing
description: Rules for init when the project already exists.
---

# Adopt existing project

- Detect, do not impose: record the project's actual tooling, structure and conventions.
- Never overwrite existing instruction files; add content only inside the `light-kit` marked block.
- Do not propose restructuring, refactors or tool changes unless the user asks. The only proposals made during init are minor, behavior-preserving standardization items toward the project's own conventions (see the `light-project-assessment` skill), and nothing is changed until the user runs `light-standardize`.
- List gaps (no tests, no CI, no linter) as suggestions in the profile, not as requirements.
