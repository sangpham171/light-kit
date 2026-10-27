import { closeSync, existsSync, openSync, readFileSync, readdirSync, readSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { homedir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { copilotEventsFile, copilotSessionFile } from './usage.mjs';

// Clients store the reasoning ("thinking") effort in internal places, and the formats change between versions.
// Every reader is best-effort: it returns '' when the value is absent or unreadable, never throws.

const value = (v) => (typeof v === 'string' ? v.trim().replace(/^["']|["']$/g, '') : '');

// Recent other transcripts of the same project: at session start the current one holds no assistant turn yet.
// Newest first, capped so a project with many sessions stays cheap to read.
function siblingTranscripts(file, limit = 3) {
  try {
    const dir = dirname(file);
    const self = basename(file);
    return readdirSync(dir)
      .filter((name) => name !== self && name.endsWith('.jsonl'))
      .map((name) => {
        const path = join(dir, name);
        try { return { path, mtime: statSync(path).mtimeMs }; } catch { return null; } // vanished meanwhile
      })
      .filter(Boolean)
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, limit)
      .map((s) => s.path);
  } catch { return []; } // no readable project directory
}

function scanTranscript(file) {
  if (!file) return '';
  try {
    const lines = readFileSync(file, 'utf8').trim().split('\n');
    for (let i = lines.length - 1; i >= 0; i--) {
      let entry;
      try { entry = JSON.parse(lines[i]); } catch { continue; }
      if (entry?.type === 'assistant' && value(entry.effort)) return value(entry.effort);
      const nested = value(entry?.params?.output_config?.effort);
      if (nested) return nested;
    }
  } catch { /* missing or unreadable transcript */ }
  return '';
}

// Claude Code writes the effort on every assistant entry of the session transcript. A fresh session has
// no assistant turn yet, so fall back to the newest transcript of the same project.
export function effortFromTranscript(file) {
  if (!file) return '';
  const current = scanTranscript(file);
  if (current || !existsSync(file)) return current; // a missing transcript is not a fresh session
  for (const sibling of siblingTranscripts(file)) {
    const found = scanTranscript(sibling);
    if (found) return found; // a newer session may also be waiting for its first turn
  }
  return '';
}

// Codex keeps it in the config file (honour CODEX_HOME).
export function effortFromCodex(home, env = process.env) {
  try {
    const dir = env.CODEX_HOME || join(home, '.codex');
    const text = readFileSync(join(dir, 'config.toml'), 'utf8');
    const m = text.match(/^\s*model_reasoning_effort\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s#]+))/m);
    return m ? value(m[1] ?? m[2] ?? m[3]) : '';
  } catch { return ''; }
}

// Copilot stores the effort in effect for the session, which is the only reliable source when the model
// keeps its default: the VS Code panel log keeps it on the selected model, the agent host (VS Code agent
// sessions and the CLI) on the first `session.start` event of the session's own event log.
const EFFORT_KEYS = ['reasoningEffort', 'thinkingLevel', 'reasoning_effort'];
const configured = (config) => EFFORT_KEYS.map((key) => value(config?.[key])).find(Boolean) ?? '';

// Only the opening lines of the event log matter, and a long session's log can be tens of megabytes.
const HEAD_BYTES = 128 * 1024;
function head(file) {
  let fd;
  try {
    fd = openSync(file, 'r');
    const buffer = Buffer.alloc(HEAD_BYTES);
    return buffer.toString('utf8', 0, readSync(fd, buffer, 0, HEAD_BYTES, 0));
  } catch { return ''; } finally {
    if (fd !== undefined) { try { closeSync(fd); } catch { /* already closed */ } }
  }
}

export function effortFromCopilotEvents(file) {
  if (!file) return '';
  for (const line of head(file).split('\n')) {
    if (!line.trim()) continue;
    let entry;
    try { entry = JSON.parse(line); } catch { continue; }
    if (entry?.type !== 'session.start') continue;
    const effort = value(entry.data?.reasoningEffort) || configured(entry.data?.model?.config);
    if (effort) return effort;
  }
  return '';
}

// The chat session is an operation log: a `kind: 0` snapshot, then key-path updates. The effort may be
// changed mid-session, so the last value read wins.
export function effortFromCopilotChat(file) {
  if (!file) return '';
  let effort = '';
  const remember = (config) => { effort = configured(config) || effort; };
  try {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      if (!line.trim()) continue;
      let entry;
      try { entry = JSON.parse(line); } catch { continue; }
      if (entry?.kind === 0) { remember(entry.v?.inputState?.selectedModel?.modelConfiguration); continue; }
      const path = entry?.k;
      if (!Array.isArray(path) || path[0] !== 'inputState' || path[1] !== 'selectedModel' || path[2] !== 'modelConfiguration') continue;
      if (path.length === 3) remember(entry.v);
      else if (path.length === 4 && EFFORT_KEYS.includes(path[3])) effort = value(entry.v) || effort;
    }
  } catch { /* missing or unreadable chat log */ }
  return effort;
}

// VS Code keeps the chat model configuration (including reasoningEffort) in its state database.
const BASE = { darwin: 'Library/Application Support', win32: 'AppData/Roaming', linux: '.config' };
const APPS = { copilot: ['Code', 'Code - Insiders', 'VSCodium'], cursor: ['Cursor'] };

const queryState = (db) => {
  try {
    return execFileSync('sqlite3', [db, "select value from ItemTable where key='chat.modelConfiguration.panel';"], {
      encoding: 'utf8', timeout: 2000, stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch { return ''; } // sqlite3 missing, or the database is locked or not VS Code's
};

export function effortFromVscode(home, { model = '', platform = process.platform, query = queryState, apps } = {}) {
  const base = join(home, BASE[platform] ?? BASE.linux);
  for (const app of apps ?? APPS.copilot) {
    const db = join(base, app, 'User', 'globalStorage', 'state.vscdb');
    if (!existsSync(db)) continue;
    let config;
    try { config = JSON.parse(query(db) || '{}'); } catch { continue; }
    const entries = Object.entries(config).filter(([, v]) => value(v?.reasoningEffort));
    if (!entries.length) continue;
    const short = String(model || '').split('/').pop();
    const hit = entries.find(([k]) => k === model)
      ?? (short ? entries.find(([k]) => k === short || k.endsWith(`/${short}`)) : undefined)
      ?? entries[0];
    const effort = value(hit?.[1]?.reasoningEffort);
    if (effort) return effort;
  }
  return '';
}

// client: the normalized client name; model: the model the client reported for this session, if any.
export function detectEffort(ctx, opts = {}) {
  try {
    const home = opts.home ?? homedir();
    const common = { model: ctx?.model, platform: opts.platform, query: opts.query };
    const sessionId = ctx?.payload?.session_id ?? ctx?.payload?.sessionId ?? '';
    if (ctx?.client === 'claude') return effortFromTranscript(ctx.payload?.transcript_path ?? ctx.payload?.transcriptPath ?? '');
    if (ctx?.client === 'copilot') {
      const fromEvents = effortFromCopilotEvents(copilotEventsFile(sessionId, { home, env: opts.env }));
      if (fromEvents) return fromEvents;
      const fromChat = effortFromCopilotChat(copilotSessionFile(sessionId, { home, platform: opts.platform }));
      if (fromChat) return fromChat;
      return effortFromVscode(home, common);
    }
    if (ctx?.client === 'cursor') return effortFromVscode(home, { ...common, apps: APPS.cursor });
    if (ctx?.client === 'codex') return effortFromCodex(home, opts.env);
  } catch { /* never break a hook */ }
  return '';
}
