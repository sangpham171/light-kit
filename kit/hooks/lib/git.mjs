import { spawnSync } from 'node:child_process';
import { globToRegExp } from './glob.mjs';

const git = (root, args) => spawnSync('git', args, { cwd: root, encoding: 'utf8', timeout: 5000 });

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
