---
name: light-conversation-capture
description: Capture a request that grew out of a discussion or plan-mode session — every user turn, decision, constraint and rejected option — into 00-request.md before planning or coding.
purpose: structure
---

# Conversation capture

Use when the work follows a conversation: plan mode, questions and answers, several refinements, or a last message that only says "implement", "go ahead" or "do it". The request is the whole exchange; the final message is not the request.

## Capture
Reconstruct the session into `00-request.md`:

- **Every user turn**, in order. Quote it verbatim when short; condense a long turn without changing its meaning, and keep exact names, paths, numbers and wording the user chose.
- **What each turn established**: a requirement, a decision, a constraint, a rejected option, an answer to a question, a correction.
- **Decisions**: what was chosen, why, and which alternatives were rejected. Include the assistant proposal the user accepted.
- **Constraints and preferences**: what the user asked for and what they ruled out.
- **References**: files, tickets, links and code the user pointed at.
- **Still open**: questions not answered, with a proposed default carried into `10-understanding.md`.

Do not invent a turn, a decision or a reason. If part of the exchange is no longer visible, say so under `Still open`.

## Continue the workflow
1. Write `00-request.md` with the sections the template defines.
2. Write `10-understanding.md` from all of it.
3. Write `40-plan.md` before changing code. When the plan was agreed in the conversation, transcribe it task by task, then check it against the code, because the code is the truth.
4. Implement task by task and log in `50-implementation.md`. A decision taken later is appended to the request or the implementation log, not left in the chat.
5. Plan mode's own plan is input: it never replaces `40-plan.md`, and implementing directly never replaces `50-implementation.md`.
