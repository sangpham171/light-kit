---
step: init
runs:
  - agent: light-orchestrator
    model: unknown
    thinking: unknown
    level: medium
usage:
  tokens: unknown
  time: unknown
---

# Codebase map

## In plain words
light-kit helps people use AI coding clients to make small, planned software changes.
It works with Claude Code, GitHub Copilot, Cursor and Codex.
It provides request workflows, reusable agents and skills, project guidance and safety hooks.
It generates the files each client expects from one shared source.

## Purpose
The kit packages spec-driven workflows and guardrails for supported AI coding clients.
Users install the generated files into a project or at user level, then work through request artifacts in `specs/`.

## Structure
- `kit/agents/`, `kit/skills/`, `kit/prompts/`, `kit/workflows/`, `kit/instructions/`: shared agent and workflow source.
- `kit/hooks/`: client-neutral safety checks, libraries and hook documentation.
- `kit/templates/`, `kit/profiles/`: request templates and initialization profiles.
- `tools/`: client-file generation, installation and removal.
- `tests/`: Node built-in test suite for kit rules, hooks, generation, installation and usage.
- `docs/`: user documentation; `README.md` is the project entry point.

## Components and boundaries
- `tools/build.mjs` translates shared `kit/` sources into client-specific files.
- `tools/install.mjs` and `tools/uninstall.mjs` manage generated files at user, workspace or project level.
- `kit/hooks/run.mjs` normalizes client events, loads configured checks and emits client-compatible responses.
- `kit/hooks/checks/` contains individual checks; shared parsing and usage logic live in `kit/hooks/lib/`.
- The package uses Node built-ins; no runtime package dependencies are declared in `package.json`.

## Data
- Project and hook settings are JSON files; requests are Markdown files under `specs/`.
- Hook state is local JSON under `.light-kit/`; Copilot and Claude usage sources are client-owned local JSONL files.
- No project database or migration framework is present.

## Tooling
- `npm test` runs `node --test tests/*.test.mjs`, including kit validation.
- `npm run install-kit -- <target-dir>` invokes `tools/install.mjs`.
- No separate format, lint, build or deployment command is configured in `package.json`.

## Conventions
- ES modules and two-space indentation; examples: `kit/hooks/lib/usage.mjs`, `tools/install.mjs`, `tests/usage.test.mjs`.
- Tests use `node:test` and `node:assert/strict`; examples: `tests/hooks.test.mjs`, `tests/usage.test.mjs`, `tests/kit.test.mjs`.
- Documentation is Markdown organized by topic; examples: `docs/development.md`, `docs/installation.md`, `docs/usage.md`.
- Commit history uses Conventional Commit-like subjects; recent examples include `feat:`, `docs:`, and `refactor:`.

## Hotspots and gaps
- Client file formats and event names converge in `tools/build.mjs`; changes there need generated-output tests.
- Hook behavior is shared across clients, so normalization and check tests are important.
- No CI workflow or standalone formatter configuration was found in the repository.
