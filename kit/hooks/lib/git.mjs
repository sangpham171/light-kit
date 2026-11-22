import { spawnSync } from 'node:child_process';
import { globToRegExp } from './glob.mjs';

const git = (root, args, timeout = 5000) => spawnSync('git', args, { cwd: root, encoding: 'utf8', timeout });

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

// Paths with uncommitted changes (staged, unstaged or untracked) under `dir`, as git reports them.
export function uncommittedPaths(dir) {
  const r = git(dir, ['status', '--porcelain', '-z', '--untracked-files=all', '--', '.']);
  if (r.status !== 0) return [];
  const parts = r.stdout.split('\0');
  const paths = [];
  for (let i = 0; i < parts.length; i += 1) {
    const entry = parts[i];
    if (entry.length < 4) continue;
    const code = entry.slice(0, 2);
    paths.push(entry.slice(3));
    if (code[0] === 'R' || code[0] === 'C') i += 1; // a rename/copy entry names the original path next
  }
  return paths;
}

// Stage and commit exactly `paths`; other uncommitted changes stay as they are.
export function commitPaths(dir, paths, message) {
  if (!paths.length) return false;
  if (git(dir, ['add', '--', ...paths]).status !== 0) return false;
  return git(dir, ['commit', '-m', message, '--only', '--', ...paths], 20000).status === 0;
}
