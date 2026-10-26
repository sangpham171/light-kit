---
runs:
  - step: implement | agent: light-orchestrator | model: deepseek-flash[1m] | thinking: unknown | level: easy
  - step: review | agent: light-reviewer | model: deepseek-flash[1m] | thinking: unknown | level: easy
  - step: fix | agent: light-orchestrator | model: deepseek-flash[1m] | thinking: unknown | level: easy
---

# Implementation log

## Progress
- T1 — `11174d4` docs(spec): start request 005-readme-install-details (request, understanding, status).
- T2 — `768dcf0` docs: explain installation per platform and client (README install flow, per-client table; `docs/installation.md` Platforms and After installing).
- T3 — `8eae7f2` docs: scope hook shell claims and fill platform gaps (review fixes).

## Technical debt
- TD-1 docs/installation.md — Windows install, uninstall and hook execution are documented from the code; nothing was run on Windows and there is no Windows CI — status: deferred (follow-up: run `npm test` and an install/uninstall dry run on a Windows runner).

## Decisions and deviations
- `direct` workflow; docs-only with one sensible answer per question.
- Work branch based on `main`, not on the concluded `feat/004-token-consumption` branch, so this change does not carry request 004's unmerged work.
- README keeps the detail short (commands per platform, one row per client) and links to `docs/installation.md`; the reference material stays in one place, as request 001 required.
- Windows support is stated as it is: the installer is pure Node, but Claude Code and Codex project hooks (and every user-level hook) use POSIX expansions. Native Windows hook execution is documented as unverified, with WSL and `--no-hooks` as the ways out, instead of claiming untested support.
- This repository still has no `.light-kit/` profile, as in request 001; conventions defaulted to the global instructions. `/light-init` remains out of scope.

## Verification (commands run and results)
- `npm test` — 100 tests, 100 pass (after the review fixes too).
- Link and anchor check over `README.md` and `docs/*.md` — all relative links resolve; `#platforms`, `#after-installing` and `#three-install-levels` exist.
- Claims checked against `tools/install.mjs` (levels, `--clients` detection, user-level stop without client folders), `tools/build.mjs` (`CLIENTS`, `USER_PATHS`, `HOOK_CLIENTS`, `USER_NOTES`, `AGENTS.md` rule), `tools/uninstall.mjs`.

## Review rounds
Round 1 of 1 (light-reviewer).
- F-1.1 [should-fix] docs/installation.md:18 — POSIX-shell claim was overbroad: Cursor and Copilot project hooks use a relative path; only Claude Code, Codex and user-level hooks use expansions — scoped per client and level — status: fixed (`8eae7f2`).
- F-1.2 [should-fix] docs/installation.md:18 — "run the client from Git Bash" was not supported by the source and native Windows hook behavior is unverified — removed; WSL kept as the workaround, `--no-hooks` as the fallback — status: fixed (`8eae7f2`).
- F-1.3 [should-fix] README.md:10 — same overbroad claim in the requirements list — qualified to Claude Code and Codex — status: fixed (`8eae7f2`).
- F-1.4 [nit] 50-implementation.md — "no technical debt" hid the unverified Windows claims — recorded as TD-1 — status: fixed.
- F-1.5 [nit] README.md:49-54 — the client table omitted the shared `AGENTS.md` for Copilot and Cursor — added as a note under the table — status: fixed (`8eae7f2`).
- F-1.6 [nit] README.md:32 — only the Windows user-level location was given — added `~` / `/Users/<you>` / `/home/<you>` — status: fixed (`8eae7f2`).
- F-1.7 [nit] README.md:56, docs/installation.md — Copilot wording ("keeps them in its own settings") was imprecise — used the existing precise wording (VS Code profile folder) and removed the duplicate limits sentence from "After installing" — status: fixed (`8eae7f2`).
Verdict: approve.

## Token usage
Tokens: unknown
