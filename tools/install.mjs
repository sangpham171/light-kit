#!/usr/bin/env node
// Install light-kit into a project: node tools/install.mjs <target-dir> [--clients claude,copilot,cursor,codex] [--dry-run] [--no-hooks] [--force | --force-all]
// Levels: "project" (one project), "workspace" (a folder holding several projects, each with its own stack) or
// "user" (your home folder: ~/.claude, ~/.copilot, ~/.cursor, ~/.codex, serving every project you open).
// Without --clients the clients are detected from their folders; without --level it is "workspace" when 2+ nested repositories are found,
// and "user" when the target is your home folder.
// Idempotent and non-destructive:
//  - instruction files (CLAUDE.md, AGENTS.md, ...) only get a marked light-kit block replaced or appended
//  - other generated files are overwritten only if they carry the light-kit marker
//  - existing files without the marker are left alone and reported (--force overwrites them, seeds included;
//    --force-all also replaces shared instruction files with the kit block alone; hook registrations are always merged, never replaced)
import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync, rmSync, rmdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, loadKit, lint, mergeHooks, CLIENT_NAMES, CLIENT_FOLDERS, USER_CLIENT_FOLDERS, USER_NOTES, isManaged, START, END } from './build.mjs';

const SKIP = (name) => name.startsWith('.');

