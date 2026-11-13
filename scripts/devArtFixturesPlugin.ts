import { createReadStream, existsSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Plugin } from 'vite';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const devArtRoot = join(repoRoot, 'e2e/fixtures/dev-art');
const urlPrefix = '/otcp/dev-art';

function devArtMiddleware(req: IncomingMessage, res: ServerResponse, next: () => void): void {
  const pathname = req.url?.split('?')[0] ?? '';
  if (!pathname.startsWith(`${urlPrefix}/`)) {
    next();
    return;
  }
  const relative = decodeURIComponent(pathname.slice(urlPrefix.length + 1));
  const filePath = normalize(join(devArtRoot, relative));
  if (!filePath.startsWith(normalize(`${devArtRoot}/`)) || !existsSync(filePath)) {
    next();
    return;
  }
  res.setHeader('Content-Type', 'image/webp');
  createReadStream(filePath).pipe(res);
}

/** Serves e2e/fixtures/dev-art at /otcp/dev-art during dev and preview only (not in dist). */
export function devArtFixturesPlugin(): Plugin {
  return {
    name: 'otcp-dev-art-fixtures',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(devArtMiddleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(devArtMiddleware);
    },
  };
}
