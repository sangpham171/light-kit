#!/usr/bin/env node
// Uninstall light-kit from a project: node tools/uninstall.mjs <target-dir> [--soft | --hard] [--clients ...] [--level ...] [--dry-run] [--yes]
// soft (default): remove everything the installer generated. Your data stays: specs/, the project profile,
//   hooks.config.json, models.json, projects.md, the codebase map, assessment and backlog.
// hard: as soft, and delete the kit's own folders too (.light-kit/ and specs/, also in registered workspace projects).
//   Destructive, so it asks for confirmation (--yes skips the question).
// Both modes are idempotent. Outside the kit's own folders, a file is deleted only when the kit owns it.
import { readFileSync, writeFileSync, existsSync, readdirSync, rmSync, rmdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname, resolve, basename, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline';
import { build, loadKit, isManaged, HOOK_MARK, START, END, CLIENT_NAMES } from './build.mjs';
import { findObsolete, detectProjects, detectClients } from './install.mjs';

// Seeds that hold the user's own knowledge. Soft keeps them; hard removes them with the folder that contains them.
const KEEP_SOFT = /(^|\/)\.light-kit\/(project-profile\.md|hooks\.config\.json|models\.json|projects\.md)$/;

// Generated files that carry no light-kit marker (they are still ours). Templates are kit copies, not user data.
const kitOwned = (rel, configPath) =>
  rel === configPath || rel === '.light-kit/audit/manifest.json' || rel.startsWith('.light-kit/templates/');

// Remove the marked block, keep the user's text. Returns null when there is no block, '' when nothing else is left.
export function stripBlock(text) {
  const s = text.indexOf(START);
  const e = text.indexOf(END);
  if (s === -1 || e < s) return null;
  const before = text.slice(0, s).replace(/\n+$/, '');
  const after = text.slice(e + END.length);
  if ((before + after).trim() === '') return '';
  return before + after + (after === '' ? '\n' : '');
}

// Remove light-kit hook entries, keep the user's own hooks and settings.
// Returns { json: null } when nothing changed, { json: '' } when the file held only our entries, { error } for invalid JSON.
export function stripHooks(text) {
  let cur;
  try { cur = JSON.parse(text); } catch { return { error: 'invalid JSON' }; }
  if (!cur || typeof cur !== 'object' || !cur.hooks || typeof cur.hooks !== 'object') return { json: null };
  let changed = false;
  for (const [ev, list] of Object.entries(cur.hooks)) {
    if (!Array.isArray(list)) continue;
    const kept = list.filter((entry) => !JSON.stringify(entry).includes(HOOK_MARK));
    if (kept.length === list.length) continue;
    changed = true;
    if (kept.length) cur.hooks[ev] = kept; else delete cur.hooks[ev];
  }
  if (!changed) return { json: null };
  if (!Object.keys(cur.hooks).length) delete cur.hooks;
  // `version` alone is what the installer leaves in a file that held nothing else.
  if (!Object.keys(cur).length || Object.keys(cur).every((k) => k === 'version')) return { json: '' };
  return { json: JSON.stringify(cur, null, 2) + '\n' };
}

const inside = (target, rel) => {
  const root = resolve(target);
  const abs = resolve(target, rel);
  return rel === '' ? true : abs !== root && abs.startsWith(root + sep);
};

function prune(target, absPaths) {
  const root = resolve(target);
  for (const start of new Set(absPaths.map((p) => dirname(p)))) {
    let dir = start;
    while (dir !== root && dir.startsWith(root + sep)) {
      try { if (readdirSync(dir).length) break; } catch { break; }
      try { rmdirSync(dir); } catch { break; }
      dir = dirname(dir);
    }
  }
}

// Hard mode: the kit's own folders go, whatever they contain.
function removeFolders(target, { level, projects, report, dryRun }) {
  const roots = new Set();
  if (level === 'user') roots.add('.light-kit'); // no specs/ at user level
  else {
    roots.add('.light-kit');
    roots.add('specs');
    if (level === 'workspace')
      for (const p of projects) {
        const rel = typeof p === 'string' ? p : p.path;
        if (rel && inside(target, rel)) { roots.add(`${rel}/.light-kit`); roots.add(`${rel}/specs`); }
      }
  }
  for (const rel of roots) {
    const abs = join(target, rel);
    if (!existsSync(abs) || !inside(target, rel)) continue;
    report.removed.push(`${rel}/`);
    if (!dryRun) rmSync(abs, { recursive: true, force: true });
  }
}

export function uninstall(target, clients, { level = 'project', projects = [], hard = false, dryRun = false } = {}) {
  const files = build(loadKit(), clients, { hooks: true, level, projects });
  const configPath = level === 'user' ? '.light-kit/kit.config.json' : 'kit.config.json';
  const report = { removed: [], cleaned: [], kept: [], skipped: [] };
  const removedAbs = [];
  const remove = (rel) => {
    if (!inside(target, rel)) { report.skipped.push(`${rel} (outside the target)`); return; }
    if (!dryRun) rmSync(join(target, rel), { force: true });
    report.removed.push(rel);
    removedAbs.push(join(target, rel));
  };
  // Kit-owned trees with no user content: removed whole in soft mode, so files from older versions do not linger.
  const trees = hard ? new Set() : new Set(['.light-kit/audit', '.light-kit/templates']);
  const inTree = (rel) => [...trees].some((t) => rel === t || rel.startsWith(`${t}/`));

  for (const f of [...files, { path: configPath }]) {
    if (inTree(f.path)) continue;
    const abs = join(target, f.path);
    if (!existsSync(abs)) continue;
    const current = readFileSync(abs, 'utf8');

    if (f.block) {
      const next = stripBlock(current);
      if (next === null) { report.skipped.push(f.path); continue; }
      if (next === '') remove(f.path);
      else if (next !== current) {
        if (!dryRun) writeFileSync(abs, next);
        report.cleaned.push(f.path);
      }
      continue;
    }

    if (f.hooks) {
      const r = stripHooks(current);
      if (r.error) { report.skipped.push(`${f.path} (${r.error}; left alone)`); continue; }
      if (r.json === null) continue;
      if (r.json === '') remove(f.path);
      else {
        if (!dryRun) writeFileSync(abs, r.json);
        report.cleaned.push(f.path);
      }
      continue;
    }

    if (KEEP_SOFT.test(f.path)) { if (!hard) report.kept.push(f.path); continue; }
    if (isManaged(current) || kitOwned(f.path, configPath)) remove(f.path);
    else report.skipped.push(f.path);
  }

  for (const rel of findObsolete(target, files)) if (!inTree(rel)) remove(rel);
  if (!dryRun) prune(target, removedAbs);
  for (const rel of trees) {
    const abs = join(target, rel);
    if (!existsSync(abs) || !inside(target, rel)) continue;
    report.removed.push(`${rel}/`);
    if (!dryRun) rmSync(abs, { recursive: true, force: true });
  }
  if (hard) removeFolders(target, { level, projects, report, dryRun });
  return report;
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const opt = (n) => { const i = args.indexOf(`--${n}`); return i === -1 ? null : args[i + 1]; };
  const valueFlags = new Set(['--clients', '--level', '--projects']);
  const fail = (m) => { console.error(m); process.exit(2); };
  const hard = args.includes('--hard');
  if (hard && args.includes('--soft')) fail('choose --soft or --hard, not both');
  let level = opt('level') === 'root' ? 'workspace' : opt('level');
  if (level && !['user', 'workspace', 'project'].includes(level)) fail('--level must be user, workspace or project');
  const given = args.find((a, i) => !a.startsWith('--') && !valueFlags.has(args[i - 1]));
  let target = given ?? (level === 'user' ? homedir() : null);
  if (!target) fail('usage: uninstall.mjs <target-dir> [--soft | --hard] [--level user|workspace|project] [--clients a,b] [--projects p1,p2] [--dry-run] [--yes]\n       uninstall.mjs --level user   (uninstalls from your home folder)');

  const FOLDER_CLIENT = { '.claude': 'claude', '.copilot': 'copilot', '.cursor': 'cursor', '.codex': 'codex', '.agents': 'codex' };
  const folderClient = FOLDER_CLIENT[basename(resolve(target))];
  if (folderClient) {
    const parent = dirname(resolve(target));
    console.log(`note: ${resolve(target)} is the ${folderClient} client folder, so uninstalling from ${parent} (the kit installed there).`);
    target = parent;
  }
  const isHome = resolve(target) === resolve(homedir());
  level ??= isHome ? 'user' : undefined;

  const readSaved = (file) => { try { return JSON.parse(readFileSync(join(target, file), 'utf8')); } catch { return {}; } };
  const saved = readSaved(level === 'user' ? '.light-kit/kit.config.json' : 'kit.config.json');
  if (saved.level === 'root') saved.level = 'workspace';

  const projGiven = opt('projects')?.split(',').filter(Boolean);
  const found = level === 'user' ? [] : detectProjects(target);
  level ??= projGiven ? 'workspace' : saved.level ?? (found.length >= 2 ? 'workspace' : 'project');
  const paths = level === 'workspace' ? [...new Set([...(projGiven ?? []), ...(saved.projects ?? []), ...found])] : [];
  const projects = paths.map((p) => ({ path: p, repo: existsSync(join(target, p, '.git')) }));

  let clients = opt('clients')?.split(',') ?? (folderClient ? [folderClient] : saved.clients);
  if (!clients) clients = detectClients(target, paths, { user: level === 'user' });
  if (!clients.length) clients = CLIENT_NAMES;

  const dryRun = args.includes('--dry-run');
  if (hard && !dryRun && !args.includes('--yes')) {
    if (!process.stdin.isTTY) fail('--hard also deletes .light-kit/ and specs/. Re-run with --yes to confirm.');
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise((done) => rl.question('--hard deletes .light-kit/ and specs/. Continue? [y/N] ', (a) => { rl.close(); done(a); }));
    if (!/^y(es)?$/i.test(answer.trim())) { console.log('cancelled'); process.exit(1); }
  }

  const r = uninstall(target, clients, { level, projects, hard, dryRun });
  console.log(`${dryRun ? '[dry run] ' : ''}${hard ? 'hard' : 'soft'} uninstall at ${resolve(target)} (level: ${level})`);
  console.log(`clients: ${clients.join(', ')}`);
  console.log(`removed: ${r.removed.length}, cleaned: ${r.cleaned.length}, kept: ${r.kept.length}, skipped: ${r.skipped.length}`);
  for (const x of r.removed.slice(0, 12)) console.log(`  ${dryRun ? 'would remove' : 'removed'}: ${x}`);
  if (r.removed.length > 12) console.log(`  … and ${r.removed.length - 12} more`);
  for (const x of r.cleaned) console.log(`  ${dryRun ? 'would clean' : 'cleaned'}: ${x}`);
  for (const x of r.kept) console.log(`  kept (your data): ${x}`);
  for (const x of r.skipped) console.log(`  skipped (not managed by light-kit): ${x}`);
  if (hard) console.log(level === 'user' ? 'hard: the kit folders in your home folder were removed; nothing else was touched.' : 'hard: the kit folders (.light-kit/, specs/) were removed; files the kit does not own were left alone.');
  else console.log('soft: generated files were removed; your profile, settings and specs/ were kept.');
}
