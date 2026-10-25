import { spawnSync } from 'node:child_process';

export default {
  id: 'verify-on-stop',
  events: ['stop'],
  run(ctx, cfg) {
    if (!cfg.verify || ctx.stopActive) return null; // never loop: skip when already continuing because of a stop hook
    const r = spawnSync(cfg.verify, { shell: true, cwd: ctx.root, encoding: 'utf8', timeout: cfg.verifyTimeout * 1000 });
    if (r.status === 0) return null;
    return { message: `verification command failed (${cfg.verify}). Fix the failures before finishing:\n${`${r.stdout ?? ''}${r.stderr ?? ''}`.trim().split('\n').slice(-20).join('\n')}` };
  },
};
