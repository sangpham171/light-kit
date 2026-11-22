---
request: 052-version-bump-hook
workflow: direct
projects: none
base_branch: feat/051-agent-skill-usage-per-spec
base_commit: 8418c71f2e99d29750507eee75d497dd47f6d1e2
work_branch: feat/052-version-bump-hook
review_turns: 1
review_round: 0
step: request
state: in-progress
version_bump: minor
---

Blockers / pending questions:
- The Claude Code Stop hook must be registered in `.claude/settings.json`, which the kit rules forbid
  the agent to edit; the user adds the provided block.
