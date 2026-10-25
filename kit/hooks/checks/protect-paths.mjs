import { matchesAny } from '../lib/glob.mjs';
import { segments, words } from '../lib/shell.mjs';

const MUTATORS = new Set(['rm', 'mv', 'tee', 'truncate', 'cp', 'ln', 'sed', 'chmod', 'chown']);

export default {
  id: 'protect-paths',
  events: ['pre-tool'],
  run(ctx, cfg) {
    const why = 'This path is protected (version-control internals, hook configuration, or a project-declared generated/locked path). Ask the user to change it.';
    if (ctx.tool.kind === 'write')
      for (const f of ctx.files) { const r = ctx.rel(f); if (matchesAny(cfg.protectedPaths, r)) return { message: `"${r}" is protected. ${why}` }; }
    if (ctx.tool.kind === 'shell')
      for (const seg of segments(ctx.command)) {
        const w = words(seg);
        if (!MUTATORS.has(w[0])) continue;
        for (const t of w.slice(1)) if (!t.startsWith('-') && matchesAny(cfg.protectedPaths, ctx.rel(t))) return { message: `the command modifies protected path "${t}". ${why}` };
      }
    return null;
  },
};
