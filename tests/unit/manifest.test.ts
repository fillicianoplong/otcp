import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const publicDir = join(process.cwd(), 'public');

type WebManifest = {
  icons?: Array<{ src: string; sizes: string; type?: string }>;
};

describe('manifest.webmanifest', () => {
  it('parses and lists 192 and 512 icons that exist in public/', () => {
    const manifestPath = join(publicDir, 'manifest.webmanifest');
    const raw = readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(raw) as WebManifest;

    expect(manifest.icons).toBeDefined();
    const bySize = new Map((manifest.icons ?? []).map((icon) => [icon.sizes, icon] as const));

    for (const size of ['192x192', '512x512'] as const) {
      const entry = bySize.get(size);
      expect(entry, `missing ${size} icon entry`).toBeDefined();
      const filePath = join(publicDir, entry!.src);
      expect(existsSync(filePath), `${entry!.src} should exist`).toBe(true);
    }
  });
});
