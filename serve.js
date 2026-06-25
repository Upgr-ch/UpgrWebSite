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
  '.pdf':  'application/pdf',
};

const NO_CACHE = { 'Cache-Control': 'no-cache, no-store, must-revalidate', Pragma: 'no-cache', Expires: '0' };

// ── Devise par pays ──────────────────────────────────────────────────────────
const COUNTRY_CURRENCY = {
  'CH': 'CHF',
  'BJ': 'XOF', 'BF': 'XOF', 'CI': 'XOF', 'GW': 'XOF',
  'ML': 'XOF', 'NE': 'XOF', 'SN': 'XOF', 'TG': 'XOF',
  'CM': 'XAF', 'CF': 'XAF', 'TD': 'XAF', 'CG': 'XAF', 'GA': 'XAF',
  'MA': 'MAD',
  'TN': 'TND',
  'BI': 'EUR', 'KM': 'EUR', 'CD': 'EUR', 'DJ': 'EUR', 'GN': 'EUR',
  'MG': 'EUR', 'MR': 'EUR', 'MU': 'EUR', 'RW': 'EUR', 'SC': 'EUR',
};

async function detectZone(ip) {
  try {
    const https = require('https');
    const cleanIp = (ip || '').replace(/^::ffff:/, '');
    if (!cleanIp || cleanIp === '127.0.0.1' || cleanIp.startsWith('10.') || cleanIp.startsWith('192.168.') || cleanIp.startsWith('172.')) {
      return { zone: 'ch', currency: 'CHF', country: null };
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
    const currency = COUNTRY_CURRENCY[code] || 'EUR';
    const zone = code === 'CH' ? 'ch' : (COUNTRY_CURRENCY[code] ? 'af' : 'eu');
    return { zone, currency, country: name || null, code };
  } catch(e) {
    return { zone: 'eu', currency: 'EUR', country: null };
  }
}

// ── Configuration produits ───────────────────────────────────────────────────
// Chaque produit a un tag Systeme.io — ce tag déclenche l'automation d'envoi
// du lien Proton Drive. Les liens/codes sont gérés dans Systeme.io (pas ici).
const PRODUCTS = {
  [process.env.STRIPE_LINK_LIVRE1 || '__livre1__']: {
    nom:  "De l'idée au plan",
    desc: "Guide numérique · 80 pages · Téléchargeable · Imprimable",
    tag:  'livre1-acheteur',
  },
  [process.env.STRIPE_LINK_LIVRE2 || '__livre2__']: {
    nom:  "Vos compétences humaines invisibles",
    desc: "Guide numérique · 120 pages · Téléchargeable · Imprimable",
    tag:  'livre2-acheteur',
  },
  [process.env.STRIPE_LINK_BUNDLE || '__bundle__']: {
    nom:  "Offre groupée — Les deux guides",
    desc: "De l'idée au plan + Vos compétences humaines invisibles",
    tag:  'bundle-acheteur',
  },
};

// ── Systeme.io API ────────────────────────────────────────────────────────────
function systemeApiCall(method, endpoint, body) {
  return new Promise((resolve, reject) => {
    const https = require('https');
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.systeme.io',
      path: `/api${endpoint}`,
      method,
      headers: {
        'X-API-Key': process.env.SYSTEMEIO_API_KEY || '',
        'Content-Type': 'application/json',
        'accept': 'application/json',
      },
    };
    if (data) options.headers['Content-Length'] = Buffer.byteLength(data);

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', d => responseBody += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(responseBody) }); }
        catch(e) { resolve({ status: res.statusCode, body: responseBody }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(8000, () => { req.destroy(); reject(new Error('timeout systeme.io')); });
    if (data) req.write(data);
    req.end();
  });
}

async function ajouterContactSystemeIO({ email, prenom, nom, tagName }) {
  const apiKey = process.env.SYSTEMEIO_API_KEY || '';
  console.log(`[debug] SYSTEMEIO_API_KEY longueur=${apiKey.length} vide=${!apiKey}`);
  if (!apiKey) {
    console.warn('⚠️  SYSTEMEIO_API_KEY non défini — contact non ajouté dans Systeme.io');
    return;
  }

  // 1. Créer ou mettre à jour le contact
  const contactPayload = { email };
  if (prenom) contactPayload.firstName = prenom;
  if (nom)    contactPayload.lastName  = nom;

  const contactRes = await systemeApiCall('POST', '/contacts', contactPayload);
  console.log(`[debug] POST /contacts status=${contactRes.status} body=${JSON.stringify(contactRes.body)}`);

  // Récupérer l'id : depuis la réponse ou via GET si le contact existe déjà (409 ou 422)
  let contactId = contactRes.body && contactRes.body.id;
  if (!contactId) {
    const getRes = await systemeApiCall('GET', `/contacts?email=${encodeURIComponent(email)}&limit=1`, null);
    console.log(`[debug] GET /contacts status=${getRes.status} body=${JSON.stringify(getRes.body)}`);
    contactId = getRes.body && getRes.body.items && getRes.body.items[0] && getRes.body.items[0].id;
  }

  if (!contactId) {
    console.warn('Systeme.io — impossible de récupérer l\'id du contact pour', email);
    return;
  }

  // 2. Récupérer ou créer le tag
  const tagsRes = await systemeApiCall('GET', `/tags?name=${encodeURIComponent(tagName)}&limit=1`, null);
  console.log(`[debug] GET /tags status=${tagsRes.status} body=${JSON.stringify(tagsRes.body)}`);
  let tagId = tagsRes.body && tagsRes.body.items && tagsRes.body.items[0] && tagsRes.body.items[0].id;

  if (!tagId) {
    const newTagRes = await systemeApiCall('POST', '/tags', { name: tagName });
    console.log(`[debug] POST /tags status=${newTagRes.status} body=${JSON.stringify(newTagRes.body)}`);
    tagId = newTagRes.body && newTagRes.body.id;
  }

  if (!tagId) {
    console.warn('Systeme.io — impossible de trouver/créer le tag :', tagName);
    return;
  }

  // 3. Appliquer le tag au contact
  const addTagRes = await systemeApiCall('POST', `/contacts/${contactId}/tags`, { tagId });
  console.log(`[debug] POST /contacts/${contactId}/tags status=${addTagRes.status} body=${JSON.stringify(addTagRes.body)}`);
  if (addTagRes.status >= 400) {
    console.warn('Systeme.io — erreur ajout tag :', addTagRes.status, JSON.stringify(addTagRes.body));
    return;
  }

  console.log(`✅ Systeme.io : contact ${email} tagué "${tagName}" (contact #${contactId})`);
}

// ── Traitement webhook Stripe ─────────────────────────────────────────────────
async function traiterWebhookStripe(rawBody, signature) {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || '');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature invalide :', err.message);
    throw new Error('signature_invalide');
  }

  if (event.type !== 'checkout.session.completed') return;

  const session = event.data.object;
  const paymentLinkId = session.payment_link || '';
  const produit = PRODUCTS[paymentLinkId];

  if (!produit) {
    console.warn('Payment link non reconnu :', paymentLinkId, '— webhook ignoré');
    return;
  }

  const details = session.customer_details || {};
  const email   = details.email || '';
  const nomComplet = details.name || '';
  const [prenom, ...reste] = nomComplet.trim().split(' ');
  const nom = reste.join(' ');

  if (!email) {
    console.warn('Email client absent dans la session :', session.id);
    return;
  }

  const devise  = (session.currency || 'eur').toUpperCase();
  const montant = (session.amount_total / 100).toFixed(2).replace('.00', '');

  // Ajouter le contact + tag dans Systeme.io → déclenche l'automation
  await ajouterContactSystemeIO({ email, prenom, nom, tagName: produit.tag });

  console.log(`✅ Vente traitée : ${produit.nom} · ${montant} ${devise} · ${email}`);
  console.log(`   → Tag Systeme.io "${produit.tag}" appliqué — automation en cours d'envoi`);
}

