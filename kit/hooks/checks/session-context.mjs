import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { activeRequests } from '../lib/specs.mjs';

export default {
  id: 'session-context',
  events: ['session-start'],
  run(ctx) {
    const lines = [];
    if (existsSync(join(ctx.root, '.light-kit', 'project-profile.md'))) lines.push('light-kit: read .light-kit/project-profile.md before working' + (existsSync(join(ctx.root, '.light-kit', 'codebase-map.md')) ? ' and .light-kit/codebase-map.md for the structure.' : '.'));
    for (const r of activeRequests(ctx.root)) lines.push(`Active request specs/${r.name}${r.workflow ? ` (${r.workflow} workflow)` : ''}: step ${r.step || 'unknown'}, state ${r.state || 'unknown'}.`);
    return lines.length ? { message: lines.join('\n') } : null;
  },
};
