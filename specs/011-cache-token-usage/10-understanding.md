---
runs:
  - step: understand
    agent: light-orchestrator
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
---

# Understanding

## Restatement
Record cache read and cache write alongside input and output, in the step section, the conclusion table and the hook's note, so the kit's figures line up with what the client's `/usage` shows.

## The mismatch
`usageFromTranscript` already reads `cache_read_input_tokens` and `cache_creation_input_tokens`, but folds both into `input` and drops them from the totals it stores. For this session the client reports `63.2k input, 4.4m cache read, 36.7k output` while the kit reports about `4.0M input` — the kit's input is the client's input plus its cache reads. The transcript confirms it: 68 messages, 66,918 fresh input, 4,522,368 cache read, 0 cache write.

## Requirements
1. `input` means uncached prompt tokens only; cache read and cache write are reported separately. The total is their sum plus output.
2. The step line reads `Tokens: 63,200 input · 4,400,000 cache read · 1,100 cache write · 36,700 output · 4,501,000 total`, one line, thousands grouped.
3. The conclusion table gains `Cache read` and `Cache write` columns, in the order `Step | Input | Cache read | Cache write | Output | Total | Time`, with the total row.
4. The hook note and its copyable table carry the same figures.
5. A state file from the previous definition restarts, so an input that included cache reads is never compared with one that does not.
6. Clients that expose no usage keep `Tokens: unknown` and `Time: unknown`.

## Acceptance criteria
- A transcript with 10 fresh input, 2 cache write, 3 cache read and 4 output yields input 10, cacheRead 3, cacheWrite 2, output 4, total 19.
- The suggested line and both table rows show the five figures in the order above.
- A v2 state file restarts instead of producing a negative or clamped delta.
- `npm test` passes; `docs/usage.md` and `kit/hooks/README.md` state the new meaning of input.

## In scope / Out of scope
In: the usage reader, the hook note and table, the conclusion template, the six step templates' documented shape, docs, tests, this request's own artifacts.
Out: a cache-hit percentage (derivable, and two more numbers would crowd the table), readers for other clients (still follow-ups), rewriting older artifacts.

## Triage
Scores: scope 2, ambiguity 1, risk 1, novelty 1, impact 1 (total 6)
Workflow: standard
Why: four figures replace one across the reader, the note, the templates and the docs, and the change of meaning needs a state migration; no security surface.

## Routing
- discover: easy — reader, note, templates, docs, tests.
- plan: easy.
- implement: medium — metric change plus state migration.
- verify-and-review: medium — arithmetic invariants and backward compatibility.
- conclude: medium — recompute this request's own figures.

## Token usage
Tokens: 103,915 input · 813 output · 104,728 total
Time: 5s
