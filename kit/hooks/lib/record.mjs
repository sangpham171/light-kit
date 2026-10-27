import { closeSync, openSync, readSync } from 'node:fs';

// Client session records are large and the fields the kit reads sit in their opening lines.
export const HEAD_BYTES = 128 * 1024;

export function readHead(file, bytes = HEAD_BYTES) {
  let fd;
  try {
    fd = openSync(file, 'r');
    const buffer = Buffer.alloc(bytes);
    return buffer.toString('utf8', 0, readSync(fd, buffer, 0, bytes, 0));
  } catch { return ''; } finally {
    if (fd !== undefined) { try { closeSync(fd); } catch { /* already closed */ } }
  }
}

export const scalar = (v) => (typeof v === 'string' ? v.trim().replace(/^["']|["']$/g, '') : '');
