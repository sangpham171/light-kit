import { findSecrets, describe } from '../lib/secrets.mjs';

export default {
  id: 'block-secrets-in-writes',
  events: ['pre-tool'],
  run(ctx, cfg) {
    if (ctx.tool.kind !== 'write' || !ctx.text) return null;
    const found = findSecrets(ctx.text, cfg.extraSecretPatterns);
    return found.length
      ? { message: `the content looks like it contains a secret: ${describe(found)}. Read the value from the environment or a secret store instead of writing it into a file, and use a placeholder in templates.` }
      : null;
  },
};
