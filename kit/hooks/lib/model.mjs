import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { copilotEventsFile, copilotSessionFile } from './usage.mjs';
import { readHead, scalar } from './record.mjs';

// Clients record the model in use for a session, which is the only value the agent cannot reliably know by
// itself. Every reader is best-effort: it returns '' when the value is absent or unreadable, never throws.

export function modelFromCopilotEvents(file) {
  if (!file) return '';
  for (const line of readHead(file).split('\n')) {
    if (!line.trim()) continue;
    let entry;
    try { entry = JSON.parse(line); } catch { continue; }
    if (entry?.type !== 'session.start') continue;
    const model = scalar(entry.data?.selectedModel) || scalar(entry.data?.model?.id) || scalar(entry.data?.model?.name);
    if (model) return model;
  }
  return '';
}

// The chat session is an operation log: a `kind: 0` snapshot, then key-path updates. The model may be
// switched mid-session, so the last value read wins.
export function modelFromCopilotChat(file) {
  if (!file) return '';
  let model = '';
  const remember = (selected) => {
    model = scalar(selected?.identifier) || scalar(selected?.metadata?.id) || model;
  };
  try {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      if (!line.trim()) continue;
      let entry;
      try { entry = JSON.parse(line); } catch { continue; }
      if (entry?.kind === 0) { remember(entry.v?.inputState?.selectedModel); continue; }
      const path = entry?.k;
      if (!Array.isArray(path) || path[0] !== 'inputState' || path[1] !== 'selectedModel') continue;
      if (path.length === 2) remember(entry.v);
      else if (path.length === 3 && path[2] === 'identifier') model = scalar(entry.v) || model;
    }
  } catch { /* missing or unreadable chat log */ }
  return model;
}

// Claude Code writes the model on every assistant turn of the session transcript.
export function modelFromTranscript(file) {
  if (!file || !existsSync(file)) return '';
  try {
    const lines = readFileSync(file, 'utf8').trim().split('\n');
    for (let i = lines.length - 1; i >= 0; i--) {
      let entry;
      try { entry = JSON.parse(lines[i]); } catch { continue; }
      if (entry?.type !== 'assistant') continue;
      const model = scalar(entry.message?.model) || scalar(entry.model);
      if (model) return model;
    }
  } catch { /* missing or unreadable transcript */ }
  return '';
}

// A client that reports the model in the hook payload answers directly; the rest are read from the record
// the client writes. Cursor and Codex keep none the kit can trust, so they stay silent.
export function detectModel(ctx, opts = {}) {
  try {
    const reported = scalar(ctx?.model);
    if (reported) return reported;
    const home = opts.home ?? homedir();
    const sessionId = ctx?.payload?.session_id ?? ctx?.payload?.sessionId ?? '';
    if (ctx?.client === 'copilot') {
      const fromEvents = modelFromCopilotEvents(copilotEventsFile(sessionId, { home, env: opts.env }));
      if (fromEvents) return fromEvents;
      return modelFromCopilotChat(copilotSessionFile(sessionId, { home, platform: opts.platform }));
    }
    if (ctx?.client === 'claude') return modelFromTranscript(ctx.payload?.transcript_path ?? ctx.payload?.transcriptPath ?? '');
  } catch { /* never break a hook */ }
  return '';
}
