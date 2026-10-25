import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

// Once per model: suggest auditing the kit when the model in use differs from the one it was last audited with.
export default {
  id: 'audit-reminder',
  events: ['session-start'],
  run(ctx, cfg) {
    if (!cfg.auditRemind || !ctx.model) return null; // clients that do not report a model are left alone
    const file = join(ctx.kitHome, '.light-kit', 'audits', 'state.json');
    let state = {};
    try { state = JSON.parse(readFileSync(file, 'utf8')); } catch { /* never audited */ }
    if (state.auditedModel === ctx.model || state.remindedModel === ctx.model) return null;
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify({ ...state, remindedModel: ctx.model }, null, 2) + '\n');
    return { message: `light-kit was ${state.auditedModel ? `last audited with ${state.auditedModel}` : 'never audited'} and you are now on ${ctx.model}. A newer model may need less guidance: run the \`light-audit\` command to see what the kit could drop (optional, shown once per model).` };
  },
};
