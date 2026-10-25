# light-kit hooks

Automatic guardrails that run inside your AI client. One script (`run.mjs`) serves every client; each client's hook file just calls it with `--client` and `--event`. Requires Node 18+ on the machine running the client. Internal errors never block the agent.

## What they do
| Hook | Event | Default | Purpose |
|---|---|---|---|
| `protect-sensitive-files` | before a tool runs | block | No reading or editing files that hold secrets (including via shell commands). Templates are allowed. |
| `block-secrets-in-writes` | before a file is written | block | Reject content that contains secrets (keys, credentials in URLs, token assignments, long random tokens). |
| `redact-prompt-secrets` | prompt submitted | block | Stop secrets from being sent to the model. |
| `guard-dangerous-commands` | before a shell command | block | Mass deletion, force push, hard reset, piping downloads into a shell, destructive database statements, environment dumps, printing secret variables, skipping verification. |
| `protect-paths` | before a write or mutating command | block | Version-control internals, hook files, and paths you declare protected. |
| `protect-branches` | before a shell command | block | No `git commit`, `merge`, `cherry-pick` or `revert` on a protected branch (`main`, `master`, `trunk`, `develop`, `production`, `release/*`, the remote default, plus yours). Work on a branch instead. |
| `clean-commit-message` | before a shell command | block | No AI attribution in commit messages or pull request text (`Co-Authored-By` an assistant, "Generated with …" credits, AI sign-offs), also when the message comes from a file. Human co-authors are fine. |
| `audit-reminder` | session start | warn | Once per model: when the model in use differs from the one the kit was last audited with, suggest running `light-audit`. Silent for clients that do not report a model. |
| `require-spec` | before a write | warn | Remind the agent to start a request before changing code. |
| `post-edit-quality` | after a write | warn | Run your format and lint commands on the edited file. |
| `warn-secret-output` | after a tool | warn | Tell the agent when output contains a secret. |
| `session-context` | session start | warn | Point the agent at the profile, the codebase map and the active request. |
| `commit-checkpoint` | after a write | warn | When many files are uncommitted, remind the agent to commit the finished unit (see the `light-commit` skill). |
| `verify-on-stop` | agent finishing | off | Run your verify command; if it fails, make the agent keep working (once). |
| `audit-log` | tool use | off | Append redacted tool activity to `.light-kit/audit.log`. |

`warn` means "tell the agent and continue". `off` disables a hook.

## Make them fit your project
Edit `.light-kit/hooks.config.json` (the `light-init` command does this for you, using the `light-hooks-config` skill). Lists in the config **add to** the built-in defaults.

| Key | Purpose |
|---|---|
| `hooks.<name>` | `block`, `warn` or `off` |
| `sensitive.extraFiles` / `sensitive.allow` | globs for more sensitive files / safe templates |
| `sensitive.extraEnvKeywords` | words that mark an environment variable as secret |
| `secrets.extraPatterns` | extra regexes for your own credential formats |
| `commands.extraDeny` / `commands.allow` | regexes for extra blocked commands / exceptions |
| `protect.paths` | globs for generated, vendored or locked paths |
| `spec.exempt` | globs that may change without an active request |
| `quality.format` / `quality.lint` | commands for one file; `{file}` is replaced by its path |
| `verify.command` | one command that verifies the whole project |
| `branches.protected` | globs for more protected branches |
| `commit.extraForbiddenText` | extra regexes that must not appear in commit or PR text |
| `commit.maxUncommittedFiles` | uncommitted-file count that triggers the commit reminder (default 8) |
| `audit.remind` | `false` stops the once-per-model audit reminder |
| `audit.file` | log location |

Globs without `/` match file names anywhere; globs with `/` match from the project root.

## Workspaces
Installed once at a workspace root, the hooks serve every project below it. Settings are layered: `.light-kit/hooks.config.json` at the root, then `<project>/.light-kit/hooks.config.json` for the project the action is about (found from the file being edited, or the session's folder). Lists add up; the nearer layer wins for modes and commands. Format and lint commands run inside the project's folder, verify commands run per project that has changes, git checks look at the repository of the folder concerned, and requests are looked up in the project's `specs/` and the workspace's.

## User level
Installed in the home folder, the hooks run in every project. The safety hooks (sensitive files, secrets, dangerous commands, protected paths, clean commit messages) apply everywhere. The workflow hooks (`require-spec`, `commit-checkpoint`, `protect-branches`, and the session reminders) apply only in projects that have their own `.light-kit/`, so your other repositories are left alone; in a project without one, session start suggests running `light-init` (turn that off with `session.suggestInit: false`). Layers: `~/.light-kit/hooks.config.json`, then each folder with a `.light-kit` on the way down to the project.

## Client support
Claude Code (`.claude/settings.json`), Codex (`.codex/hooks.json`; run `/hooks` once to trust them), Cursor (`.cursor/hooks.json`) and Copilot (`.github/hooks/light-kit.json`; no stop hook). Your own hooks in those files are kept. Blocking uses exit code 2 with the reason on stderr.
