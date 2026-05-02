const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.map':  'application/json; charset=utf-8',
  '.txt':  'text/plain; charset=utf-8',
};

const NO_CACHE = { 'Cache-Control': 'no-cache, no-store, must-revalidate', Pragma: 'no-cache', Expires: '0' };

function serveIndex(res) {
  fs.readFile(path.join(ROOT, 'index.html'), (e, data) => {
    if (e) { res.writeHead(404, NO_CACHE); return res.end('Not Found'); }
    res.writeHead(200, { ...NO_CACHE, 'Content-Type': 'text/html; charset=utf-8' });
    res.end(data);
  });
}

http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  const safe = path.normalize(urlPath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(ROOT, safe);

  if (!filePath.startsWith(ROOT)) { res.writeHead(403, NO_CACHE); return res.end('Forbidden'); }
  if (urlPath === '/' || urlPath === '') return serveIndex(res);

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) return serveIndex(res); // SPA fallback
    const type = MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    fs.readFile(filePath, (e, data) => {
      if (e) { res.writeHead(500, NO_CACHE); return res.end('Error'); }
      res.writeHead(200, { ...NO_CACHE, 'Content-Type': type });
      res.end(data);
    });
  });
}).listen(PORT, HOST, () => console.log(`Serving on http://${HOST}:${PORT}`));
