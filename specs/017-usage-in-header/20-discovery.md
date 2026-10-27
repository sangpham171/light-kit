---
runs:
  - step: discover
    agent: light-developer
    model: deepseek-v4-flash
    thinking: unknown
    level: easy
usage:
  - step: 20-discovery
    tokens: unknown
    time: unknown
---

# Discovery

## Relevant code
- `kit/templates/00-request.md` … `60-conclusion.md`: each ends with `## Token usage`.
- `kit/hooks/checks/token-usage.mjs`: `section()` reads the trailing section; `filled()` decides
  whether to warn; the suggestion prints `Tokens:`/`Time:` lines or a Markdown table for the
  conclusion; `rows()` builds the table.
- `kit/hooks/checks/artifact-header.mjs`: validates the frontmatter `runs:` block; reads the header
  with `/^---\n([\s\S]*?)\n---/`.
- `kit/instructions/core.md` rule 12: names `## Token usage`.
- `docs/usage.md`: the paragraph describing the section.
- `tests/hooks.test.mjs`: `usageArtifact`, the conclusion/table helpers, the table assertions.
- `tests/kit.test.mjs`: the artifact-header test checks the template shape and the `## Token usage`
  heading.

## Conventions
- Hooks have no YAML dependency; targeted regex over the header, like `artifact-header`.
- Tests install the kit into a temp folder and run the hooks as child processes; template tests read
  `kit/templates/` directly.

## Constraints
- Historical `specs/001`–`016` artifacts keep their sections; the hook must still read them, or an
  edit to an old artifact triggers a "add usage" warning.
- `formatUsage` output (labelled, thousands grouped) is the value shape; `formatDuration` yields the
  time value.

## Unknowns / risks
- The conclusion table becomes a YAML list: the shape is chosen here (list of `step`/`tokens`/`time`
  rows, plus a `total` row).
