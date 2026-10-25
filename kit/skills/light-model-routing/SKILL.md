---
name: light-model-routing
description: Rate the difficulty (easy, medium, hard) of each workflow step and plan task for the request at hand, call each agent with the matching model from .light-kit/models.json, escalate when work fails, and record what ran.
purpose: structure
---

# Model routing

Spend strong models where this request is hard and cheap ones where it is not. Nothing is fixed in advance: agents and workflow steps carry no tier. You rate the work, per request.

## 1. The tier-to-model table
Read `.light-kit/models.json`. When several exist (user, workspace, project), the nearest to the project wins per key; empty values never override. For each tier, use the section of the client you run in (`claude`, `codex`, `copilot`, `cursor`) if it names a model, else the top-level `easy` / `medium` / `hard`. An empty tier means the client's current model: no override, nothing to report.

## 2. Levels
| Level | Fits |
|---|---|
| easy | mechanical or fully specified: one file or function, formatting, docs, config, a test that mirrors its siblings, a bug with a known cause, writing a summary |
| medium | ordinary logic inside one component following existing patterns |
| hard | spans components or projects, unclear requirements, new patterns or architecture, concurrency, data migration, security, auth or money, public interfaces |

When unsure between two levels, take the higher.

## 3. Rate dynamically, from the request
Right after triage, rate **every step of the chosen workflow for this request** and write a `## Routing` section in `10-understanding.md`: one line per step, `step: level — reason` (a few words). Judge each step by what makes it hard here, using the triage scores (scope, ambiguity, risk, novelty, impact):

| Step kind | What drives its difficulty |
|---|---|
| understand, clarify, discover | ambiguity, novelty, scope |
| design, architecture, vision, plan | scope, novelty, impact, risk |
| implement, fix | the plan task's own level; with no plan (as in `direct`), the difficulty of the work itself |
| review, security, verification | risk and scope; never below the strongest tier used for the code under review |
| conclude, documentation | easy, unless the change is large or cross-cutting |

A driving score of 2 points to hard, 1 to medium, all 0 to easy.

- **Plan tasks:** the tech-lead rates each task (`level:` in `40-plan.md`). You may raise a task's level when you read it; never lower one the tech-lead set.
- **Re-rate when facts change:** clarification shows more ambiguity, a design turns out simple, a task escalates. Update the Routing line and carry on. You may lower a step rating you made yourself.
- **Fixes:** the tier of the task being fixed, or higher.

## 4. Invoking
Call the agent with the model for the rating: pass it as the model parameter of the subagent call (it overrides the agent's own setting). Use the name exactly as written in `models.json`. Empty tier: do not pass a model.
- You must be the one calling the agents (the main session that runs `light-request`). If you were started as a subagent that cannot call others, do the work yourself and skip routing.
- If the client has no per-call model choice, or rejects a name, continue on the client's model, say so once in your first progress update, and do not retry for the rest of the request.

## 5. Escalate, never silently
If a task fails its verification twice, or the agent reports it cannot proceed or that the task is harder than rated, rerun it **one tier higher** (up to hard) and keep the failed attempt's findings in the prompt. Never go down on a retry. If hard fails twice, stop and report.

## 6. Record
The Routing section holds the step ratings. In `50-implementation.md`, one short line per task: `task N: level, model (or "client default"), escalations`. Nothing more.
