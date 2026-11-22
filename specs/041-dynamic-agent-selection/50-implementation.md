---
step: implement
runs:
  - agent: light-developer
    part: implementation
    model: deepseek-flash[1m]
    thinking: unknown
    level: medium
usage:
  tokens: 15,632 input · 4,405,632 cache read · 0 cache write · 29,608 output · 4,450,872 total
  time: 6m 55s
---

# Implementation log

## Tasks
- Task 1 — `feat(kit): add the agent selection skill` (`9caf8b2`): `kit/skills/light-agent-selection/SKILL.md` defines the re-evaluation triggers, the six allowed moves, the never-change list, and the recording rules.
- Task 2 — `feat(kit): let the orchestrator adapt the agent roster` (`db76e22`): the orchestrator applies the skill before each step and on changed facts, keeps `## Agent plan` current, and the core `## Roles` paragraph states the baseline rule for every client.
- Task 3 — `docs(kit): mark workflow agents as a baseline` (`f1a05b4`): all five workflow files carry the baseline sentence, and `10-understanding.md` gains `## Agent plan`.
- Task 4 — `docs(kit): document dynamic agent selection` (`f1ba037`): the routing skill separates agent choice from model choice and rates a step added mid-request; `docs/usage.md` describes the dynamic roster.
- Task 5 — `test(kit): cover dynamic agent selection` (`a3b874d`): one test checks the skill, its generation for every client, the orchestrator and core wiring, the template, all workflows, the routing cross-reference and the usage doc, and re-runs the kit lint.

## Decisions and deviations
- The method lives in a new `light-agent-selection` skill rather than inline orchestrator prose. Reason: it is a reusable method with its own rules, and the orchestrator stays a short pointer, as with its other skills.
- Workflow prose never writes `agent:`/`agents:` followed by a word, so `tools/build.mjs:76` keeps treating those tokens as real agent declarations and unknown names still fail lint; the baseline sentence says "the agents and steps named below".
- Added `## Agent plan` to `10-understanding.md` instead of a `status.md` field. Reason: it is the same kind of per-request planning record as `## Routing`, and `status.md` stays a state file. An added step is also rated in `## Routing`, so the two sections answer different questions (who vs which model).
- The never-change list keeps `direct` lean: its missing discovery/design is fixed, and a request that outgrows it still escalates the workflow rather than adding those steps silently.
- `standardize` keeps its own rules (backlog only, stop-and-skip, debt limits); the baseline sentence says "within the rules below".
- One addition beyond the plan: `docs/model-routing.md` now states the who-runs/which-model split, so the two user docs agree; added with the round 1 fixes.

## Verification (commands run and results)
- Task 1: `node -e` loaded the kit — skill found, `purpose: structure`, `lint` returned `[]`.
- Task 2: `node -e` — lint clean; orchestrator has the baseline rule and `light-agent-selection`; core mentions the skill. `node --test tests/kit.test.mjs` — 24 pass.
- Task 3: `node -e` — lint clean; all five workflows carry the baseline sentence; the template has `## Agent plan`. `node --test tests/kit.test.mjs` — 24 pass.
- Task 4: `npm test` — 194 pass, 0 fail; `light-agent-selection` appears twice in the routing skill and once in `docs/usage.md`.
- Task 5: `node --test tests/kit.test.mjs` — 25 pass; `npm test` — 195 pass, 0 fail.
- Round 1 fixes: `node --test tests/kit.test.mjs` — 25 pass; `node --test tests/models.test.mjs` — 5 pass; `npm test` — 195 pass, 0 fail.

## Technical debt
- TD-1 introduced: `## Agent plan` and `## Routing` are two per-request sections that must stay in step; nothing validates them at runtime. Status: accepted — they are agent instructions, not executable state, and the skill tells the orchestrator to update both.
- TD-2 introduced: the baseline sentence is repeated in five workflow files. Status: accepted — each workflow is read standalone and its own file is the source; the kit does no cross-file templating for workflows.
- TD-3 introduced: an existing installed project sees `## Agent plan` only after the kit is reinstalled, because the template copy is refreshed by the installer. Status: accepted — the same holds for every template change, and 040's update path covers the rest of `.light-kit/`.
- TD-4 introduced: the never-change and recording rules are enforced by instruction text, not a runtime check; the test covers the wiring and the key clauses but cannot prove an orchestrator follows them. Status: accepted — this is instruction content, and round 1 strengthened the clauses the test watches (F-1.4).
- Earlier open debt checked: 036's deferred brainstorm-map header, 039's literal-3 prose for existing rules files (TD-1) and the missing threshold validation in hooks, and 040's accepted merge/format items are untouched by this change and remain open or accepted as recorded. R-001 (`pending`) applied; no violation. rules: no change.

## Review rounds

### Round 1 of 1
- F-1.1 [should-fix] `kit/skills/light-agent-selection/SKILL.md:29` — the mandatory list said every workflow keeps `understand`, but `standardize` starts at `plan` and uses its assessment instead; `docs/usage.md:32` and the test repeated it. — suggested fix: scope the rule to the workflow's own required steps and name the `standardize` exception. — status: fixed (`9b35c35`)
- F-1.2 [should-fix] `kit/skills/light-agent-selection/SKILL.md:30` — "`light-tester` whenever behavior changes" was unconditional, but `direct` has no tester, so it contradicted the lean direct workflow. — suggested fix: forbid dropping the tester a workflow has, not require one everywhere. — status: fixed (`9b35c35`)
- F-1.3 [should-fix] `kit/skills/light-agent-selection/SKILL.md:22` — the "Add a step" example could add discovery/design to `direct` or `standardize`, contradicting the guards. — suggested fix: carve out `direct` (escalate) and `standardize` (keep its assessment). — status: fixed (`9b35c35`)
- F-1.4 [should-fix] `tests/kit.test.mjs:197-215` — the test checked wording fragments but not the orchestrator triggers, the routing timing, the user/confirmed-rule guard or the template change shape. — suggested fix: assert those clauses. — status: fixed (`8b79890`)
- F-1.5 [nit] workflow baseline sentences (`kit/workflows/*.md:11`, `kit/instructions/core.md:38`) — said the orchestrator may reorder "them" (agents only), while the skill allows step moves too. — suggested fix: say "agents and steps". — status: fixed (`9b35c35`)
- F-1.6 [nit] `kit/skills/light-agent-selection/SKILL.md:39` — a split removed the original step while its Routing line looked as if it ran. — suggested fix: mark it split and rate both new steps. — status: fixed (`9b35c35`)
- F-1.7 [nit] `50-implementation.md:38-41` — the debt section did not cover the test's prose-only enforcement. — suggested fix: strengthen the test or record the debt. — status: fixed (`8b79890`, TD-4 added)
- Found in the same pass, not a reviewer finding: `docs/model-routing.md` did not state the who-runs/which-model split. — fixed in `47367e1`.

Verdict: changes requested; every finding is fixed above. The review budget (1 turn) is spent, so no second review.
