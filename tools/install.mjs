#!/usr/bin/env node
// Install light-kit into a project: node tools/install.mjs <target-dir> [--clients claude,copilot,cursor,codex] [--dry-run]
// Idempotent and non-destructive:
//  - instruction files (CLAUDE.md, AGENTS.md, ...) only get a marked light-kit block replaced or appended
//  - other generated files are overwritten only if they carry the light-kit marker
//  - existing files without the marker are left alone and reported
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, loadKit, lint, CLIENT_NAMES, isManaged, START, END } from './build.mjs';

export function mergeBlock(existing, block) {
  const s = existing.indexOf(START);
  const e = existing.indexOf(END);
  if (s !== -1 && e > s) return existing.slice(0, s) + block.trimEnd() + existing.slice(e + END.length);
  const sep = existing === '' ? '' : existing.endsWith('\n') ? '\n' : '\n\n';
  return existing + sep + block;
}

export function install(target, clients, { dryRun = false } = {}) {
  const kit = loadKit();
  const errors = lint(kit);
  if (errors.length) throw new Error(`kit lint failed:\n${errors.join('\n')}`);
  const report = { written: [], unchanged: [], skipped: [] };
  const config = JSON.stringify({ clients, kit: 'light-kit' }, null, 2) + '\n';
  const files = [...build(kit, clients), { path: 'kit.config.json', content: config, overwrite: true }];

  for (const f of files) {
    const abs = join(target, f.path);
    const exists = existsSync(abs);
    const current = exists ? readFileSync(abs, 'utf8') : null;
    let next;
    if (f.block) next = mergeBlock(current ?? '', f.block);
    else if (!exists || f.overwrite || isManaged(current)) next = f.content;
    else { report.skipped.push(f.path); continue; }
    if (next === current) { report.unchanged.push(f.path); continue; }
    if (!dryRun) { mkdirSync(dirname(abs), { recursive: true }); writeFileSync(abs, next); }
    report.written.push(f.path);
  }
  return report;
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const target = args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--clients');
  const ci = args.indexOf('--clients');
  if (!target) { console.error('usage: install.mjs <target-dir> [--clients a,b] [--dry-run]'); process.exit(2); }
  let clients = ci !== -1 ? args[ci + 1].split(',') : null;
  const cfg = join(target, 'kit.config.json');
  if (!clients && existsSync(cfg)) clients = JSON.parse(readFileSync(cfg, 'utf8')).clients;
  clients ??= CLIENT_NAMES;
  const r = install(target, clients, { dryRun: args.includes('--dry-run') });
  console.log(`${args.includes('--dry-run') ? '[dry run] ' : ''}clients: ${clients.join(', ')}`);
  console.log(`written: ${r.written.length}, unchanged: ${r.unchanged.length}, skipped: ${r.skipped.length}`);
  for (const s of r.skipped) console.log(`  skipped (exists, not managed by light-kit): ${s}`);
  if (clients.includes('codex')) console.log('note: Codex custom prompts are user-level — copy .codex/prompts/* to ~/.codex/prompts/ to use them.');
  console.log('next: open your AI client and run the `init` command.');
}
