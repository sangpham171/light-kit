---
name: light-brainstorm
description: Explore an idea in several independent directions before it becomes a request — surfaces options, edge cases, risks and cases the user did not mention. This is the method the light-brainstormer agent applies; use it when the user asks to brainstorm or think through an idea.
purpose: compensation
---

# Brainstorm

Goal: widen the idea before narrowing it. Do not accept the user's first framing and do not propose the first plausible solution.

## 1. Frame the idea
Restate it as a problem, not a solution:
- the job to be done, in the user's own terms;
- who has the problem, and who else is affected without being a user;
- what success looks like, in observable terms;
- constraints and non-goals the user stated;
- assumptions hidden in the wording, each marked verified, unknown or merely believed.

Ask at most three questions that would change the direction, in one message, each with a proposed default. If the user gave enough to start, start.

## 2. Diverge
Run each direction as its own pass and keep the passes independent: one pass must not close another. Generate first, judge afterwards. When the client can run subagents, run passes in parallel and merge the findings; otherwise run them one after another.

| Direction | Force out |
|---|---|
| Actors | Who creates, uses, operates, supports, pays for, regulates or attacks it. Who is affected without being a user. |
| Journey and lifecycle | First run, routine use, error and recovery, handover, upgrade, archiving, deletion, exit. Long-running and time-zone cases. |
| Alternatives | Other ways to do the job, including manual work, an existing tool, doing nothing, build versus integrate. |
| Solution shape | Manual, assisted or automatic; local or central; sync or async; push or pull; single or multi-tenant; stateful or stateless; batch or stream. |
| Scale and cost | 0.1x and 10x user, data, frequency and latency; zero budget and unlimited budget; the cost of being wrong. |
| Failure and misuse | Pre-mortem: why would this fail? Legitimate misuse, attack, partial failure, duplicate actions, stale data, data loss, permissions, compliance. |
| Second-order effects | Support load, maintenance, lock-in, incentives, adjacent teams, migration and backward compatibility, what people do differently once it exists. |
| Precedent | Similar features in this codebase and earlier requests; other products or domains solving the same job, and what they learned. |

Push each pass with these techniques:
- **Inversion** — ask how to make the idea fail, then invert each cause into a requirement or a guard.
- **Assumption inventory** — for each assumption, write what would falsify it and the cheapest way to test that.
- **Constraint shift** — remove the dominant constraint; then add one (no network, no money, one week, must be reversible).
- **Analogy** — how would a library, a bank or an airport solve this job?

Then list the cases absent from the user's wording: empty state, first run, concurrency, permissions, offline, migration, deletion, failure recovery, abuse, accessibility, localization, observability. Mark each relevant, not relevant, or unknown, with the reason.

Stop when a new pass stops producing new cases; say where you stopped.

## 3. Converge
Only after divergence:
- cluster the findings into 2–4 genuinely distinct options, not variants of one;
- for each option give what it makes easy, what it makes hard, cost and risk, reversibility, and the evidence still missing;
- compare against the framing's success criteria and constraints, and state the trade-off rather than only a winner;
- when evidence is missing, prefer the smallest reversible experiment and name the assumption it tests;
- mark the decisions that are expensive to reverse and need the user.

Never present an option as obvious, and never rank a case as a risk without a concrete trigger and consequence.

## 4. Write the idea map
Write the map to `brainstorms/<YYYY-MM-DD>-<slug>.md`, using `.light-kit/templates/brainstorm.md` as the skeleton: each round is a `## Round N — <date>` section with the map sections under it as `###`. Create `brainstorms/` when it does not exist. Before writing, list `brainstorms/` and look for an existing file whose slug or title matches the idea, even from an earlier date; append a new round to that file instead of creating a second one. Always write the file before replying; never return the map only in the chat. In a multi-project workspace use the root of the project under discussion; for a cross-project idea use the workspace root.

The map holds:
- **Framing** — job, affected people, success, constraints.
- **Directions** — one row per direction: what it surfaced, and the options it suggests.
- **Cases the user did not mention** — ranked by impact × uncertainty, each with a proposed default.
- **Options** — the distinct options with their trade-offs, evidence needed and a recommendation.
- **Assumptions** — what is believed, and the cheapest way to verify or falsify it.
- **Open questions** — only those that change the decision, each with a proposed default.
- **Next step** — the step you recommend (a spike, a question to the user, or a request) and why.

If a request folder is active, add one bullet under `### References` in its `00-request.md` (add the section if it is missing), only if the line is not already there: `- Brainstorm: brainstorms/...`, with the path from the repository root or the workspace root for a cross-project idea. Do not copy the map into `specs/`. Otherwise give the path and offer to open a request with `light-request`. Keep the reply to the path and the few decisions that need the user.

## Rules
- Brainstorming is pre-planning: do not edit code, write plan tasks or commit to scope. The user decides, or `light-request` triages.
- Read the code when the idea depends on it; never invent facts about the codebase.
- Keep unknowns unknown. A case without evidence is a question, not a requirement.
- Keep the map compact: one screen per section, bullets and tables, no filler.
