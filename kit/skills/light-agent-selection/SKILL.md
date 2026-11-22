---
name: light-agent-selection
description: Decide who runs each workflow step as the request unfolds — add, skip, split, repeat or reorder agents and steps when facts change — while keeping the mandatory steps and the specialists the risk requires, and record every change.
purpose: structure
---

# Agent selection

The agents a workflow lists per step are the **baseline**, chosen from what is known at triage. You own the roster from then on: keep it matched to what the work has become. Model choice is separate; see `light-model-routing`.

## 1. When to re-evaluate
- Before calling the agents of the next step.
- When a fact changes the work: a new subsystem or interface appears; the risk rises (auth, personal data, money, migrations, public interfaces, new dependencies); a user interface appears or disappears; scope shrinks or grows; an artifact makes a later agent's work redundant; a verification or review finding names a gap; a task fails and needs a different specialty.

Do not re-open the roster after every tool call. At a step boundary or a changed fact: decide, record one line, and move on.

## 2. What you may change

| Move | Use when | Example |
|---|---|---|
| Add an agent to a step | the baseline has a gap the work now needs | `light-security-reviewer` once auth, personal data, money or a public interface enters the change |
| Add a step | the work needs a kind of output no current step produces | a discovery or design pass when an implementation task exposes an unknown structure; `light-tech-writer` when docs become part of the request |
| Skip an optional agent | its only contribution has nothing to act on | `light-ux-designer` when there is no user interface; `light-product-owner` when goals and scope are settled and uncontested |
| Split a step | one step now holds two distinct kinds of work | design into architecture and UX; verification into behavior tests and a security review |
| Repeat a finished step | new facts invalidated its output | another discovery or design pass after clarification; another implementation pass for a task the review reopened |
| Reorder remaining steps | a dependency allows it | security review before the second implementation pass |

## 3. What you must not change
- **Mandatory steps:** every workflow keeps `understand`, a written `40-plan.md` before code, `implement`, the `review`/`fix` loop and `conclude`. `direct` keeps no discovery or design; when the work needs more, escalate the workflow (as `direct` already does) instead of quietly adding its steps.
- **The specialists the work needs:** `light-reviewer` always runs; `light-tester` whenever behavior changes; `light-security-reviewer` whenever the change touches auth, personal data, money, migrations, public interfaces or new dependencies. Risk adds these, never removes them.
- **Anyone the request names:** an agent the user asked for, one a `confirmed` rule in `.light-kit/rules.md` requires, or one a plan task names stays until the user agrees to drop it.
- **Who calls agents:** the main session running the request. A subagent cannot re-delegate.

## 4. Decide, don't ask
Choose the roster yourself and give one line of reason. Ask only between genuinely equivalent options, or when only the user knows the fact the choice turns on (`light-approval-summary`).

## 5. Record
- `10-understanding.md`, `## Agent plan`: the baseline roster once, one line per step (`<step>: <agents> — <why>`), then one line per change (`<step>: + light-x — <reason> (after <event>)`, `<step>: - light-y — <reason>`). Keep the lines in order.
- `## Routing`: add a line for a new or repeated step when it is added, and mark a dropped step as skipped; never leave a dropped step looking as if it ran.
- `50-implementation.md`: list roster deviations under Decisions and deviations when they changed the build.
- Each artifact's `runs:` header: the agents that actually ran, in order, with `part:` when several contributed (global rule 12). A skipped agent appears nowhere.
- Tell the user a changed roster in one line when it is not obvious from the request.

## 6. Cost
Add an agent only when it produces something no current step covers and the request needs it now. Skipping is a decision with a reason, not a way to save calls: never skip an agent whose output a later step or the conclusion depends on.