// Files an earlier version generated (they carry the light-kit marker) that this version no longer produces, e.g. after a rename.
// Only marker files inside folders the kit writes to (plus any extra root given) are touched; anything else is left alone.
export function findObsolete(target, files, extraRoots = []) {
  const produced = new Set(files.map((f) => f.path));
  const roots = new Set([
    ...files.filter((f) => f.content?.includes('light-kit:generated')).map((f) => (basename(f.path) === 'SKILL.md' ? dirname(dirname(f.path)) : dirname(f.path))),
    ...extraRoots,
  ]);
  const found = [];
  const walk = (rel, depth) => {
    let entries = [];
    try { entries = readdirSync(join(target, rel), { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const r = `${rel}/${e.name}`;
      if (e.isDirectory()) { if (depth < 2) walk(r, depth + 1); continue; }
      if (produced.has(r)) continue;
      try { if (isManaged(readFileSync(join(target, r), 'utf8'))) found.push(r); } catch { /* unreadable: leave it */ }
    }
  };
  for (const root of roots) walk(root, 1);
  return found;
}

// Projects = sub-folders (up to two levels deep) that are their own repository. Monorepo projects are found later by `init`.
export function detectProjects(target) {
  const out = [];
  const walk = (rel, depth) => {
    const dir = join(target, rel);
    let entries = [];
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (!e.isDirectory() || SKIP(e.name)) continue;
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (existsSync(join(target, r, '.git'))) out.push(r);
      else if (depth < 2) walk(r, depth + 1);
    }
  };
  walk('', 1);
  return out;
}

// Clients whose folders exist in the target, and (at workspace level) in its projects.
export function detectClients(target, projects = [], { user = false } = {}) {
  const found = new Set();
  for (const base of ['', ...projects]) {
    const has = (p) => existsSync(join(target, base, p));
    for (const [name, test] of Object.entries(user ? USER_CLIENT_FOLDERS : CLIENT_FOLDERS)) if (test(has)) found.add(name);
  }
  return CLIENT_NAMES.filter((c) => found.has(c));
}

export function mergeBlock(existing, block) {
  const s = existing.indexOf(START);
  const e = existing.indexOf(END);
  if (s !== -1 && e > s) return existing.slice(0, s) + block.trimEnd() + existing.slice(e + END.length);
  const sep = existing === '' ? '' : existing.endsWith('\n') ? '\n' : '\n\n';
  return existing + sep + block;
}

export function install(target, clients, { dryRun = false, force = 'none', hooks = true, level = 'project', projects = [], previousClients = [] } = {}) {
  const kit = loadKit();
  const errors = lint(kit);
  if (errors.length) throw new Error(`kit lint failed:\n${errors.join('\n')}`);
  const report = { written: [], unchanged: [], skipped: [], removed: [] };
  const config = JSON.stringify({ clients: [...new Set([...previousClients, ...clients])], level, ...(level === 'workspace' && { projects: projects.map((p) => p.path) }), kit: 'light-kit' }, null, 2) + '\n';
  // At user level the config sits inside ~/.light-kit so the home folder itself stays clean (the hooks also read it).
  const configPath = level === 'user' ? '.light-kit/kit.config.json' : 'kit.config.json';
  const files = [...build(kit, clients, { hooks, level, projects, home: target }), { path: configPath, content: config, overwrite: true }];
  // An earlier version put Copilot prompts in the harness folder, which VS Code does not read; sweep them out.
  const staleRoots = level === 'user' && clients.includes('copilot') ? ['.copilot/prompts'] : [];

  for (const f of files) {
    const abs = join(target, f.path);
    const exists = existsSync(abs);
    const current = exists ? readFileSync(abs, 'utf8') : null;
    let next;
    if (f.hooks) {
      try { next = mergeHooks(current, { ...f.hooks, defaults: f.defaults }); } catch { report.skipped.push(`${f.path} (not valid JSON; add the light-kit hooks by hand)`); continue; }
    } else if (f.block) next = force === 'all' ? f.block : mergeBlock(current ?? '', f.block); // forced: the file becomes the block alone
    else if (f.seed && exists && force === 'none') { report.unchanged.push(f.path); continue; } // seeds hold knowledge people fill in: never touched once present
    else if (!exists || f.overwrite || force !== 'none' || isManaged(current)) next = f.content;
    else { report.skipped.push(f.path); continue; }
    if (next === current) { report.unchanged.push(f.path); continue; }
    if (!dryRun) { mkdirSync(dirname(abs), { recursive: true }); writeFileSync(abs, next); }
    report.written.push(f.path);
  }
  for (const rel of findObsolete(target, files, staleRoots)) {
    if (!dryRun) {
      rmSync(join(target, rel), { force: true });
      const dir = dirname(join(target, rel)); // an emptied skill folder goes too
      try { if (readdirSync(dir).length === 0) rmdirSync(dir); } catch { /* not empty or gone */ }
    }
    report.removed.push(rel);
  }
  return report;
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const opt = (n) => { const i = args.indexOf(`--${n}`); return i === -1 ? null : args[i + 1]; };
  const valueFlags = new Set(['--clients', '--level', '--projects']);
  const fail = (m) => { console.error(m); process.exit(2); };
  let level = opt('level') === 'root' ? 'workspace' : opt('level'); // "root" was the earlier name of "workspace"
  if (level && !['user', 'workspace', 'project'].includes(level)) fail('--level must be user, workspace or project');
  const given = args.find((a, i) => !a.startsWith('--') && !valueFlags.has(args[i - 1]));
  let target = given ?? (level === 'user' ? homedir() : null);
  if (!target) fail('usage: install.mjs <target-dir> [--level user|workspace|project] [--clients a,b] [--projects p1,p2] [--dry-run] [--no-hooks] [--force | --force-all]\n       install.mjs --level user   (installs into your home folder)');
  // Pointing at a client's own folder (~/.claude, proj/.cursor, ...) means "install for that client in the folder that holds it".
  const FOLDER_CLIENT = { '.claude': 'claude', '.copilot': 'copilot', '.cursor': 'cursor', '.codex': 'codex', '.agents': 'codex' };
  const folderClient = FOLDER_CLIENT[basename(resolve(target))];
  if (folderClient) {
    const parent = dirname(resolve(target));
    console.log(`note: ${resolve(target)} is the ${folderClient} client folder, so installing into ${parent} (the kit adds its own files inside the client folder).`);
    target = parent;
  }
  const isHome = resolve(target) === resolve(homedir());
  level ??= isHome ? 'user' : undefined;

  const readSaved = (file) => { try { return JSON.parse(readFileSync(join(target, file), 'utf8')); } catch { return {}; } };
  const saved = level === 'user' ? readSaved('.light-kit/kit.config.json') : readSaved('kit.config.json');
  if (saved.level === 'root') saved.level = 'workspace';

  const projGiven = opt('projects')?.split(',').filter(Boolean);
  const found = level === 'user' ? [] : detectProjects(target);
  level ??= projGiven ? 'workspace' : saved.level ?? (found.length >= 2 ? 'workspace' : 'project');
  const paths = level === 'workspace' ? [...new Set([...(projGiven ?? []), ...(saved.projects ?? []), ...found])] : [];
  const projects = paths.map((p) => ({ path: p, repo: existsSync(join(target, p, '.git')) }));

  let clients = opt('clients')?.split(',') ?? (folderClient ? [folderClient] : saved.clients);
  let how = opt('clients') ? 'from --clients' : folderClient ? 'from the folder you gave' : saved.clients ? 'from saved config' : 'detected from folders';
  if (!clients) {
    clients = detectClients(target, paths, { user: level === 'user' });
    if (!clients.length) {
      if (level === 'user') fail(`No client folder (.claude, .copilot, .cursor, .codex) found in ${target}. Pass --clients to choose; the folders will be created.`);
      clients = CLIENT_NAMES; how = 'no client folder found, so all of them (use --clients to choose)';
    }
  }
  const dryRun = args.includes('--dry-run');
  const r = install(target, clients, { dryRun, force: args.includes('--force-all') ? 'all' : args.includes('--force') ? 'kit' : 'none', hooks: !args.includes('--no-hooks'), level, projects, previousClients: folderClient ? saved.clients ?? [] : [] });
  const label = level === 'workspace' ? `workspace (${projects.length} project${projects.length === 1 ? '' : 's'}: ${paths.join(', ') || 'none found; init will discover them'})` : level === 'user' ? `user (${resolve(target)})` : level;
  console.log(`${dryRun ? '[dry run] ' : ''}level: ${label}`);
  console.log(`clients: ${clients.join(', ')} (${how})`);
  console.log(`written: ${r.written.length}, unchanged: ${r.unchanged.length}, skipped: ${r.skipped.length}${r.removed.length ? `, ${dryRun ? 'to remove' : 'removed'} (obsolete light-kit files): ${r.removed.length}` : ''}`);
  for (const x of r.removed.slice(0, 8)) console.log(`  ${dryRun ? 'would remove' : 'removed'}: ${x}`);
  if (r.removed.length > 8) console.log(`  … and ${r.removed.length - 8} more`);
  for (const s of r.skipped) console.log(`  skipped (exists, not managed by light-kit): ${s}`);
  if (level === 'user') for (const c of clients) if (USER_NOTES[c]) console.log(`note: ${USER_NOTES[c]}`);
  if (clients.includes('codex') && level !== 'user') console.log('note: Codex custom prompts are user-level — copy .codex/prompts/* to ~/.codex/prompts/ to use them.');
  if (!args.includes('--no-hooks')) {
    console.log(`hooks: need Node 18+ on the machine that runs the AI client. Edit ${level === 'user' ? '~/' : ''}.light-kit/hooks.config.json to tune them.`);
    if (clients.includes('codex')) console.log('note: Codex asks you to review and trust new hooks — run /hooks in Codex once.');
  }
  if (level === 'user') console.log('user level: restart your AI clients. In each project, run the `light-init` command to enable the kit there (specs, profile, commit and branch workflow). Safety hooks (secrets, dangerous commands, sensitive files) already apply everywhere.');
  else if (level === 'workspace') console.log('workspace: start your AI client from this folder (not from a project inside it), then run the `light-init` command to register and profile each project.');
  else console.log('next: open your AI client and run the `light-init` command.');
}
