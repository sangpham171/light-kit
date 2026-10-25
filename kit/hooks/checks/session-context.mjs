import { existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { activeRequests, listProjectDirs } from '../lib/specs.mjs';
import { detectEffort } from '../lib/effort.mjs';

export default {
  id: 'session-context',
  events: ['session-start'],
  run(ctx, cfg) {
    if (ctx.userLevel && !ctx.kitEnabled) {
      return cfg.suggestInit ? { message: 'light-kit is installed for your user but not set up in this project. Safety hooks apply here. To enable specs, the profile and the commit and branch workflow, run the `light-init` command.' } : null;
    }
    const lines = [];
    const kit = (dir, file) => existsSync(join(dir, '.light-kit', file));
    if (kit(ctx.root, 'projects.md')) lines.push('light-kit: this is a multi-project workspace. Read .light-kit/projects.md, then apply the `light-project-scope` skill to pick the project(s) before working; each project has its own .light-kit/ profile and map.');
    else if (kit(ctx.root, 'project-profile.md')) lines.push('light-kit: read .light-kit/project-profile.md before working' + (kit(ctx.root, 'codebase-map.md') ? ' and .light-kit/codebase-map.md for the structure.' : '.'));
    const projects = listProjectDirs(ctx.root);
    for (const r of activeRequests(ctx.root, ...projects)) {
      const where = join(relative(ctx.root, r.home), 'specs', r.name);
      lines.push(`Active request ${where}${r.workflow ? ` (${r.workflow} workflow)` : ''}: step ${r.step || 'unknown'}, state ${r.state || 'unknown'}${r.work_branch ? `, branch ${r.work_branch}` : ''}${r.base_commit && r.base_commit !== 'none' ? ` (started at ${r.base_commit.slice(0, 8)})` : ''}.`);
    }
    const effort = detectEffort(ctx);
    if (effort) lines.push(`The client reports thinking effort "${effort}"; use it as \`thinking:\` in the \`runs:\` headers you write.`);
    return lines.length ? { message: lines.join('\n') } : null;
  },
};
