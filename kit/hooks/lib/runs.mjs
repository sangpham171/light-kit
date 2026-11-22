// The `runs:` entries of an artifact header: one per agent run, in the order the runs happened.
// Only the block sequence under `runs:` counts; a conclusion's `usage:` block also has `- step:`
// rows, so parsing stops at the first `usage:` line. Readers are best-effort: anything unreadable
// yields no entries, never an error.

export const headerOf = (text) => String(text ?? '').match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';

// A field may share the `- ` line with the agent or sit on an indented line below it.
const value = (block, key) => {
  const raw = block.match(new RegExp(`(?:^|\\n)\\s*(?:-\\s+)?${key}:\\s*(.*)`))?.[1] ?? '';
  return raw.trim().replace(/^"(.*)"$/, '$1');
};

export function runsOf(text) {
  const header = headerOf(text);
  return header.split(/\nusage:/)[0]
    .split(/\n(?=\s*- )/)
    .filter((block) => /^\s*- /.test(block) && /\bagent:/.test(block))
    .map((block) => ({
      block,
      agent: value(block, 'agent'),
      part: value(block, 'part'),
      model: value(block, 'model'),
      thinking: value(block, 'thinking'),
      level: value(block, 'level'),
    }));
}
