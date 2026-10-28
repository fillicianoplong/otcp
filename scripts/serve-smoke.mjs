import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../e2e/fixture/', import.meta.url));
const host = '127.0.0.1';
const port = 4173;

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
};

function fileForRequest(urlPath) {
  const decoded = decodeURIComponent((urlPath ?? '/').split('?')[0]);
  const relative = decoded === '/' ? 'index.html' : decoded.replace(/^\/+/, '');
  const filePath = normalize(join(root, relative));
  const prefix = root.endsWith(sep) ? root : `${root}${sep}`;
  if (filePath !== root && !filePath.startsWith(prefix)) {
    return null;
  }
  return filePath;
}

const server = createServer((request, response) => {
  const filePath = fileForRequest(request.url);
  if (filePath === null || !existsSync(filePath) || !statSync(filePath).isFile()) {
    response.writeHead(filePath === null ? 403 : 404);
    response.end();
    return;
  }

  const type = contentTypes[extname(filePath)] ?? 'application/octet-stream';
  response.writeHead(200, { 'content-type': type });
  createReadStream(filePath).pipe(response);
});

server.listen(port, host, () => {
  process.stdout.write(`Smoke page at http://${host}:${port}/\n`);
});
