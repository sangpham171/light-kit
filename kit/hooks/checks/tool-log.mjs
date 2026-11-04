import { appendFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { redact } from '../lib/secrets.mjs';

// One append-only Markdown log in the project's specs folder: every tool call leaves a row, so a
// request folder carries the trail of what the agent actually ran. Silent by design: it writes a file
// and never changes the agent's exit code. Tool output is never stored, and shell commands are redacted.
const FILE = 'tool-log.md';
const HEADER = [
  '# Tool call log',
  '',
  'Appended by the light-kit `tool-log` hook after each tool call: one row per call, newest last.',
  'Targets are the edited files, or the shell command. Tool output is not stored. Safe to delete.',
  '',
  '| Time | Client | Tool | Kind | Target |',
  '|---|---|---|---|---|',
  '',
].join('\n');
const CELL = 200;

const cell = (value) => String(value ?? '')
  .replace(/\s+/g, ' ')
  .replace(/\|/g, '\\|')
  .trim()
  .slice(0, CELL);
const stamp = () => new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
const isDir = (dir) => { try { return statSync(dir).isDirectory(); } catch { return false; } };

export default {
  id: 'tool-log',
  events: ['post-tool'],
  run(ctx, cfg) {
    // Only projects that already use the workflow: never create `specs/` in an unrelated repository.
    const dir = [ctx.scope, ctx.root].map((d) => join(d, 'specs')).find(isDir);
    if (!dir) return null;
    const file = join(dir, FILE);
    // A call that writes the log itself must not add a row about it.
    if (ctx.files.some((f) => ctx.rel(f) === ctx.rel(file))) return null;

    if (!existsSync(file) || statSync(file).size === 0) {
      mkdirSync(dir, { recursive: true });
      appendFileSync(file, HEADER);
    }
    const target = ctx.files.length ? ctx.files.map((f) => ctx.rel(f)).join(', ') : redact(ctx.command, cfg.extraSecretPatterns);
    appendFileSync(file, `| ${stamp()} | ${cell(ctx.client)} | ${cell(ctx.tool.name) || '-'} | ${ctx.tool.kind} | ${cell(target) || '-'} |\n`);
    return null;
  },
};
