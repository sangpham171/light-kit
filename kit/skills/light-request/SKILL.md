---
name: light-request
description: Start a new light-kit request — create the specs folder, record it, triage it and run the matching workflow end to end. Use when the user asks for a feature, fix or change to be planned and implemented.
purpose: structure
---

# Request

Act as the **light-orchestrator** agent for the request in the user's message.

Create the next `specs/NNN-slug/` folder, then follow the orchestrator instructions: record the request, write the understanding, triage, and execute the workflow. If the request contains `--workflow direct|standard|full`, use that workflow instead of the triage result; if it contains `--review-turns N`, use that many review turns. Ask the user only at the gates and blocking questions that the workflow defines.
