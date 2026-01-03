import { existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ts = require('typescript');

const root = fileURLToPath(new URL('./', import.meta.url));
const host = '127.0.0.1';
const port = Number(process.env.S01_PORT ?? 4174);

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.ts': 'text/javascript; charset=utf-8',
};

function fileForRequest(urlPath) {
  const decoded = decodeURIComponent((urlPath ?? '/').split('?')[0]);
  const relative = decoded === '/' ? 'bench.html' : decoded.replace(/^\/+/, '');
  const filePath = normalize(join(root, relative));
  const prefix = root.endsWith(sep) ? root : `${root}${sep}`;
  if (filePath !== root && !filePath.startsWith(prefix)) return null;
  return filePath;
}

function javascriptFor(filePath) {
  const source = readFileSync(filePath, 'utf8');
  const output = ts.transpileModule(source, {
    fileName: filePath,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
      verbatimModuleSyntax: true,
    },
  });
  return output.outputText;
}

const server = createServer((request, response) => {
  const filePath = fileForRequest(request.url);
  if (filePath === null || !existsSync(filePath) || !statSync(filePath).isFile()) {
    response.writeHead(filePath === null ? 403 : 404);
    response.end();
    return;
  }

  const extension = extname(filePath);
  if (extension === '.ts') {
    try {
      const javascript = javascriptFor(filePath);
      response.writeHead(200, { 'content-type': contentTypes['.ts'] });
      response.end(javascript);
    } catch (error) {
      response.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
      response.end(error instanceof Error ? error.message : 'transpile failed');
    }
    return;
  }

  const type = contentTypes[extension] ?? 'application/octet-stream';
  response.writeHead(200, { 'content-type': type });
  response.end(readFileSync(filePath));
});

server.listen(port, host, () => {
  process.stdout.write(`S-01 bench at http://${host}:${port}/bench.html\n`);
});
