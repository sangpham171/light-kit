import { segments, words } from '../lib/shell.mjs';
import { resolve } from 'node:path';
import { currentBranch, isProtectedBranch, gitSubcommand, gitDirArg } from '../lib/git.mjs';

const COMMIT_MAKERS = new Set(['commit', 'merge', 'cherry-pick', 'revert']);

export default {
  id: 'protect-branches',
  events: ['pre-tool'],
  run(ctx, cfg) {
    if (ctx.tool.kind !== 'shell' || !ctx.kitEnabled || !/\bgit\b/.test(ctx.command)) return null; // the branch workflow belongs to projects that use the kit
    let sub = '', dir = ctx.workDir;
    for (const seg of segments(ctx.command)) {
      const w = words(seg);
      const c = gitSubcommand(w);
      if (COMMIT_MAKERS.has(c)) { sub = c; if (gitDirArg(w)) dir = resolve(ctx.cwd, gitDirArg(w)); break; }
    }
    if (!sub) return null;
    const branch = currentBranch(dir);
    if (!branch || !isProtectedBranch(dir, branch, cfg.protectedBranches)) return null;
    return { message: `"git ${sub}" on protected branch "${branch}". Create a work branch first (\`request-branch\` skill: git checkout -b <type>/<NNN-slug>), then commit there.` };
  },
};
