import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

// Token usage and time spent from a client's session record. Like `effort.mjs`, every reader is
// best-effort: an absent or unreadable file yields zeros, never an error.

// A gap longer than this between transcript entries counts as idle time (the user or agent was
// away), not as work on the step. Long tool runs stay well below it.
export const IDLE_MS = 15 * 60 * 1000;

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const stamp = (v) => (typeof v === 'string' ? Date.parse(v) : NaN);

// Claude Code writes one `usage` object per assistant turn and an ISO `timestamp` on every entry.
// It also writes one entry per content block, repeating the same `message.usage`: count each message
// id once, or a response is counted two to three times over. `input` counts the uncached prompt
// tokens; cache reads and writes are reported separately, because on a long session they dwarf it.
// Active time is the sum of the gaps between consecutive timestamped entries, so tool runs count and
// idle gaps do not.
export function usageFromTranscript(file) {
  const usage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, calls: 0, timeMs: 0, timeKnown: false };
  if (!file) return usage;
  let prev;
  const seen = new Set();
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
      const key = entry.message?.id ?? entry.uuid ?? entry.id;
      if (key !== undefined && key !== null) {
        if (seen.has(key)) continue;
        seen.add(key);
      }
      const cacheRead = num(u.cache_read_input_tokens);
      const cacheWrite = num(u.cache_creation_input_tokens);
      usage.input += num(u.input_tokens);
      usage.output += num(u.output_tokens);
      usage.cacheRead += cacheRead;
      usage.cacheWrite += cacheWrite;
      usage.calls += 1;
    }
  } catch { /* missing or unreadable transcript */ }
  return usage;
}

// VS Code writes a Copilot chat session as an operation log: a `kind: 0` snapshot, then records with a
// key path (`k`) and a value (`v`): `kind: 1` sets a field, `kind: 2` pushes onto an array, `kind: 3`
// deletes. Only a few request fields matter for usage, so read them by path instead of replaying the
// whole object graph. A new chat request arrives as a push onto `requests`.
function copilotRequests(file) {
  const requests = [];
  if (!file) return requests;
  const push = (arr, value) => { if (Array.isArray(value)) arr.push(...value); else arr.push(value); };
  try {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      if (!line.trim()) continue;
      let entry;
      try { entry = JSON.parse(line); } catch { continue; }
      if (entry?.kind === 0) {
        requests.length = 0;
        if (Array.isArray(entry.v?.requests)) requests.push(...entry.v.requests);
        continue;
      }
      const path = entry?.k;
      if (!Array.isArray(path) || path[0] !== 'requests') continue;
      if (path.length === 1) {
        if (entry.kind === 2) push(requests, entry.v);
        else if (entry.kind === 3) requests.length = 0;
        else if (Array.isArray(entry.v)) { requests.length = 0; requests.push(...entry.v); }
        continue;
      }
      if (typeof path[1] !== 'number') continue;
      const index = path[1];
      if (path.length === 2) {
        if (entry.kind === 2) requests.push(entry.v ?? {});
        else if (entry.kind === 3) requests.splice(index, 1);
        else requests[index] = entry.v ?? {};
        continue;
      }
      if (!requests[index] || typeof requests[index] !== 'object') requests[index] = {};
      const parent = path.slice(2, -1).reduce((cur, part) => {
        if (!cur[part] || typeof cur[part] !== 'object') cur[part] = {};
        return cur[part];
      }, requests[index]);
      const key = path.at(-1);
      if (entry.kind === 2) {
        if (!Array.isArray(parent[key])) parent[key] = [];
        push(parent[key], entry.v);
      } else if (entry.kind === 3) {
        delete parent[key];
      } else {
        parent[key] = entry.v;
      }
    }
  } catch { /* missing or unreadable operation log */ }
  return requests;
}

// Copilot in VS Code stores `promptTokens` (the latest model call of a request) and `completionTokens`
// on each request, and `result.timings.totalElapsed` once the request finishes. `now` lets a request
// still running contribute the time spent so far, capped by the same idle limit as Claude Code.
export function usageFromCopilotSession(file, { now = Date.now() } = {}) {
  const usage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, calls: 0, timeMs: 0, timeKnown: false };
  const requests = copilotRequests(file);
  requests.forEach((request, index) => {
    if (!request || typeof request !== 'object') return;
    const prompt = num(request.promptTokens ?? request.usage?.promptTokens);
    const output = num(request.completionTokens ?? request.usage?.completionTokens);
    if (prompt || output) usage.calls += 1;
    usage.input += prompt;
    usage.output += output;
    const elapsed = num(request.result?.timings?.totalElapsed);
    if (elapsed) { usage.timeMs += elapsed; usage.timeKnown = true; return; }
    const start = num(request.timestamp);
    if (index !== requests.length - 1 || !start || !Number.isFinite(now) || now <= start) return;
    usage.timeMs += Math.min(now - start, IDLE_MS);
    usage.timeKnown = true;
  });
  return usage;
}

// The chat session log of a Copilot session, looked up by session id in each VS Code edition's
// workspace storage. The id is unique, so the workspace hash does not have to be reproduced.
const USER_DATA = { darwin: 'Library/Application Support', win32: 'AppData/Roaming', linux: '.config' };
const VSCODE_APPS = ['Code', 'Code - Insiders', 'VSCodium', 'VSCodium - Insiders'];
export function copilotSessionFile(sessionId, { home = homedir(), platform = process.platform } = {}) {
  if (!sessionId || !/^[\w.-]+$/.test(sessionId)) return ''; // never let the payload escape workspaceStorage
  const base = join(home, USER_DATA[platform] ?? USER_DATA.linux);
  for (const app of VSCODE_APPS) {
    const dir = join(base, app, 'User', 'workspaceStorage');
    let workspaces = [];
    try { workspaces = readdirSync(dir); } catch { continue; }
    for (const workspace of workspaces) {
      const file = join(dir, workspace, 'chatSessions', `${sessionId}.jsonl`);
      if (existsSync(file)) return file;
    }
  }
  return '';
}

// What this turn added since the previous snapshot; a smaller total means the record was reset.
export function deltaUsage(current, previous = {}) {
  return {
    input: Math.max(0, current.input - num(previous.input)),
    output: Math.max(0, current.output - num(previous.output)),
    cacheRead: Math.max(0, num(current.cacheRead) - num(previous.cacheRead)),
    cacheWrite: Math.max(0, num(current.cacheWrite) - num(previous.cacheWrite)),
    timeMs: Math.max(0, num(current.timeMs) - num(previous.timeMs)),
    timeKnown: Boolean(current.timeKnown),
  };
}

export const totalUsage = (u) =>
  num(u.input) + num(u.cacheRead) + num(u.cacheWrite) + num(u.output);

// Seven-digit totals are unreadable without grouping, and an unlabelled `a/b` hides which number is
// which: every figure the kit prints or suggests goes through these two.
const group = new Intl.NumberFormat('en-US');
export const formatCount = (n) => group.format(Math.max(0, Math.round(num(n))));
export const formatUsage = (u) =>
  `${formatCount(u.input)} input · ${formatCount(u.cacheRead)} cache read · ${formatCount(u.cacheWrite)} cache write · ${formatCount(u.output)} output · ${formatCount(totalUsage(u))} total`;

// Whole seconds, the resolution a reader needs for a step.
export function formatDuration(ms) {
  const s = Math.max(0, Math.floor(num(ms) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return s % 60 ? `${m}m ${s % 60}s` : `${m}m`;
  const h = Math.floor(m / 60);
  return m % 60 ? `${h}h ${m % 60}m` : `${h}h`;
}
