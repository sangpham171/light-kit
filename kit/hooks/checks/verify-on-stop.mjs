import { spawnSync } from 'node:child_process';
import { loadConfig } from '../lib/config.mjs';
import { listProjectDirs } from '../lib/specs.mjs';
import { changedFiles } from '../lib/git.mjs';

const tail = (r, n) => `${r.stdout ?? ''}${r.stderr ?? ''}`.trim().split('\n').slice(-n).join('\n');

export default {
  id: 'verify-on-stop',
  events: ['stop'],
  run(ctx, cfg) {
    if (ctx.stopActive) return null; // never loop: skip when already continuing because of a stop hook
    // The workspace's own command runs at the root; each project's command runs in the project, only if it has changes.
    const runs = [];
    if (cfg.verify) runs.push({ dir: ctx.root, cmd: cfg.verify, timeout: cfg.verifyTimeout, label: '' });
    for (const dir of listProjectDirs(ctx.root)) {
      const pc = loadConfig(ctx.layersFor(dir));
      if (!pc.verify || runs.some((r) => r.dir === dir && r.cmd === pc.verify)) continue;
      if (pc.verify === cfg.verify && runs.length) continue; // inherited from the workspace: already ran there
      if (changedFiles(dir) === 0) continue;
      runs.push({ dir, cmd: pc.verify, timeout: pc.verifyTimeout, label: ` in ${dir.slice(ctx.root.length + 1)}` });
    }
    const failures = [];
    for (const run of runs) {
      const r = spawnSync(run.cmd, { shell: true, cwd: run.dir, encoding: 'utf8', timeout: run.timeout * 1000 });
      if (r.status !== 0) failures.push(`verification command failed${run.label} (${run.cmd}). Fix the failures before finishing:\n${tail(r, 20)}`);
    }
    return failures.length ? { message: failures.join('\n') } : null;
  },
};
