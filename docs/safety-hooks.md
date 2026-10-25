# Safety hooks

Installed by default for every client that supports hooks (use `--no-hooks` to skip). They protect against the common mistakes of agent-driven work, with no stack assumptions built in:

- block reading or editing files that hold secrets, and writing secrets into files or prompts
- block dangerous commands (mass deletion, force push, hard reset, piping downloads into a shell, environment dumps, destructive database statements)
- keep commit messages and pull request text clean: no AI attribution (`Co-Authored-By` an assistant, "Generated with …") and no trailers
- protect version-control internals, the hooks themselves and paths you declare generated or locked
- warn when work starts without an active request, run your format/lint commands after edits, flag secrets in tool output, and give each session its context
- optional: verify before the agent finishes, and an audit log

What is specific to your project (secret file names, secret variable naming, generated paths, format/lint/test commands) lives in `.light-kit/hooks.config.json`, which `/light-init` fills from what it finds in your repo. Hook settings stack per level: user, then workspace, then project.

See `kit/hooks/README.md` for every hook and key. Hooks need Node 18+ on the machine running the AI client.
