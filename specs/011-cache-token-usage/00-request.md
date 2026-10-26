---
runs:
  - step: request
    agent: light-orchestrator
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
---

# Request 011 — Cache read and cache write in token usage

Date: 2026-10-26
Requested by: light

## Original request
I want to add token cache hit or read and/or write in token usage templates

Context the user supplied from `/usage` for this session:
```
deepseek-flash:     47.2k input, 29.4k output, 1.1m cache read, 0 cache write
deepseek-flash[1m]: 63.2k input, 36.7k output, 4.4m cache read, 0 cache write
Prompt cache (main): 66 requests · 99% of input tokens from cache
```
The kit's own figures for the same session report about 4.0M `input`, because it adds cache reads into input.

## Token usage
Tokens: 478,287 input · 5,652 output · 483,939 total
Time: 12m 2s
