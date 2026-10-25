// Normalise each client's hook payload into one shape:
// { client, event, root, rel(p), tool:{name,kind}, files[], command, text, output, prompt, stopActive }
import { resolve, relative, isAbsolute, dirname } from 'node:path';
import { existsSync, statSync } from 'node:fs';
import { locate } from './config.mjs';
import { realish } from './paths.mjs';

const KINDS = {
  shell: ['bash', 'powershell', 'shell', 'sh', 'local_shell', 'run_terminal_cmd', 'terminal'],
  read: ['read', 'view', 'readfile', 'read_file', 'grep', 'glob', 'search'],
  write: ['write', 'edit', 'multiedit', 'notebookedit', 'create', 'delete', 'apply_patch', 'str_replace_editor', 'replace', 'edit_file', 'write_file'],
};
const PATH_KEYS = ['file_path', 'filePath', 'path', 'target_file', 'notebook_path', 'filename'];
const SKIP_TEXT = new Set([...PATH_KEYS, 'old_string', 'oldString', 'description', 'timeout']);

const kindOf = (name) => {
  const n = String(name ?? '').toLowerCase();
  return Object.keys(KINDS).find((k) => KINDS[k].includes(n)) ?? 'other';
};

function strings(v, out = [], key = '') {
  if (typeof v === 'string') { if (!SKIP_TEXT.has(key)) out.push(v); }
  else if (Array.isArray(v)) v.forEach((x) => strings(x, out, key));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) strings(x, out, k);
  return out;
}

const allStrings = (v, out = []) => {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => allStrings(x, out));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => allStrings(x, out));
  return out;
};

const patchPaths = (text) =>
  [...text.matchAll(/^\*\*\* (?:Add|Update|Delete) File: (.+)$/gm), ...text.matchAll(/^\+\+\+ (?:b\/)?(\S+)/gm)].map((m) => m[1].trim());

const existingDir = (p) => {
  let d = p;
  while (!existsSync(d)) { const up = dirname(d); if (up === d) break; d = up; }
  try { return statSync(d).isDirectory() ? d : dirname(d); } catch { return d; }
};

// kitHome = where the kit is installed. root/scope/layers come from locate(); workDir = real folder for git/commands.
export function normalize(client, event, p, installRoot) {
  const kitHome = realish(installRoot);
  const cwd = realish(p.cwd || p.workspace_roots?.[0] || process.cwd());
  let input = p.tool_input ?? p.toolArgs ?? {};
  if (typeof input === 'string') { try { input = JSON.parse(input); } catch { input = { command: input }; } }
  const name = p.tool_name ?? p.toolName ?? '';
  const kind = kindOf(name);
  const texts = strings(input);
  const files = new Set(PATH_KEYS.map((k) => input?.[k]).filter((x) => typeof x === 'string' && x));
  if (kind === 'write') texts.flatMap(patchPaths).forEach((f) => files.add(f));
  if (p.file_path) files.add(p.file_path);
  const cmd = input?.command ?? p.command;
  const out = p.tool_response ?? p.tool_result ?? p.toolResult ?? p.tool_output ?? '';
  const first = [...files][0] ? realish(resolve(cwd, [...files][0])) : '';
  const workDir = existingDir(first ? dirname(first) : cwd);
  const { root, scope, layers, kitEnabled, userLevel } = locate(kitHome, first ? dirname(first) : cwd);
  return {
    client, event, kitHome, root, scope, layers, kitEnabled, userLevel, payload: p, cwd, workDir,
    layersFor: (dir) => locate(kitHome, dir).layers,
    rel: (f) => { const abs = realish(resolve(cwd, f)); const r = relative(root, abs); return r.startsWith('..') || isAbsolute(r) ? abs : r; },
    tool: { name, kind },
    files: [...files],
    command: Array.isArray(cmd) ? cmd.join(' ') : typeof cmd === 'string' ? cmd : '',
    text: kind === 'write' ? texts.join('\n') : '',
    output: allStrings(out).join('\n'),
    prompt: p.prompt ?? p.initialPrompt ?? p.initial_prompt ?? '',
    stopActive: Boolean(p.stop_hook_active) || Number(p.loop_count) > 0,
  };
}
