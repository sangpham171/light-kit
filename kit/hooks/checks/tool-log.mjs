import { appendFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { redact } from '../lib/secrets.mjs';
import { activeRequests, currentRequest } from '../lib/specs.mjs';

// Each active request carries its own append-only Markdown log, `specs/<NNN-slug>/tool-log.md`: the
// trail of what the agent actually ran while working on that request. Silent by design: it writes a
// file and never changes the agent's exit code. Tool output is never stored, and shell commands are
// redacted. With no active request nothing is written, so a folder is never invented.
const FILE = 'tool-log.md';
const HEADER = [
  '# Tool call log',
  '',
  'Appended by the light-kit `tool-log` hook after each tool call: one row per call for this request, newest last.',
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

export default {
  id: 'tool-log',
  events: ['post-tool'],
  run(ctx, cfg) {
    const request = currentRequest(activeRequests(ctx.scope, ctx.root));
    if (!request) return null;
    const file = join(request.home, 'specs', request.name, FILE);
    // A call that writes the log itself must not add a row about it.
    if (ctx.files.some((f) => ctx.rel(f) === ctx.rel(file))) return null;
    if (!existsSync(file)) appendFileSync(file, HEADER);
    const target = ctx.files.length ? ctx.files.map((f) => ctx.rel(f)).join(', ') : redact(ctx.command, cfg.extraSecretPatterns);
    appendFileSync(file, `| ${stamp()} | ${cell(ctx.client)} | ${cell(ctx.tool.name) || '-'} | ${ctx.tool.kind} | ${cell(target) || '-'} |\n`);
    return null;
  },
};
