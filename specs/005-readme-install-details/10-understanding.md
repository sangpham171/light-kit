---
runs:
  - step: understand | agent: light-orchestrator | model: deepseek-flash[1m] | thinking: unknown | level: easy
---

# Understanding

## Restatement
The README install section must explain how to install on macOS and Windows, and what each supported client (Claude Code, GitHub Copilot, Cursor, Codex) gets and what to do after installing. The README stays an entry point; reference detail stays in `docs/installation.md`.

## Assumptions
- Documentation only: `README.md` and `docs/installation.md`. No installer, build, workflow or hook changes.
- Platforms are documented as they are, not as they should be: the installer is plain Node (portable), while the registered hook commands use POSIX shell syntax (not verified on native Windows).
- The kit is distributed as a git clone of this repository (no published npm package, `package.json` is `private`).
- The README keeps the shape set by request 001 and links to `docs/installation.md` instead of duplicating the reference.

## Open questions (with proposed defaults)
None blocking. Decisions taken:
- Keep the detailed levels/flags/layout in `docs/installation.md`; the README gets commands per platform plus a per-client table.
- State Windows-hook limitation plainly rather than claim untested support.

## Requirements
1. README install section: how to get the kit, then install for one project, a whole workspace, the user level, and a subset of clients — with macOS/Linux and Windows command examples.
2. README states the requirement (Node 18+), the client list, and where user-level files land on each platform.
3. README table: per client, the files written and the step after install (open the client, `/light-init`, Codex trust and prompts).
4. `docs/installation.md` gains a Platforms section: macOS/Linux, Windows, WSL; global paths on Windows; which parts are portable and which need a POSIX shell; `--no-hooks` fallback.
5. `docs/installation.md` gains an "After installing" per-client table (global limits for Copilot prompt files and Cursor rules, Codex prompts and hook trust).
6. No fact contradicts `tools/install.mjs`, `tools/build.mjs` or `tools/uninstall.mjs`.

## Acceptance criteria
- Every flag, command and path in the new prose exists in the scripts (verified by reading them).
- Links resolve: `README.md` → `docs/installation.md#platforms`, `docs/installation.md` → headings in the same file.
- No section is duplicated between README and docs beyond the minimum needed to use the installer.
- `npm test` passes.

## In scope / Out of scope
In: `README.md`, `docs/installation.md`, this request folder.
Out: installer/build/uninstaller behavior, workflows, agents, hooks, published packaging.

## Triage
Scores: scope 1, ambiguity 0, risk 0, novelty 0, impact 0 (total 1)
Workflow: direct
Why: documentation-only; the outcome is clear and no design decision has more than one sensible answer.

## Routing
- understand: easy — summarise a clear docs request.
- implement: easy — write prose against the scripts as source of truth.
- review: easy — check claims against scripts and links.
- conclude: easy — short summary.

## Token usage
Tokens: unknown
