import { findSecrets, describe } from '../lib/secrets.mjs';

export default {
  id: 'redact-prompt-secrets',
  events: ['prompt'],
  run(ctx, cfg) {
    const found = findSecrets(ctx.prompt, cfg.extraSecretPatterns);
    return found.length
      ? { message: `your prompt seems to contain a secret: ${describe(found)}. Remove it and refer to it by name (for example "the API token in the environment"), then resend. Treat the exposed value as compromised if it was real.` }
      : null;
  },
};
