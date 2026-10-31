import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

type NoticesFile = {
  dependencies: Array<{ name: string; version: string; license: string; link: string }>;
};

describe('notices.json', () => {
  it('lists every direct dependency from package.json', () => {
    const root = process.cwd();
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>;
    };
    const notices = JSON.parse(
      readFileSync(join(root, 'src/data/notices.json'), 'utf8'),
    ) as NoticesFile;

    const declared = Object.keys(pkg.dependencies ?? {}).sort();
    const listed = notices.dependencies.map((dep) => dep.name).sort();

    expect(listed).toEqual(declared);
    for (const dep of notices.dependencies) {
      expect(dep.version.length).toBeGreaterThan(0);
      expect(dep.license.length).toBeGreaterThan(0);
      expect(dep.link).toMatch(/^https:\/\//);
    }
  });
});
