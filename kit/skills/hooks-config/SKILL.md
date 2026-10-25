---
name: hooks-config
description: Adapt the safety hooks to this project by filling .light-kit/hooks.config.json from what the project actually uses.
---

# Hooks config

The hooks ship with stack-neutral defaults. Your job is to add what is specific to **this** project, discovered from the repo, never guessed. Edit only `.light-kit/hooks.config.json`; never edit the hook scripts.

## Layers
Hook settings stack from the outside in: your user-wide `~/.light-kit/hooks.config.json` (only when the kit is installed for your user), then a workspace's, then the project's. Lists add up; the nearer layer wins for modes and commands. A project's file only needs what is specific to that project.

## Workspaces (several projects)
Config is layered: `.light-kit/hooks.config.json` at the workspace root holds what applies to **every** project (secret-looking content, protected branches, commit reminders, modes). Each project's `<project>/.light-kit/hooks.config.json` holds what is specific to **its** stack (its sensitive files, secret variable names, generated paths, format / lint / verify commands). Lists add up; the nearer layer wins for modes and commands. Fill each project's file from that project only; never copy one project's entries into another. Paths and globs in a project file are relative to the workspace root, so prefix them with the project folder.

## Discover, then fill
Ask yourself each question, answer it from the repo (manifests, scripts, CI, docs, ignore files), If an answer is uncertain, leave that key empty rather than guess, and note what you could not determine in your report.

| Question | Config key |
|---|---|
| Where does this project keep local configuration and credentials, and what are those files called? Look at what the version-control ignore file excludes and at the setup docs. | `sensitive.extraFiles` (globs) |
| Which of those are safe templates that may be read and committed? | `sensitive.allow` |
| How are secret environment variables named here (prefixes, suffixes, conventions of the framework in use)? | `sensitive.extraEnvKeywords` |
| Are there credential formats specific to the services this project talks to? | `secrets.extraPatterns` (regexes) |
| Which paths are generated, vendored, locked or build output, so should never be hand-edited? | `protect.paths` |
| Which commands are dangerous for this project (deploy, migrate, publish, data reset)? | `commands.extraDeny` (regexes) |
| Which otherwise-blocked commands does the project legitimately need? | `commands.allow` |
| What formats or lints a single file? Use `{file}` for the path. | `quality.format`, `quality.lint` |
| What one command verifies the whole project (tests, build)? | `verify.command` |
| Which branches must never receive direct commits (long-lived, release, deployment branches)? | `branches.protected` (globs, added to the defaults) |
| Which source-adjacent paths may change without a request? | `spec.exempt` |

## Modes
Each hook in `hooks` is `block` (deny the action), `warn` (tell the agent, allow it) or `off`.
- Defaults: sensitive files, secret writes, secret prompts, dangerous commands and protected paths block; `require-spec`, post-edit quality, secret-in-output, commit reminders and session context warn; `verify-on-stop` and `audit-log` are off.
- Suggest `verify-on-stop: block` only once `verify.command` is fast and reliable. When enabling `audit-log`, add `.light-kit/audit.log` to the project's ignore file.
- For a brownfield project with many false positives, start with `warn` and tighten later.

## Rules
- Only add entries you verified exist or are conventional in this repo. Leave a list empty rather than guess.
- Keep regexes simple and test them against one real example.
- Tell the user what you added and why, in a short list. Remind them they own this file and kit upgrades never overwrite it.
