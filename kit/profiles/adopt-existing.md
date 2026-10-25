---
name: adopt-existing
description: Rules for init when the project already exists.
---

# Adopt existing project

- Detect, do not impose: record the project's actual tooling, structure and conventions.
- Never overwrite existing instruction files; add content only inside the `light-kit` marked block.
- Do not propose restructuring or tool changes unless the user asks.
- List gaps (no tests, no CI, no linter) as suggestions in the profile, not as requirements.
