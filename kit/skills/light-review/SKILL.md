---
name: light-review
description: Review the implementation of a request — reviewer, plus tester and security-reviewer when the workflow asks — and report blockers, should-fix items and a verdict. Use when a request's implementation is ready for review.
purpose: structure
---

# Review

For the request folder named in the request (a `specs/NNN-slug` path; if none is named, use the active request in `specs/*/status.md`): read `base_commit` and `work_branch` from its `status.md` to scope the review (`git diff <base_commit>..HEAD`), then run the review step of its workflow using the `light-review-checklist` skill. Report blockers, should-fix items and a verdict. Do not edit code.
