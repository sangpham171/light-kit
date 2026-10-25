import { findSecrets, describe } from '../lib/secrets.mjs';

export default {
  id: 'warn-secret-output',
  events: ['post-tool'],
  run(ctx, cfg) {
    const found = findSecrets(ctx.output, cfg.extraSecretPatterns);
    return found.length
      ? { message: `the output of ${ctx.tool.name || 'the last tool'} contains something that looks like a secret (${describe(found)}). Do not repeat or store it, and tell the user it may need rotating.` }
      : null;
  },
};
