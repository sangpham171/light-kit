import { matchesAny } from '../lib/glob.mjs';
import { activeRequests } from '../lib/specs.mjs';

export default {
  id: 'require-spec',
  events: ['pre-tool'],
  run(ctx, cfg) {
    if (ctx.tool.kind !== 'write' || !ctx.kitEnabled) return null; // user level: only in projects that use the kit
    const targets = ctx.files.map((f) => ctx.rel(f)).filter((r) => !matchesAny(cfg.specExempt, r));
    if (!targets.length || activeRequests(ctx.scope, ctx.root).length) return null;
    return { message: `no active request found in specs/ of the project or the workspace (needs 00-request.md and 10-understanding.md, state not done) before changing "${targets[0]}". Start one with the \`light-request\` command.` };
  },
};
