import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { copyIndexHtmlTo404 } from '../../scripts/copySpa404.ts';

describe('copyIndexHtmlTo404', () => {
  it('copies index.html to 404.html in the dist directory', () => {
    const distDir = mkdtempSync(join(tmpdir(), 'otcp-dist-'));
    const nested = join(distDir, 'assets');
    mkdirSync(nested);
    writeFileSync(join(distDir, 'index.html'), '<!doctype html><title>otcp</title>');
    writeFileSync(join(nested, 'app.js'), 'console.log("ok")');

    copyIndexHtmlTo404(distDir);

    expect(readFileSync(join(distDir, '404.html'), 'utf8')).toBe(
      readFileSync(join(distDir, 'index.html'), 'utf8'),
    );
  });

  it('throws when index.html is missing', () => {
    const distDir = mkdtempSync(join(tmpdir(), 'otcp-empty-'));
    expect(() => copyIndexHtmlTo404(distDir)).toThrow(/index\.html/);
  });
});
