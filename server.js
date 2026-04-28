const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
    ...headers,
  });
  res.end(body);
}

function serveFile(filePath, res) {
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) return serveIndex(res);
    const ext = path.extname(filePath).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    fs.readFile(filePath, (e, data) => {
      if (e) return send(res, 500, 'Internal Server Error');
      send(res, 200, data, { 'Content-Type': type });
    });
  });
}

function serveIndex(res) {
  fs.readFile(path.join(ROOT, 'index.html'), (e, data) => {
    if (e) return send(res, 404, 'Not Found');
    send(res, 200, data, { 'Content-Type': 'text/html; charset=utf-8' });
  });
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  const safe = path.normalize(urlPath).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(ROOT, safe);
  if (!filePath.startsWith(ROOT)) return send(res, 403, 'Forbidden');
  if (urlPath === '/' || urlPath === '') return serveIndex(res);
  serveFile(filePath, res);
});

server.listen(PORT, HOST, () => {
  console.log(`Static server running at http://${HOST}:${PORT}`);
});
