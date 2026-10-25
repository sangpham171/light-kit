import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { changedFiles } from '../lib/git.mjs';

const readProfile = (dir) => { try { return readFileSync(join(dir, '.light-kit', 'project-profile.md'), 'utf8'); } catch { return ''; } };

// Nudge: after edits, if too many files of this project are uncommitted, ask the agent to commit the finished coherent unit.
export default {
  id: 'commit-checkpoint',
  events: ['post-tool'],
  run(ctx, cfg) {
    if (ctx.tool.kind !== 'write' || !ctx.kitEnabled) return null;
    const profile = readProfile(ctx.scope) || readProfile(ctx.root); // the project's own policy first, then the workspace default
    if (/^Mode:\s*off\b/im.test(profile)) return null; // commits disabled by the project
    const count = changedFiles(ctx.workDir);
    return count >= cfg.maxUncommitted
      ? { message: `${count} files have uncommitted changes. If a coherent unit (a validated artifact, a finished plan task, a review fix) is complete, commit it now with the \`light-commit\` skill before continuing. Do not let changes pile up into one big commit.` }
      : null;
  },
};
