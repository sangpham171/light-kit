---
step: implement
runs:
  - agent: light-developer
    part: skill output, template, documentation and tests
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 1,253 input · 500,736 cache read · 0 cache write · 3,648 output · 505,637 total
  time: 19s
---

# Implementation log

## Task 1 — the file output
- Added `kit/templates/brainstorm.md`, installed to `.light-kit/templates/brainstorm.md` with the other templates.
- The skill now writes every map to `brainstorms/<YYYY-MM-DD>-<slug>.md`, creates the folder, and appends a round to the same file for a repeated idea.
- A request, when active, gets one `Brainstorm: brainstorms/...` reference line; the map itself stays out of `specs/`.
- Updated the `light-request` pointer to match.
- Verified: the skill and `light-request` name `brainstorms/`, and the old append-to-`00-request.md` instruction is gone from both.

## Task 2 — documentation
- Added `brainstorms/` to the core project knowledge: user-owned, not a request, never managed by the kit.
- Updated the README command description and the `docs/usage.md` brainstorming section with the file location, the round append and the request reference line.
- Verified: all three files mention `brainstorms/`.
