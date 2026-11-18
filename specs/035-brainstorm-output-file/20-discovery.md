---
step: discover
runs:
  - agent: light-tech-lead
    part: discovery
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 1,006 input · 287,104 cache read · 0 cache write · 2,838 output · 290,948 total
  time: 12s
---

# Discovery

## Prior requests
See `10-understanding.md`. `034-brainstorm-skill` built the skill; this request changes only where its output goes.

## Relevant code
- `kit/skills/light-brainstorm/SKILL.md:55-68` — the output section and the old instruction to append `## Brainstorm` to `00-request.md`.
- `kit/templates/` — every Markdown file is installed as a seed at `.light-kit/templates/` (`tools/build.mjs:302`), so a new `brainstorm.md` needs no build change.
- `tests/kit.test.mjs:330-368` — the header test loops a fixed list of seven request artifacts; a brainstorm template without a run header is not affected.
- `tests/kit.test.mjs:78-103` — the 034 test asserts the old `## Brainstorm` location, so it must change.
- `kit/skills/light-request/SKILL.md:15-17` — points brainstorming output at `00-request.md`.
- `kit/instructions/core.md:43-47` — project knowledge; the place to explain `brainstorms/`.
- `README.md:89` and `docs/usage.md:10-13` — describe the skill and its current output.

## Conventions
- Templates are plain Markdown; request artifacts carry a `runs:`/`usage:` header, exploratory user files need none.
- File and folder names are lowercase and hyphenated.
- Dates in request artifacts use `YYYY-MM-DD`.

## Constraints
- `brainstorms/` is user work product: the installer and uninstaller must not manage it. They only touch files they generate, so a top-level folder needs no tooling change.
- No dependencies.

## Reuse candidates
- The idea-map section names already in the skill become the template's sections.
- The `<NNN-slug>` naming style is mirrored with a date prefix instead of a number, so brainstorm and request numbering do not collide.

## Unknowns / risks
- None blocking. The main risk is leaving the old `00-request.md` instruction in one of the four places (skill, `light-request`, docs, test), which the updated test will catch.
