import { mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

/** Write UTF-8 text via a same-directory temp file and rename (atomic on POSIX). */
export function atomicWriteUtf8(finalPath: string, contents: string): void {
  const dir = dirname(finalPath);
  mkdirSync(dir, { recursive: true });
  const tempPath = join(dir, `.${basename(finalPath)}.${process.pid}.${Date.now()}.tmp`);
  writeFileSync(tempPath, contents, { encoding: 'utf8', mode: 0o644 });
  renameSync(tempPath, finalPath);
}

export function atomicWriteJson(finalPath: string, value: unknown): void {
  atomicWriteUtf8(finalPath, `${JSON.stringify(value, null, 2)}\n`);
}
