import { matchesAny } from '../lib/glob.mjs';
import { activeRequests } from '../lib/specs.mjs';

export default {
  id: 'require-spec',
  events: ['pre-tool'],
  run(ctx, cfg) {
    if (ctx.tool.kind !== 'write') return null;
    const targets = ctx.files.map((f) => ctx.rel(f)).filter((r) => !matchesAny(cfg.specExempt, r));
    if (!targets.length || activeRequests(ctx.root).length) return null;
    return { message: `no active request found in specs/ (needs 00-request.md and 10-understanding.md, state not done) before changing "${targets[0]}". Start one with the \`request\` command.` };
  },
};
