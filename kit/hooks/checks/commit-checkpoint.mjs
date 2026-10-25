import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Nudge: after edits, if too many files are uncommitted, ask the agent to commit the finished coherent unit.
export default {
  id: 'commit-checkpoint',
  events: ['post-tool'],
  run(ctx, cfg) {
    if (ctx.tool.kind !== 'write') return null;
    try {
      const profile = readFileSync(join(ctx.root, '.light-kit', 'project-profile.md'), 'utf8');
      if (/^Mode:\s*off\b/im.test(profile)) return null; // commits disabled by the project
    } catch { /* no profile yet */ }
    const r = spawnSync('git', ['status', '--porcelain'], { cwd: ctx.root, encoding: 'utf8', timeout: 5000 });
    if (r.status !== 0) return null; // not a repository, or git unavailable
    const count = r.stdout.split('\n').filter(Boolean).length;
    return count >= cfg.maxUncommitted
      ? { message: `${count} files have uncommitted changes. If a coherent unit (a validated artifact, a finished plan task, a review fix) is complete, commit it now with the \`commit\` skill before continuing. Do not let changes pile up into one big commit.` }
      : null;
  },
};
