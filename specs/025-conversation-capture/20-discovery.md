---
step: discover
runs:
  - agent: light-tech-lead
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: unknown input · unknown cache read · unknown cache write · unknown output · unknown total
  time: unknown
---

# Discovery

## Where the request is recorded
- `kit/templates/00-request.md` holds only `## Original request`; the orchestrator (`kit/agents/light-orchestrator.md` step 1) says to save "the user's words verbatim", which reads as the final message.
- `kit/instructions/core.md` rule 1 requires a request before code but says nothing about a preceding conversation.

## Where the plan is skipped
- `kit/workflows/direct.md` goes understand → implement with no `40-plan.md`.
- `kit/skills/light-implement/SKILL.md` assumes `40-plan.md` exists; it has no path for a request adopted from a discussion.
- `kit/agents/light-developer.md` tells the developer to build "exactly what the plan says" but not to create the plan first.

## Hook infrastructure
- `kit/hooks/checks/` holds one module per check; `index.mjs` lists them, `hooks.config.json` and `lib/config.mjs` (`DEFAULT_MODES`) set the default mode, and `kit/hooks/README.md` documents them.
- A `prompt` event exists for all four clients (`tools/build.mjs`), and `redact-prompt-secrets` already uses it.
- `kit/hooks/lib/specs.mjs` exposes `activeRequests`; it reports `understood` but not whether `40-plan.md` exists.

## Tests
- `tests/kit.test.mjs` validates the lint, generated files and templates.
- `tests/hooks.test.mjs` runs `run.mjs` with client payloads; `withSpec` creates a request without a plan, so an implement-intent hook must be exercised explicitly.

## Gaps
- No test asserts a plan step in `direct`.
- No test asserts the conversation section in `00-request.md`.
- `kit/audit/rules.json` needs a purpose entry for every new core rule or the kit lint fails.
