import { spawnSync } from 'node:child_process';
import { relative, resolve } from 'node:path';
import { globToRegExp } from './glob.mjs';

const git = (root, args, timeout = 5000, maxBuffer = 1024 * 1024) => spawnSync('git', args, { cwd: root, encoding: 'utf8', timeout, maxBuffer });

export const BUILTIN_PROTECTED_BRANCHES = ['main', 'master', 'trunk', 'develop', 'production', 'release/*'];

// null when not a repository, has no commit yet, or HEAD is detached (nothing protected to commit onto).
export function currentBranch(root) {
  if (git(root, ['rev-parse', '-q', '--verify', 'HEAD']).status !== 0) return null;
  const r = git(root, ['symbolic-ref', '--short', '-q', 'HEAD']);
  return r.status === 0 ? r.stdout.trim() : null;
}

export function isProtectedBranch(root, branch, extra = []) {
  const remote = git(root, ['symbolic-ref', '--short', '-q', 'refs/remotes/origin/HEAD']);
  const remoteDefault = remote.status === 0 ? remote.stdout.trim().replace(/^[^/]+\//, '') : '';
  return [...BUILTIN_PROTECTED_BRANCHES, ...extra, remoteDefault].filter(Boolean).some((g) => globToRegExp(g).test(branch));
}

// Subcommand of a "git ..." word list, skipping global options such as -C <dir> and -c <k=v>.
export function gitSubcommand(w) {
  if (w[0] !== 'git') return '';
  let i = 1;
  while (i < w.length && w[i].startsWith('-')) i += ['-C', '-c'].includes(w[i]) ? 2 : 1;
  return w[i] ?? '';
}

// Directory given with "git -C <dir>", if any.
export function gitDirArg(w) {
  const i = w.indexOf('-C');
  return w[0] === 'git' && i > 0 ? w[i + 1] : '';
}

export const inRepo = (dir) => git(dir, ['rev-parse', '--is-inside-work-tree']).status === 0;
export const changedFiles = (dir) => {
  const r = git(dir, ['status', '--porcelain', '--', '.']);
  return r.status === 0 ? r.stdout.split('\n').filter(Boolean).length : -1; // -1: not a repository
};

// The repository root above `dir`, or '' when `dir` is not inside a repository.
export const repoRoot = (dir) => {
  const r = git(dir, ['rev-parse', '--show-toplevel']);
  return r.status === 0 ? r.stdout.trim() : '';
};

const UNMERGED = new Set(['DD', 'AU', 'UD', 'UA', 'DU', 'AA', 'UU']);
export const isUnmerged = (code) => UNMERGED.has(code);

// Uncommitted entries under `dir` (staged, unstaged or untracked). Paths are repository-root relative,
// as git always reports them, so they can be passed to git run at `root`. A rename or copy yields both
// the destination and the original path.
export function statusEntries(dir) {
  const root = repoRoot(dir);
  if (!root) return { root: '', entries: [] };
  const r = git(root, ['status', '--porcelain', '-z', '--untracked-files=all', '--', relative(root, resolve(dir)) || '.'], 5000, 64 * 1024 * 1024);
  if (r.status !== 0) return { root, entries: [] }; // -1-like: unreadable or truncated status
  const parts = r.stdout.split('\0');
  const entries = [];
  for (let i = 0; i < parts.length; i += 1) {
    const entry = parts[i];
    if (entry.length < 4) continue;
    const code = entry.slice(0, 2);
    entries.push({ code, path: entry.slice(3) });
    if (code[0] === 'R' || code[0] === 'C') {
      const from = parts[i + 1];
      if (from) { entries.push({ code: 'R ', path: from }); i += 1; }
    }
  }
  return { root, entries };
}

// Stage and commit exactly `paths` (repository-root relative); other uncommitted changes stay as they are.
// A failed commit unstages them again so the index is left as it was found.
export function commitPaths(root, paths, message) {
  if (!paths.length) return false;
  if (git(root, ['add', '--', ...paths]).status !== 0) return false;
  const r = git(root, ['commit', '-m', message, '--only', '--', ...paths], 20000);
  if (r.status !== 0) git(root, ['reset', '-q', '--', ...paths]);
  return r.status === 0;
}
