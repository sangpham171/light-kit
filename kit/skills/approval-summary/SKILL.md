---
name: approval-summary
description: When to ask the user to decide (only between equivalent options, or for a fact only they have) and how to present it: short, plain, functional, trade-offs as a comparison table.
---

# Deciding with the user

## When to ask, and when not
**Decide yourself.** Pick the best option, write it in the artifact with a one-line reason (`Decisions` or `Assumptions`), mention important picks in one line of your progress update, and carry on. The user can always overrule.

**Ask only when:**
1. **Two or more options are genuinely equivalent**: no clear winner on the aspects that matter, so the choice depends on the user's preference or priorities; or
2. **A fact only the user has** is missing and no safe default exists (what the product is for, which environment to touch, a business rule that cannot be inferred).

Never ask for approval of a plan, design or summary "to be safe", and never ask about something you can judge. Several decisions to ask at once go in one message.

## How to ask (people stop reading long text)
1. **One screen.** About 10 lines plus at most one table; lists of at most 5 items. Details stay in the artifact; end with its path.
2. **Functional first.** What users or the business get, can do or lose, in everyday words. No file names, layers, patterns or acronyms unless a technical trade-off needs them; explain an unavoidable one in five words. The bigger the project, the higher the level: capabilities and user journeys, not components.
3. **One decision per question,** answerable by picking an option, with your recommendation and the default you take if the user does not care.
4. **Trade-offs go in a table,** functional or technical, never in prose:
   - 2 or 3 options as columns, aspects as rows, the **same aspects for every option**.
   - 3 to 6 aspects that matter for this choice, from: what users get, effort or time, cost, risk, maintenance, flexibility or growth, ease of undoing, consistency with what exists, performance, security.
   - Cells are 8 words or fewer. Mark the option you lean towards and give one line why.

## Format
```
**Decision needed: <title>.**
**Context:** <one or two lines, everyday words>
| | A. <name> | B. <name> |
|---|---|---|
| What users get | … | … |
| Effort | … | … |
| Risk | … | … |
→ I lean towards A: <one line why>. Default if you don't mind: A.
Details: <path>
```
Drop any line that has nothing to say.

## Writing for humans
The same plain, functional style applies to progress updates, the init assessment summary and the top of `60-conclusion.md`: lead with what changed for users, then what is left, if anything.
