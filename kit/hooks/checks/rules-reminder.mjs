import { existsSync } from 'node:fs';
import { join } from 'node:path';

// No pattern list: no word list covers every language, and the agent can read the user's
// message itself. This reminder states the triggers once per session; the `rules` workflow
// step is what guarantees the rule is recorded.
const hasRules = (ctx) => [ctx.scope, ctx.root].some((dir) => dir && existsSync(join(dir, '.light-kit/rules.md')));

export default {
  id: 'rules-reminder',
  events: ['session-start'],
  run(ctx) {
    if (!ctx.kitEnabled || !hasRules(ctx)) return null;
    return {
      message: 'rules are recorded when a failure appears, not only after a review: a user-reported bug or regression, a failed test, build, lint or manual check, a review, tester or security finding, and a correction all count. If the user reports that earlier work is broken, apply the `light-rules` skill before fixing it: record the rule that should have prevented it, or add a `pending` rule with the report and the earlier request as evidence.',
    };
  },
};
