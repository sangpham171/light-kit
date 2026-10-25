# Commits and branches

The agent commits as it goes, so history stays reviewable (`light-commit` skill, set up by `/light-init`):

- the plan is committed once validated, **before** implementation starts; understanding and design are committed once settled
- one commit per verified plan task, one per review fix, one for the conclusion
- only the files of each unit are staged, messages follow your convention (Conventional Commits by default) and contain only the change description (no trailers, no AI attribution: the instructions forbid it, a hook blocks it, and for Claude Code the installer switches off its own `attribution` setting unless you set one), and nothing is ever pushed
- at the start of a request the agent records the base branch and base commit in `status.md` (so reviewers know exactly where to start: `git diff <base_commit>..HEAD`), and if you are on `main`, `master` or another protected branch it first moves to a new `<type>/<NNN-slug>` branch; a hook refuses commits on protected branches
- `Mode: auto | ask | off` in `.light-kit/project-profile.md` controls it; a hook reminds the agent when too many files pile up uncommitted
