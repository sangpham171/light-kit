import { segments, words } from '../lib/shell.mjs';
import { currentBranch, isProtectedBranch, gitSubcommand } from '../lib/git.mjs';

const COMMIT_MAKERS = new Set(['commit', 'merge', 'cherry-pick', 'revert']);

export default {
  id: 'protect-branches',
  events: ['pre-tool'],
  run(ctx, cfg) {
    if (ctx.tool.kind !== 'shell' || !/\bgit\b/.test(ctx.command)) return null;
    const sub = segments(ctx.command).map((s) => gitSubcommand(words(s))).find((c) => COMMIT_MAKERS.has(c));
    if (!sub) return null;
    const branch = currentBranch(ctx.root);
    if (!branch || !isProtectedBranch(ctx.root, branch, cfg.protectedBranches)) return null;
    return { message: `"git ${sub}" on protected branch "${branch}". Create a work branch first (\`request-branch\` skill: git checkout -b <type>/<NNN-slug>), then commit there.` };
  },
};
