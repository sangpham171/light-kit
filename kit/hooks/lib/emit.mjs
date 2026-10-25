// Turn check results into each client's response. Blocking uses exit code 2 + stderr, which every supported client honours.
const CLAUDE_EVENT = { 'pre-tool': 'PreToolUse', 'post-tool': 'PostToolUse', prompt: 'UserPromptSubmit', 'session-start': 'SessionStart', stop: 'Stop' };
const json = (o) => JSON.stringify(o);

export function respond(ctx, { denies = [], notes = [], stopBlock = '' }) {
  const { client, event } = ctx;
  if (denies.length && (event === 'pre-tool' || event === 'prompt'))
    return { code: 2, stdout: '', stderr: `light-kit blocked this: ${denies.join(' | ')}\n` };
  const all = [...(event === 'pre-tool' || event === 'prompt' ? [] : denies), ...notes];
  if (event === 'stop' && stopBlock) {
    if (client === 'claude' || client === 'codex') return { code: 0, stdout: json({ decision: 'block', reason: stopBlock }), stderr: '' };
    if (client === 'cursor') return { code: 0, stdout: json({ followup_message: stopBlock }), stderr: '' };
  }
  if (!all.length) return { code: 0, stdout: '', stderr: '' };
  const text = all.join('\n');
  if (client === 'claude' || client === 'codex')
    return { code: 0, stdout: json({ hookSpecificOutput: { hookEventName: CLAUDE_EVENT[event], additionalContext: text } }), stderr: '' };
  if (client === 'cursor') {
    const body = event === 'pre-tool' ? { permission: 'allow', agent_message: text } : event === 'prompt' ? { continue: true, user_message: text } : { additional_context: text };
    return { code: 0, stdout: json(body), stderr: '' };
  }
  if (event === 'post-tool' || event === 'session-start') return { code: 0, stdout: json({ additionalContext: text }), stderr: '' };
  return { code: 0, stdout: '', stderr: `${text}\n` };
}
