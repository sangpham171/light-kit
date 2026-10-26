import { readFileSync } from 'node:fs';

// Token usage from a client's session record. Like `effort.mjs`, every reader is best-effort:
// an absent or unreadable file yields zeros, never an error.

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

// Claude Code writes one `usage` object per assistant turn in the session transcript.
// `input` is the whole prompt (fresh + cache write + cache read), the number the client processed.
export function usageFromTranscript(file) {
  const usage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, calls: 0 };
  if (!file) return usage;
  try {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      if (!line.trim()) continue;
      let entry;
      try { entry = JSON.parse(line); } catch { continue; }
      if (entry?.type !== 'assistant') continue;
      const u = entry.message?.usage ?? entry.usage;
      if (!u || typeof u !== 'object') continue;
      const cacheRead = num(u.cache_read_input_tokens);
      const cacheWrite = num(u.cache_creation_input_tokens);
      usage.input += num(u.input_tokens) + cacheWrite + cacheRead;
      usage.output += num(u.output_tokens);
      usage.cacheRead += cacheRead;
      usage.cacheWrite += cacheWrite;
      usage.calls += 1;
    }
  } catch { /* missing or unreadable transcript */ }
  return usage;
}

// What this turn added since the previous snapshot; a smaller total means the record was reset.
export function deltaUsage(current, previous) {
  return {
    input: Math.max(0, current.input - previous.input),
    output: Math.max(0, current.output - previous.output),
  };
}

export const totalUsage = (u) => u.input + u.output;
export const formatUsage = (u) => `${u.input}/${u.output}`;
