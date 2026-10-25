import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';

// Clients store the reasoning ("thinking") effort in internal places, and the formats change between versions.
// Every reader is best-effort: it returns '' when the value is absent or unreadable, never throws.

const value = (v) => (typeof v === 'string' ? v.trim().replace(/^["']|["']$/g, '') : '');

// Claude Code writes the effort on every assistant entry of the session transcript.
export function effortFromTranscript(file) {
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

// Codex keeps it in the config file (honour CODEX_HOME).
export function effortFromCodex(home, env = process.env) {
  try {
    const dir = env.CODEX_HOME || join(home, '.codex');
    const text = readFileSync(join(dir, 'config.toml'), 'utf8');
    const m = text.match(/^\s*model_reasoning_effort\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s#]+))/m);
    return m ? value(m[1] ?? m[2] ?? m[3]) : '';
  } catch { return ''; }
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
    if (ctx?.client === 'claude') return effortFromTranscript(ctx.payload?.transcript_path ?? ctx.payload?.transcriptPath ?? '');
    if (ctx?.client === 'copilot') return effortFromVscode(home, common);
    if (ctx?.client === 'cursor') return effortFromVscode(home, { ...common, apps: APPS.cursor });
    if (ctx?.client === 'codex') return effortFromCodex(home, opts.env);
  } catch { /* never break a hook */ }
  return '';
}
