#!/usr/bin/env node
// Project-only version bump for the light-kit repository.
// This file is repo tooling: it is NOT generated into client projects and is not part of the shared kit.
// Registered as a Stop hook in this project's .claude/settings.json (the user adds that block; the kit
// rules forbid the agent to edit hook registration files).
//
// Behaviour: for every request folder `specs/<NNN>-*` numbered above the recorded baseline whose
// `status.md` says `state: done` and which has not been applied yet, apply its `version_bump`
// (patch|minor|major, default patch) to package.json, in numeric order. Record each applied number in
// `.light-kit/version-bump.json`, and commit package.json plus that state file as
// `chore(release): vX.Y.Z` unless the branch is protected or the state sets `"commit": false`.
// Silent and fail-open: any error exits 0 and never blocks the agent.

import { readFileSync, readdirSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const LEVELS = ['patch', 'minor', 'major'];
const PROTECTED = ['main', 'master', 'trunk', 'develop', 'production'];
const VERSION = /^(\d+)\.(\d+)\.(\d+)$/;
const STATE_FILE = join('.light-kit', 'version-bump.json');
const STATE_VERSION = 1;

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const real = (p) => { try { return realpathSync(p); } catch { return resolve(p); } };

// 0.1.0 + patch -> 0.1.1; + minor -> 0.2.0; + major -> 1.0.0. Null when the version is not a numeric triple.
export function bumpVersion(version, level) {
  const m = VERSION.exec(String(version ?? ''));
  if (!m) return null;
  const [major, minor, patch] = m.slice(1).map(Number);
  if (level === 'major') return `${major + 1}.0.0`;
  if (level === 'minor') return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

// Front matter of a status file, or {} when the file is missing or has no opening delimiter.
export function readStatus(file) {
  let text = '';
  try { text = readFileSync(file, 'utf8'); } catch { return {}; }
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!m) return {};
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z_]\w*):\s*(.*)$/.exec(line);
    if (kv) meta[kv[1]] = kv[2].trim();
  }
  return meta;
}

// Request folders that carry a numeric prefix, sorted by number.
export function collect(root) {
  let entries = [];
  try { entries = readdirSync(join(root, 'specs'), { withFileTypes: true }); } catch { return []; }
  const out = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const n = /^(\d+)-/.exec(entry.name);
    if (!n) continue;
    const meta = readStatus(join(root, 'specs', entry.name, 'status.md'));
    const level = String(meta.version_bump ?? '').toLowerCase();
    out.push({ number: Number(n[1]), slug: entry.name, state: String(meta.state ?? ''), level });
  }
  return out.sort((a, b) => a.number - b.number);
}

// Sanitize every nested row: a malformed applied entry is dropped, never thrown on (R-002).
export function loadState(file) {
  let raw;
  try { raw = JSON.parse(readFileSync(file, 'utf8')); } catch { return null; }
  if (!isObject(raw) || raw.version !== STATE_VERSION) return null;
  const applied = {};
  if (isObject(raw.applied)) {
    for (const [key, value] of Object.entries(raw.applied)) {
      if (/^\d+$/.test(key) && typeof value === 'string') applied[key] = value;
    }
  }
  return {
    version: STATE_VERSION,
    file: typeof raw.file === 'string' && raw.file ? raw.file : 'package.json',
    baseline: Number.isInteger(raw.baseline) ? raw.baseline : null,
    commit: raw.commit !== false,
    applied,
  };
}

const writeState = (file, state) => {
  writeFileSync(file, JSON.stringify({
    version: STATE_VERSION,
    file: state.file,
    baseline: state.baseline,
    commit: state.commit,
    applied: state.applied,
  }, null, 2) + '\n');
};

const git = (root, args, timeout = 15000) => spawnSync('git', args, { cwd: root, encoding: 'utf8', timeout });

// The branch to commit onto: '' when there is no commit, a detached HEAD, or a protected branch.
function safeBranch(root) {
  if (git(root, ['rev-parse', '-q', '--verify', 'HEAD']).status !== 0) return '';
  const r = git(root, ['symbolic-ref', '--short', '-q', 'HEAD']);
  if (r.status !== 0) return '';
  const branch = r.stdout.trim();
  if (!branch || PROTECTED.includes(branch) || /^release\//.test(branch)) return '';
  return branch;
}

// Stage and commit exactly `paths`, leaving other staged work in place. A failed commit unstages them.
function commitPaths(root, paths, message) {
  if (!paths.length || !safeBranch(root)) return false;
  if (git(root, ['add', '--', ...paths]).status !== 0) return false;
  const r = git(root, ['commit', '-m', message, '--only', '--', ...paths], 20000);
  if (r.status !== 0) { git(root, ['reset', '-q', '--', ...paths]); return false; }
  return true;
}

// Apply every pending bump. `apply: false` computes the result without writing (dry run).
export function runVersionBump(root, { apply = true, log = () => {} } = {}) {
  const pkgFile = join(root, 'package.json');
  let pkg;
  try { pkg = JSON.parse(readFileSync(pkgFile, 'utf8')); } catch { return { changed: false, reason: 'no package.json' }; }
  if (!isObject(pkg) || pkg.name !== 'light-kit') return { changed: false, reason: 'not this project' };

  const specs = collect(root);
  const stateFile = join(root, STATE_FILE);
  let state = loadState(stateFile);

  // A missing or unreadable state seeds the baseline at the newest existing request: history never bumps.
  if (!state) {
    const baseline = specs.length ? Math.max(...specs.map((s) => s.number)) : 0;
    state = { version: STATE_VERSION, file: 'package.json', baseline, commit: true, applied: {} };
    if (apply) writeState(stateFile, state);
    return { changed: false, seeded: baseline, state };
  }

  const baseline = state.baseline ?? 0;
  const pending = specs.filter((s) => s.number > baseline && s.state === 'done' && !(String(s.number) in state.applied));
  if (!pending.length) return { changed: false, state };

  let version = String(pkg.version ?? '');
  const applied = [];
  for (const spec of pending) {
    const level = LEVELS.includes(spec.level) ? spec.level : 'patch';
    if (spec.level && !LEVELS.includes(spec.level)) log(`request ${spec.slug}: unknown version_bump "${spec.level}", using patch`);
    const next = bumpVersion(version, level);
    if (!next) return { changed: false, reason: `unusable version "${version}"`, state };
    version = next;
    state.applied[String(spec.number)] = next;
    applied.push({ number: String(spec.number), slug: spec.slug, level, version: next });
  }

  if (apply) {
    writeFileSync(pkgFile, JSON.stringify({ ...pkg, version }, null, 2) + '\n');
    writeState(stateFile, state);
    if (state.commit) commitPaths(root, ['package.json', STATE_FILE], `chore(release): v${version}`);
  }
  return { changed: true, version, applied, state };
}

if (real(process.argv[1] ?? '') === real(fileURLToPath(import.meta.url))) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const dryRun = process.argv.includes('--dry-run');
  const log = (message) => process.stderr.write(`version-bump: ${message}\n`);
  try {
    const result = runVersionBump(root, { apply: !dryRun, log });
    if (dryRun && result.changed) process.stderr.write(`version-bump: would set ${result.version} (${result.applied.map((a) => a.number).join(', ')})\n`);
    else if (dryRun && result.seeded !== undefined) process.stderr.write(`version-bump: would seed baseline ${result.seeded}\n`);
  } catch (e) {
    log(`ignored error: ${e.message}`);
  }
  process.exit(0);
}
