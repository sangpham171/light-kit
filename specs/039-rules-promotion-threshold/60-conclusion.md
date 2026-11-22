---
step: conclude
runs:
  - agent: light-orchestrator
    part: conclusion
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  - step: 00-request
    tokens: 43,176 input · 465,280 cache read · 0 cache write · 7,850 output · 516,306 total
    time: 1m 28s
  - step: 10-understanding
    tokens: 2,335 input · 99,968 cache read · 0 cache write · 1,726 output · 104,029 total
    time: 10s
  - step: 40-plan
    tokens: 1,330 input · 272,384 cache read · 0 cache write · 1,552 output · 275,266 total
    time: 13s
  - step: 50-implementation
    tokens: 15,782 input · 764,288 cache read · 0 cache write · 4,196 output · 784,266 total
    time: 5m 7s
  - step: 60-conclusion
    tokens: 2,950 input · 151,424 cache read · 0 cache write · 856 output · 155,230 total
    time: 1m 55s
  - step: total
    tokens: 65,573 input · 1,753,344 cache read · 0 cache write · 16,180 output · 1,835,097 total
    time: 8m 55s
---

# Conclusion

## Summary
The number of violations that promotes a `pending` rule to `confirmed` is now a per-project setting: `Promotion threshold: <integer >= 1>` under `## Rules` in `.light-kit/project-profile.md`. Missing, non-numeric or lower-than-1 values fall back to 3, so existing projects behave exactly as before. The rules templates, the `light-rules` skill, the core instructions, the user docs and the tests all read the setting instead of a bare 3.

## What changed
- `kit/templates/project-profile.md`, `.light-kit/project-profile.md` — the new `## Rules` section with the commented default.
- `kit/skills/light-rules/SKILL.md` — reads the threshold before applying and promoting a rule; the at-a-glance table is threshold-relative (`0 to N-1` / `N or more`).
- `kit/templates/rules.md`, `.light-kit/rules.md` — promotion described by the profile threshold (default 3) in the state table, the count paragraph and the after-task step.
- `kit/instructions/core.md` — rule 15 and the project-knowledge bullet point at the profile threshold.
- `docs/usage.md` — where to set it, the default, the fallback and the manual edit for existing profiles.
- `tests/kit.test.mjs` — pins the setting, the references and a broadened no-fixed-3 guard.

Range: `caf09d19938b273b0bdb3a9bb910cbe85f5bc1c8..a74c795` on `feat/039-rules-promotion-threshold`

## Verification evidence
- `node --test tests/kit.test.mjs` — 24 pass, 0 fail (each source task).
- `npm test` — 183 pass, 0 fail, including the fix round.
- The broadened guard matches no kit source and no file of a full multi-client temp install.
- Review round 1: one should-fix (ambiguous fallback wording) and one nit (narrow guard), both fixed and re-verified.

## Deferred technical debt and open findings
- Existing `.light-kit/rules.md` seeds keep the old literal-3 prose after an upgrade, because installs never overwrite user-owned files; `docs/usage.md` explains the edit. Optional follow-up: a `light-standardize` item that refreshes the paragraph.
- The threshold is instruction-only; no hook validates a malformed value. Out of scope for this request; a profile check in the safety hooks is the natural follow-up.
- No review finding remains open.

## Follow-ups
- Use a hook to validate the profile value if malformed thresholds prove to happen.
- After this change, a project can set `Promotion threshold: 1` for strict mode or a higher number for a lenient one.
