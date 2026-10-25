---
name: light-review-cycle
description: The review and fix loop between reviewer and developer: finding format, what the developer must fix, how many turns to run, when to stop, and what to escalate.
purpose: structure
---

# Review cycle

## Turns
A **turn** is one review followed by the developer's fixes. The number of turns is **Review turns** in `.light-kit/project-profile.md` (default **1**; an integer of 1 or more), unless the user gave `--review-turns N` for this request. Record it as `review_turns` in `status.md` and the current round as `review_round`.

- Turn 1: reviewer (with tester and security-reviewer when the workflow has them) reviews; the developer fixes.
- Turn 2 and later: the reviewer reviews **the fixes** (verifying earlier findings and catching regressions); the developer fixes again.
- **Stop early** when a review has no blocker and no should-fix finding (verdict `approve`).
- After the last turn, no further review is requested. The tester's verification still has to pass.

## Findings (reviewer, security-reviewer, tester)
Write each round under `## Review rounds` in `50-implementation.md`, as `### Round n of N`, one line per finding:
```
- F-<round>.<n> [blocker|should-fix|nit] <path:line> — <problem> — suggested fix: <…> — status: open
```
End the round with `Verdict: approve` or `Verdict: changes requested`. In rounds after the first, first mark each earlier finding `confirmed fixed` or `still open`, and only then add new ones. Never edit code.

## Fixes (developer)
- Every **blocker** and **should-fix** must be fixed. **Nits**: fix them when trivial; otherwise decline with a reason.
- One commit per finding or per coherent group (see the `light-commit` skill), then set `status: fixed (<short hash>)`. Rerun the affected verification.
- A finding may be `declined (<reason>)` only when it is wrong or contradicts the spec, and `deferred (<reason>)` only when fixing it exceeds this request. Both need the reviewer's agreement in the next round, or the user's if there is no next round.
- Run the `light-tech-debt` check again if fixes added code.

## Escalate
If turns are used up and a blocker or should-fix is still `open`, `declined` or `deferred`, do not call the work done. List those findings in `60-conclusion.md`, tell the user plainly, and let them decide: another turn, accept, or follow-up request.
