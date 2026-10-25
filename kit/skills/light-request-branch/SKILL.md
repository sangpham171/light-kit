---
name: light-request-branch
description: At the start of a request, record the git starting point (branch and commit) in status.md and move off a protected branch onto a work branch. Use before the first commit or any implementation.
---

# Request branch

Two jobs, done once when a request starts (and re-checked when it resumes): **record where the work starts**, and **never work on a protected branch**.

Skip both, and write `none` in the fields, if the project is not a git repository.

## 1. Record the starting point
Before creating the request's first commit, put these in `status.md` front matter:
- `base_branch` — the branch you were on (`git branch --show-current`; `detached` if none).
- `base_commit` — the full hash of `HEAD` right now (`git rev-parse HEAD`). Use `none` if the repository has no commit yet.
- `work_branch` — the branch the work will happen on (step 2).

Reviewers use `base_commit` to find exactly what this request changed: `git log <base_commit>..HEAD` and `git diff <base_commit>..HEAD`. The hash must be the fork point, so record it **before** any commit of this request and before switching branches.

## 2. Work on a safe branch
**Protected branches:** `main`, `master`, `trunk`, `develop`, `production`, `release/*`, the remote's default branch (`git symbolic-ref --short refs/remotes/origin/HEAD`, without the remote prefix), plus `branches.protected` in `.light-kit/hooks.config.json`.

- On a protected branch, or on a detached `HEAD`: create and switch to a new branch **before the first commit and before any implementation**: `git checkout -b <name>`. Uncommitted changes simply come along; never stash, reset or discard anything.
- On any other branch: keep it. `work_branch` = the current branch.
- A repository with no commit yet has nothing to protect: stay put (the first commit of a new project may go on its initial branch).

**Name:** follow the *Branch convention* in `.light-kit/project-profile.md`. Default: `<type>/<NNN-slug>` with `type` one of `feat`, `fix`, `docs`, `chore`, `refactor` chosen from the request (for example `feat/007-export-report`). If the name already exists, check that it is this request's own branch (it holds the request folder) and switch to it; otherwise add a numeric suffix.

Tell the user in one line which branch you created or kept, and the base commit's short hash.

## Several repositories
In a workspace the request may touch projects that are separate repositories. Do steps 1 and 2 **in each repository involved** (find it with `git -C <project> rev-parse --show-toplevel`; projects sharing a repository count once). One repository: use the plain fields above. Several: replace the three fields with one line of JSON in `status.md`:
`repos: {"api": {"base_branch": "main", "base_commit": "<hash>", "work_branch": "feat/007-x"}, "web": {...}}`
keyed by the repository's folder relative to the workspace. Create the work branch in every repository that will receive commits, using the same branch name.

## 3. Resuming
When continuing an existing request, read `status.md`. If the current branch is not `work_branch`, switch to it when the working tree is clean; if it is not clean, ask the user.

## Rules
- Never delete, rename or force-move branches. Never push.
- Keep `status.md` accurate if the branch ever changes, and commit that update with the next checkpoint.
