import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, 'dist/static-site');
const PORT = Number(process.env.PORT || 4173);
const MIME_TYPES = {
  '.html': 'text/html;charset=utf-8',
  '.js': 'text/javascript;charset=utf-8',
  '.css': 'text/css;charset=utf-8',
  '.json': 'application/json;charset=utf-8',
  '.webmanifest': 'application/manifest+json;charset=utf-8',
  '.svg': 'image/svg+xml;charset=utf-8'
};

function resolveRequestPath(url) {
  const parsedUrl = new URL(url, `http://localhost:${PORT}`);
  const pathname = decodeURIComponent(parsedUrl.pathname);
  const requestedPath = pathname === '/' ? '/index.html' : pathname;
  const absolutePath = path.normalize(path.join(PUBLIC_DIR, requestedPath));
  if (!absolutePath.startsWith(PUBLIC_DIR)) return null;
  return absolutePath;
}

const server = http.createServer((request, response) => {
  const filePath = resolveRequestPath(request.url);
  const resolvedFilePath = filePath && fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()
    ? path.join(filePath, 'index.html')
    : filePath;
  if (!resolvedFilePath || !fs.existsSync(resolvedFilePath) || fs.statSync(resolvedFilePath).isDirectory()) {
    response.writeHead(404, { 'Content-Type': 'text/plain;charset=utf-8' });
    response.end('Not found');
    return;
  }
  const contentType = MIME_TYPES[path.extname(resolvedFilePath)] || 'application/octet-stream';
  response.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(resolvedFilePath).pipe(response);
});

server.listen(PORT, () => {
  console.log(`# static preview ready`);
  console.log(`- http://localhost:${PORT}/web/`);
  console.log(`- serving ${PUBLIC_DIR}`);
});
