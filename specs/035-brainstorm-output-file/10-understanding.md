---
step: understand
runs:
  - agent: light-orchestrator
    part: restatement, requirements and triage
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 0 input · 0 cache read · 0 cache write · 0 output · 0 total
  time: 2s
---

# Understanding

## Restatement
`light-brainstorm` must always write its idea map to a Markdown file. The file lives outside `specs/`, in a dedicated `brainstorms/` folder at the project root, with one file per idea.

## Prior requests
- `034-brainstorm-skill`: created the skill. It currently appends `## Brainstorm` to `00-request.md` when a request exists and otherwise only presents the map. Both behaviours change here.
- `025-conversation-capture`: a discussion may be captured in `00-request.md`, but this request deliberately keeps exploratory maps out of the request folder.
- `024-skill-commands`: commands are skills. No change.

Verified against the current skill, test, README and docs.

## Assumptions
- `brainstorms/` belongs to the user, like `specs/`; kit upgrades and uninstalls do not touch it.
- A brainstorm can be opened by the user directly, before any request exists.
- In a multi-project workspace the file goes in the root of the project under discussion; a cross-project brainstorm goes in the workspace root.

## Open questions (with proposed defaults)
None. Location, file naming and the request reference are decided below.

## Requirements
1. `light-brainstorm` always writes the idea map to a Markdown file; it never returns the map only in the reply.
2. Default location is `brainstorms/` at the project root, created when missing.
3. File name is `<YYYY-MM-DD>-<slug>.md`. Brainstorming the same idea again updates that file with a new round instead of creating a duplicate.
4. Add `kit/templates/brainstorm.md` with the file skeleton: title, date, status, original idea, framing, directions, unmentioned cases, options, assumptions, open questions and next step.
5. When a request folder is active, add one reference line to `00-request.md`; do not copy the map into `specs/`.
6. Remove the old "append `## Brainstorm` to `00-request.md`" instruction from the skill, `light-request`, docs and tests.
7. Explain `brainstorms/` in the core project knowledge so every client and request sees the convention.
8. Cover the new behaviour with tests: the generated skill, the installed template, the core guidance and the absence of the old instruction.

## Acceptance criteria
- `npm test` passes.
- Every client build includes the updated skill, and the install writes `.light-kit/templates/brainstorm.md`.
- The generated skill names `brainstorms/`, requires a file and no longer appends to `00-request.md`.
- `CLAUDE.md`, `README.md` and `docs/usage.md` describe the file and its folder.

## In scope / Out of scope
In scope: the skill output step, the template, the core guidance, docs and tests.

Out of scope: changing the exploration method, adding a command that lists brainstorms, automatic linking from requests beyond one line, and any migration of past `## Brainstorm` sections.

## Triage
Scores: scope 1, ambiguity 1, risk 0, novelty 1, impact 1 (total 4)
Workflow: standard
Why: a small change to one skill plus a template, docs and tests, with a storage decision that is now settled.

## Routing
- understand: easy — one clear turn with a recorded decision.
- discover: easy — the current skill, template mechanism, docs and tests are known from request 034.
- plan: easy — three small tasks.
- implement: easy — edit the skill, add one template, update docs and tests.
- verify-and-review: easy — run the suite, check one generated install.
- fix: easy — expected nits only.
- conclude: easy — short summary.
