import { spawnSync } from 'node:child_process';
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
        const cmd = tpl.replaceAll('{file}', shellQuote(ctx.rel(f)));
        const r = spawnSync(cmd, { shell: true, cwd: ctx.root, encoding: 'utf8', timeout: cfg.qualityTimeout * 1000 });
        if (r.status !== 0) problems.push(`${label} failed for ${ctx.rel(f)}:\n${`${r.stdout ?? ''}${r.stderr ?? ''}`.trim().split('\n').slice(-15).join('\n')}`);
      }
    }
    return problems.length ? { message: problems.join('\n') } : null;
  },
};
