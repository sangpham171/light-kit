import { readFileSync } from 'node:fs';

// Token usage and time spent from a client's session record. Like `effort.mjs`, every reader is
// best-effort: an absent or unreadable file yields zeros, never an error.

// A gap longer than this between transcript entries counts as idle time (the user or agent was
// away), not as work on the step. Long tool runs stay well below it.
export const IDLE_MS = 15 * 60 * 1000;

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const stamp = (v) => (typeof v === 'string' ? Date.parse(v) : NaN);

// Claude Code writes one `usage` object per assistant turn and an ISO `timestamp` on every entry.
// `input` is the whole prompt (fresh + cache write + cache read), the number the client processed.
// Active time is the sum of the gaps between consecutive timestamped entries, so tool runs count
// and idle gaps do not.
export function usageFromTranscript(file) {
  const usage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, calls: 0, timeMs: 0, timeKnown: false };
  if (!file) return usage;
  let prev;
  try {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      if (!line.trim()) continue;
      let entry;
      try { entry = JSON.parse(line); } catch { continue; }
      const ts = stamp(entry?.timestamp);
      if (Number.isFinite(ts)) {
        usage.timeKnown = true;
        if (prev !== undefined && ts > prev && ts - prev <= IDLE_MS) usage.timeMs += ts - prev;
        prev = prev === undefined ? ts : Math.max(prev, ts);
      }
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
export function deltaUsage(current, previous = {}) {
  return {
    input: Math.max(0, current.input - num(previous.input)),
    output: Math.max(0, current.output - num(previous.output)),
    timeMs: Math.max(0, num(current.timeMs) - num(previous.timeMs)),
    timeKnown: Boolean(current.timeKnown),
  };
}

export const totalUsage = (u) => u.input + u.output;
export const formatUsage = (u) => `${u.input}/${u.output}`;

// Whole seconds, the resolution a reader needs for a step.
export function formatDuration(ms) {
  const s = Math.max(0, Math.floor(num(ms) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return s % 60 ? `${m}m ${s % 60}s` : `${m}m`;
  const h = Math.floor(m / 60);
  return m % 60 ? `${h}h ${m % 60}m` : `${h}h`;
}
