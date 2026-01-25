import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

export function sha256Hex(buffer: Buffer | string): string {
  return createHash('sha256').update(buffer).digest('hex');
}

export function sha256HexFile(path: string): string {
  return sha256Hex(readFileSync(path));
}
