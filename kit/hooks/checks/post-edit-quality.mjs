import { spawnSync } from 'node:child_process';
import { relative, resolve } from 'node:path';
import { realish } from '../lib/paths.mjs';
import { shellQuote } from '../lib/shell.mjs';

export default {
  id: 'post-edit-quality',
  events: ['post-tool'],
  run(ctx, cfg) {
    if (ctx.tool.kind !== 'write' || !ctx.files.length) return null;
    const problems = [];
    for (const [label, tpl] of [['format', cfg.format], ['lint', cfg.lint]]) {
      if (!tpl) continue;
      for (const f of ctx.files) {
        const cmd = tpl.replaceAll('{file}', shellQuote(relative(ctx.scope, realish(resolve(ctx.cwd, f))))); // paths are relative to the project, whose commands run in its own folder
        const r = spawnSync(cmd, { shell: true, cwd: ctx.scope, encoding: 'utf8', timeout: cfg.qualityTimeout * 1000 });
        if (r.status !== 0) problems.push(`${label} failed for ${ctx.rel(f)}:\n${`${r.stdout ?? ''}${r.stderr ?? ''}`.trim().split('\n').slice(-15).join('\n')}`);
      }
    }
    return problems.length ? { message: problems.join('\n') } : null;
  },
};
