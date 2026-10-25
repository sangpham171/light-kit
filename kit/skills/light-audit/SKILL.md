---
name: light-audit
description: Audit the kit's own instructions, skills, agents and commands to find guidance a newer model no longer needs. Run after a model upgrade.
purpose: structure
---

# Audit the kit

Models improve. Guidance written for an older model can become dead weight (tokens every session) or get in the way. The subject is the **kit**, not the user's project.

## 1. Measure
Run the static report: `node .light-kit/audit/audit.mjs` (user level: `node ~/.light-kit/audit/audit.mjs`). In the kit's own repository: `node kit/audit/audit.mjs --source kit`. It gives cost (loaded every session vs on demand), unused skills and agents, stale references, repeated text, components without a purpose, and the test candidates.

## 2. Judge by purpose
| Purpose | Meaning | What to do |
|---|---|---|
| compensation | exists because a model needed it (checklists, "never do X", step-by-step procedures) | necessity test (step 3) |
| structure | process design (roles, artifacts, workflows, commands) | is it still worth its cost? merge, shorten or drop if a capable model needs less ceremony |
| preference | the user's wishes (concise output, commit rules, how to ask) | keep: a better model does not change a preference. Shorten only if wordy |
| enforcement | backed by hooks or safety | keep; never remove on model grounds |

Core rules and sections count as components. Hooks are deterministic guards: not audited for model necessity, no context cost.

## 3. Necessity test
- **Self-check:** without this text, would you do the right thing by default on a typical task? Say how sure you are. Alone, this gives at most medium confidence.
- **Probe**, for compensation components costing 300+ tokens every session or 800+ on demand, and any you are unsure about (at most 5 components, 3 tasks each):
  1. Write 3 small realistic tasks the component targets, each with a pass/fail check taken from the component's own goal.
  2. Run each task twice in an empty temporary folder with no kit installed, through the client's non-interactive mode (for example `claude -p`, `codex exec`), tasks that need no file or shell access: once with the component text added to the prompt, once without.
  3. Without passes 3 of 3: unnecessary for this model (high confidence). Fails some: shorten to what prevents those failures. With also fails: the text does not work, rewrite or drop it.
  No non-interactive mode available: self-check only, confidence low or medium.

## 4. Look beyond deletion
Repeated text to merge; always-loaded text that could load on demand (move from core into a skill); a skill used by a single workflow (inline it); capabilities of the new model the kit works around.

## 5. Report
Write `.light-kit/audits/<date>-<model>.md`: model, date, the previous audit and what changed since; every-session tokens now and after the proposed changes; a table `component | purpose | tokens | verdict (keep, shorten, merge, move, remove) | evidence | confidence`; proposed changes by tokens saved. Then record it: `node .light-kit/audit/audit.mjs --record "<your model id>"`. Tell the user in at most 8 plain lines: what could go, tokens saved, how sure.

## 6. Apply
- **Kit repository, with `--apply`:** apply high-confidence verdicts only, editing `kit/`; run `npm test` (lint fails if something removed is still referenced); re-run the audit; one commit per component (`light-commit`).
- **Installed kit:** never edit generated files (an upgrade overwrites them). A hook check you judge unnecessary can be set to `off` in `.light-kit/hooks.config.json`. For the rest, the report is the recommendation for the kit's maintainers.
- Never apply preference or enforcement changes, and never apply medium or low confidence ones unless the user picks them.
