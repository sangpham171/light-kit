---
name: review
description: Review the implementation of a request (reviewer, plus tester and security-reviewer when the workflow asks).
argument-hint: "<specs/NNN-slug>"
---

# Review

For `$ARGUMENTS`: read `base_commit` and `work_branch` from its `status.md` to scope the review (`git diff <base_commit>..HEAD`), then run the review step of its workflow using the `review-checklist` skill. Report blockers, should-fix items and a verdict. Do not edit code.