// ── Serveur statique ──────────────────────────────────────────────────────────
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

http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  const safe = path.normalize(urlPath).replace(/^(\.\.[\/\\])+/, '');

  // ── Webhook Stripe ─────────────────────────────────────────────────────────
  if (urlPath === '/webhook/stripe' && req.method === 'POST') {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', async () => {
      const rawBody = Buffer.concat(chunks);
      const sig     = req.headers['stripe-signature'] || '';
      try {
        await traiterWebhookStripe(rawBody, sig);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ received: true }));
      } catch(err) {
        const code = err.message === 'signature_invalide' ? 400 : 500;
        res.writeHead(code, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // ── Test Systeme.io (temporaire) ──────────────────────────────────────────
  if (urlPath === '/test-systeme' && req.method === 'GET') {
    const params = new URLSearchParams((req.url || '').split('?')[1] || '');
    const tag   = params.get('tag')   || 'livre1-acheteur';
    const email = params.get('email') || 'test@upgr.ch';
    ajouterContactSystemeIO({ email, prenom: 'Test', nom: 'UpGrade', tagName: tag })
      .then(() => {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true, message: `Contact test@upgr.ch tagué "${tag}" dans Systeme.io` }));
      })
      .catch(err => {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      });
    return;
  }

  // ── API géolocalisation ────────────────────────────────────────────────────
  if (urlPath === '/api/geo') {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, { ...NO_CACHE, ...CORS });
      return res.end();
    }
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    detectZone(ip).then(result => {
      res.writeHead(200, { ...NO_CACHE, ...CORS, 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(result));
    });
    return;
  }

  // ── Fichiers statiques ─────────────────────────────────────────────────────
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
}).listen(PORT, HOST, () => {
  console.log(`Serving on http://${HOST}:${PORT}`);
  if (!process.env.STRIPE_SECRET_KEY)     console.warn('⚠️  STRIPE_SECRET_KEY non défini — webhook inactif');
  if (!process.env.STRIPE_WEBHOOK_SECRET) console.warn('⚠️  STRIPE_WEBHOOK_SECRET non défini — webhook inactif');
  if (!process.env.SYSTEMEIO_API_KEY)     console.warn('⚠️  SYSTEMEIO_API_KEY non défini — Systeme.io inactif');
});
