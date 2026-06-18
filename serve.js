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

// Pays Afrique francophone
const AF_FR = new Set(['BJ','BF','BI','CM','CF','TD','KM','CG','CD','CI','DJ','GA','GN','GW','MG','ML','MR','MU','MA','NE','RW','SN','SC','TG','TN']);

// Géolocalisation IP via ipapi.co (côté serveur, pas de CORS)
async function detectZone(ip) {
  try {
    const https = require('https');
    const cleanIp = (ip || '').replace(/^::ffff:/, '');
    // IPs locales/privées → Suisse par défaut
    if (!cleanIp || cleanIp === '127.0.0.1' || cleanIp.startsWith('10.') || cleanIp.startsWith('192.168.') || cleanIp.startsWith('172.')) {
      return { zone: 'ch', country: null };
    }
    const data = await new Promise((resolve, reject) => {
      const req = https.get(`https://ipapi.co/${cleanIp}/json/`, { headers: { 'User-Agent': 'upgr-geo/1.0' } }, (res) => {
        let body = '';
        res.on('data', d => body += d);
        res.on('end', () => { try { resolve(JSON.parse(body)); } catch(e) { reject(e); } });
      });
      req.on('error', reject);
      req.setTimeout(4000, () => { req.destroy(); reject(new Error('timeout')); });
    });
    const code = (data.country_code || '').toUpperCase();
    const name = data.country_name || '';
    let zone = 'eu';
    if (code === 'CH') zone = 'ch';
    else if (AF_FR.has(code)) zone = 'af';
    return { zone, country: name || null, code };
  } catch(e) {
    return { zone: 'eu', country: null };
  }
}

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || 'text/html; charset=utf-8';
  fs.readFile(filePath, (e, data) => {
    if (e) { res.writeHead(500, NO_CACHE); return res.end('Error'); }
    res.writeHead(200, { ...NO_CACHE, 'Content-Type': type });
    res.end(data);
  });
}

function serveIndex(res) {
  serveFile(res, path.join(ROOT, 'index.html'));
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

http.createServer(async (req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  const safe = path.normalize(urlPath).replace(/^(\.\.[\/\\])+/, '');

  // ── API géolocalisation ──────────────────────────────────────────────────
  if (urlPath === '/api/geo') {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, { ...NO_CACHE, ...CORS });
      return res.end();
    }
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    const result = await detectZone(ip);
    res.writeHead(200, { ...NO_CACHE, ...CORS, 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify(result));
  }

  // ── Fichiers statiques ───────────────────────────────────────────────────
  const filePath = path.join(ROOT, safe);
  if (!filePath.startsWith(ROOT)) { res.writeHead(403, NO_CACHE); return res.end('Forbidden'); }
  if (urlPath === '/' || urlPath === '') return serveIndex(res);

  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isFile()) return serveFile(res, filePath);

    if (!err && stat.isDirectory()) {
      const indexPath = path.join(filePath, 'index.html');
      return fs.stat(indexPath, (e2, s2) => {
        if (!e2 && s2.isFile()) return serveFile(res, indexPath);
        return serveIndex(res);
      });
    }

    const htmlPath = filePath + '.html';
    fs.stat(htmlPath, (e2, s2) => {
      if (!e2 && s2.isFile()) return serveFile(res, htmlPath);
      return serveIndex(res);
    });
  });
}).listen(PORT, HOST, () => console.log(`Serving on http://${HOST}:${PORT}`));
