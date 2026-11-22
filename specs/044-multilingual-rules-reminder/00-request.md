---
step: request
runs:
  - agent: light-orchestrator
    part: request capture
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 2,681 input · 995,584 cache read · 0 cache write · 10,095 output · 1,008,360 total
  time: 4m 17s
---

# Request 044 — Multilingual rules reminder

Date: 2026-11-22
Requested by: the user

## Original request
> what if user request doesn't in english ? the DEFECT in rules-reminder will not work

## Conversation context
A follow-up question after request 043: the user selected the `DEFECT` pattern in `kit/hooks/checks/rules-reminder.mjs` and pointed out that it only matches English. A non-English defect report would pass the hook silently.

### Decisions
- Make the pattern list configurable: `rules.extraDefectPatterns` in `.light-kit/hooks.config.json`, compiled with the existing `regexes` helper so a project can add any language. Reason: the built-in heuristics cannot cover every language, and the kit already extends built-in patterns this way.
- Add a built-in Vietnamese starter set (`lỗi`, `hỏng`, `không hoạt động`, `không chạy`, `vẫn không`, `sập`, `thất bại`, `bị lỗi`). Reason: the reported case is Vietnamese, the hook is advisory so the cost of a false positive is low, and it proves the hook works outside English.
- Keep the instructions language-independent: `light-rules` tells the agent to record a user-reported defect in any language; the hook is only a reminder and may miss. Reason: the hook cannot be the only safety net.
- Document the limit and the config example. Reason: an English-only default that is not stated is a trap.

### Constraints and preferences
- No dependency; the hook stays advisory (`warn`) and silent without `.light-kit/rules.md`.
- An invalid user regex must not break the hook (drop it, as `regexes` already does).
- The built-in Vietnamese words must not fire on a plain feature request such as "thêm nút xuất".

### Still open
- None. Other languages are supported through the config; no built-in set beyond English and Vietnamese is assumed.
