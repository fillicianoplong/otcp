import { copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/** GitHub Pages SPA fallback: serve index.html for deep links under /otcp/. */
export function copyIndexHtmlTo404(distDir: string): void {
  const indexPath = join(distDir, 'index.html');
  const notFoundPath = join(distDir, '404.html');

  if (!existsSync(indexPath)) {
    throw new Error(`Expected build output at ${indexPath}`);
  }

  copyFileSync(indexPath, notFoundPath);
}
