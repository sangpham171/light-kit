import { appendFileSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { redact } from '../lib/secrets.mjs';
import { activeRequests, currentRequest } from '../lib/specs.mjs';

// One append-only Markdown log per project: `specs/tool-log.md` collects the calls made before a
// request folder exists, then moves into `specs/<NNN-slug>/tool-log.md` on the call that creates the
// folder. From then on the request folder holds the whole trail. Silent by design: it writes a file
// and never changes the agent's exit code. Tool output is never stored, shell commands are redacted,
// and a call that writes a log itself adds no row.
const FILE = 'tool-log.md';
const HEADER = [
  '# Tool call log',
  '',
  'Appended by the light-kit `tool-log` hook after each tool call: one row per call, newest last.',
  'Calls made before a request folder exists stay in `specs/tool-log.md` and move into the request',
  'folder when it is created. Targets are the edited files, or the shell command. Tool output is not',
  'stored. Safe to delete.',
  '',
  '| Time | Client | Tool | Kind | Target |',
  '|---|---|---|---|---|',
  '',
].join('\n');
const CELL = 200;
const ROW = /^\| \d{4}-\d\d-\d\dT/;

const same = (a, b) => resolve(a) === resolve(b);
const sharedLog = (home) => join(home, 'specs', FILE);
const requestLog = (r) => join(r.home, 'specs', r.name, FILE);
const hasStatus = (r) => existsSync(join(r.home, 'specs', r.name, 'status.md'));

// The request folder a written path belongs to: `specs/<name>/...` -> { home, name }.
const folderOf = (ctx, file) => {
  for (let dir = dirname(resolve(ctx.cwd, file)); dirname(dir) !== dir; dir = dirname(dir)) {
    if (basename(dirname(dir)) === 'specs') return { home: dirname(dirname(dir)), name: basename(dir) };
  }
  return null;
};

const stamp = () => new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
const cell = (value) => String(value ?? '')
  .replace(/\s+/g, ' ')
  .replace(/\|/g, '\\|')
  .trim()
  .slice(0, CELL);

const appendRow = (file, line) => {
  if (!existsSync(file)) {
    mkdirSync(dirname(file), { recursive: true });
    appendFileSync(file, HEADER);
  }
  appendFileSync(file, line);
};

// The shared log moves into the request folder on its first row, merging if that folder already logged.
const moveShared = (from, to) => {
  if (!existsSync(from)) return;
  if (!existsSync(to)) {
    mkdirSync(dirname(to), { recursive: true });
    renameSync(from, to);
    return;
  }
  const rows = readFileSync(from, 'utf8').split('\n').filter((l) => ROW.test(l));
  if (rows.length) {
    const current = readFileSync(to, 'utf8');
    appendFileSync(to, `${current.endsWith('\n') ? '' : '\n'}${rows.join('\n')}\n`);
  }
  rmSync(from);
};

export default {
  id: 'tool-log',
  events: ['post-tool'],
  run(ctx, cfg) {
    const written = ctx.files.map((f) => folderOf(ctx, f)).find(Boolean);
    // A statusless folder is a leftover, not a request being worked on: it must not capture the shared log.
    const active = currentRequest(activeRequests(ctx.scope, ctx.root).filter(hasStatus));
    const request = written ?? active;
    const logs = [sharedLog(ctx.scope), request ? requestLog(request) : '']
      .concat(request && request.home !== ctx.scope ? sharedLog(request.home) : [])
      .filter(Boolean);
    if (ctx.files.some((f) => logs.some((l) => same(resolve(ctx.cwd, f), l)))) return null;
    const target = ctx.files.length ? ctx.files.map((f) => ctx.rel(f)).join(', ') : redact(ctx.command, cfg.extraSecretPatterns);
    const line = `| ${stamp()} | ${cell(ctx.client)} | ${cell(ctx.tool.name) || '-'} | ${ctx.tool.kind} | ${cell(target) || '-'} |\n`;
    if (request) {
      moveShared(sharedLog(request.home), requestLog(request));
      appendRow(requestLog(request), line);
      return null;
    }
    // At user level an unmanaged project gets no `specs/` folder invented for it.
    if (!ctx.kitEnabled && !existsSync(join(ctx.scope, 'specs'))) return null;
    appendRow(sharedLog(ctx.scope), line);
    return null;
  },
};
