import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname, isAbsolute, join } from 'node:path';
import { redact } from '../lib/secrets.mjs';

export default {
  id: 'audit-log',
  events: ['pre-tool', 'post-tool', 'prompt'],
  run(ctx, cfg) {
    const entry = { ts: new Date().toISOString(), client: ctx.client, event: ctx.event, tool: ctx.tool.name || undefined, files: ctx.files.length ? ctx.files.map((f) => ctx.rel(f)) : undefined, command: ctx.command ? redact(ctx.command, cfg.extraSecretPatterns).slice(0, 500) : undefined };
    const file = isAbsolute(cfg.auditFile) ? cfg.auditFile : join(ctx.root, cfg.auditFile);
    mkdirSync(dirname(file), { recursive: true });
    appendFileSync(file, JSON.stringify(entry) + '\n');
    return null;
  },
};
