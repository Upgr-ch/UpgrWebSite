const http = require('http');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const db = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function initDB() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS ventes (
      id SERIAL PRIMARY KEY,
      date_achat TIMESTAMPTZ DEFAULT NOW(),
      email TEXT NOT NULL,
      nom TEXT,
      produit TEXT,
      tag TEXT,
      montant NUMERIC(10,2),
      devise TEXT,
      stripe_session_id TEXT UNIQUE,
      stripe_plink TEXT
    )
  `);
}
initDB().catch(e => console.error('DB init error:', e.message));

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
// du lien Proton Drive. Les identifiants Stripe sont publics (contrairement aux
// clés Stripe) et peuvent être remplacés par des variables d'environnement.
const PRODUCTS = {
  [process.env.STRIPE_LINK_LIVRE1 || '__livre1__']: {
    nom:  "De l'idée au plan",
    desc: "Guide numérique · 80 pages · Téléchargeable · Imprimable",
    tag:  "De l'idée au plan- Acheteur",
  },
  [process.env.STRIPE_LINK_LIVRE2 || '__livre2__']: {
    nom:  "Vos compétences humaines invisibles",
    desc: "Guide numérique · 120 pages · Téléchargeable · Imprimable",
    tag:  'Vos Compétences Humaines-Acheteur',
  },
  [process.env.STRIPE_LINK_BUNDLE || '__bundle__']: {
    nom:  "Offre groupée — Les deux guides",
    desc: "De l'idée au plan + Vos compétences humaines invisibles",
    tag:  'Offre groupée-Acheteur',
  },
  [process.env.STRIPE_LINK_PACK_DECOUVERTE || 'plink_1U3zhJH51Bvzgbhu6NqTXcnF']: {
    nom:  "Pack Découverte — Masterclasse #1 + 2 ebooks",
    desc: "Masterclasse « L'Art de Transmettre #1 » + 2 ebooks",
    tag:  'Pack Découverte-Acheteur',
  },
  [process.env.STRIPE_LINK_PACK_COMPLET || 'plink_1U50beH51BvzgbhuV4XYYi96']: {
    nom:  "Pack Complet — 2 Masterclasses + 2 ebooks",
    desc: "Masterclasses « L'Art de Transmettre #1 & #2 » + 2 ebooks",
    tag:  'Pack Complet-Acheteur',
  },
  [process.env.STRIPE_LINK_PACK_COMPLET_3X || 'plink_1U52rNH51Bvzgbhua4CPgebq']: {
    nom:  "Pack Complet — 2 Masterclasses + 2 ebooks",
    desc: "Paiement en 3 fois · Masterclasses « L'Art de Transmettre #1 & #2 » + 2 ebooks",
    tag:  'Pack Complet-Acheteur',
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
    const getRes = await systemeApiCall('GET', `/contacts?email=${encodeURIComponent(email)}&limit=10`, null);
    console.log(`[debug] GET /contacts status=${getRes.status} body=${JSON.stringify(getRes.body)}`);
    contactId = getRes.body && getRes.body.items && getRes.body.items[0] && getRes.body.items[0].id;
  }

  if (!contactId) {
    console.warn('Systeme.io — impossible de récupérer l\'id du contact pour', email);
    return;
  }

  // 2. Récupérer ou créer le tag
  const tagsRes = await systemeApiCall('GET', `/tags?name=${encodeURIComponent(tagName)}&limit=10`, null);
  console.log(`[debug] GET /tags status=${tagsRes.status} body=${JSON.stringify(tagsRes.body)}`);
  let tagId = tagsRes.body && tagsRes.body.items && tagsRes.body.items[0] && tagsRes.body.items[0].id;

  if (!tagId) {
    const newTagRes = await systemeApiCall('POST', '/tags', { name: tagName });
    console.log(`[debug] POST /tags status=${newTagRes.status} body=${JSON.stringify(newTagRes.body)}`);
    tagId = newTagRes.body && newTagRes.body.id;
    // Si tag déjà existant (422), refaire un GET pour trouver l'id
    if (!tagId) {
      const retryRes = await systemeApiCall('GET', `/tags?name=${encodeURIComponent(tagName)}&limit=10`, null);
      tagId = retryRes.body && retryRes.body.items && retryRes.body.items.find(t => t.name === tagName) && retryRes.body.items.find(t => t.name === tagName).id;
    }
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
  return contactId;
}

// ── Traitement webhook Stripe ─────────────────────────────────────────────────
async function patchContactSystemeIO(contactId, produit, montant, devise, date) {
  return new Promise((resolve) => {
    const https = require('https');
    const body = JSON.stringify({
      fields: [
        { slug: 'dernier_produit',     value: produit },
        { slug: 'dernier_montant',     value: `${montant} ${devise}` },
        { slug: 'derniere_date_achat', value: date },
      ]
    });
    const options = {
      hostname: 'api.systeme.io',
      path: `/api/contacts/${contactId}`,
      method: 'PATCH',
      headers: {
        'X-API-Key': process.env.SYSTEMEIO_API_KEY || '',
        'Content-Type': 'application/merge-patch+json',
        'accept': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      let r = ''; res.on('data', d => r += d);
      res.on('end', () => {
        console.log(`[debug] PATCH /contacts/${contactId} status=${res.statusCode} body=${r}`);
        resolve({ status: res.statusCode });
      });
    });
    req.on('error', e => { console.warn('PATCH contact error:', e.message); resolve({ status: 0 }); });
    req.write(body); req.end();
  });
}

async function traiterWebhookStripe(rawBody, signature) {
  const crypto = require('crypto');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  // Vérification HMAC manuelle (ne dépend pas de STRIPE_SECRET_KEY)
  let event;
  try {
    const parts = {};
    signature.split(',').forEach(p => { const [k, v] = p.split('='); parts[k] = v; });
    const timestamp = parts['t'];
    const v1        = parts['v1'];
    if (!timestamp || !v1) throw new Error('header stripe-signature malformé');
    const signedPayload = timestamp + '.' + rawBody.toString('utf8');
    const expected = crypto.createHmac('sha256', webhookSecret).update(signedPayload).digest('hex');
    if (expected !== v1) throw new Error('signatures HMAC ne correspondent pas');
    event = JSON.parse(rawBody.toString('utf8'));
    console.log(`[webhook] signature OK — event type: ${event.type}`);
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
  const montant = (session.amount_total / 100).toFixed(2);
  const dateAchat = new Date().toISOString();

  // 1. Sauvegarder la vente en base de données
  try {
    await db.query(
      `INSERT INTO ventes (email, nom, produit, tag, montant, devise, stripe_session_id, stripe_plink)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (stripe_session_id) DO NOTHING`,
      [email, nomComplet, produit.nom, produit.tag, parseFloat(montant), devise, session.id, paymentLinkId]
    );
    console.log(`✅ Vente sauvegardée en DB : ${produit.nom} · ${montant} ${devise} · ${email}`);
  } catch (dbErr) {
    console.error('DB insert error:', dbErr.message);
  }

  // 2. Ajouter le contact + tag dans Systeme.io → déclenche l'automation
  const contactId = await ajouterContactSystemeIO({ email, prenom, nom, tagName: produit.tag });

  // 3. Mettre à jour le profil contact avec les infos d'achat (champs personnalisés)
  if (contactId) {
    await patchContactSystemeIO(contactId, produit.nom, montant, devise, dateAchat.slice(0, 10));
  }

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

  // ── Liste payment links (temporaire) ──────────────────────────────────────
  if (urlPath === '/admin/payment-links' && req.method === 'GET') {
    (async () => {
      const https = require('https');
      const key = (process.env.STRIPE_SECRET_KEY || '').trim();
      const keyPrefix = key ? key.substring(0, 14) + '...' : 'ABSENTE';
      const stripeGet = (p) => new Promise((resolve) => {
        const r = https.get('https://api.stripe.com' + p, {
          headers: { 'Authorization': 'Bearer ' + key }
        }, (r2) => { let b = ''; r2.on('data', d => b += d); r2.on('end', () => resolve(JSON.parse(b))); });
        r.on('error', e => resolve({ error: e.message }));
      });
      const [account, liens, plink] = await Promise.all([
        stripeGet('/v1/account'),
        stripeGet('/v1/payment_links?limit=10'),
        stripeGet('/v1/payment_links/plink_1TmAZUH51Bvzgbhu2QG9H2YX'),
      ]);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        cle_prefix: keyPrefix,
        compte_email: account.email || account.error,
        nb_liens: (liens.data || []).length,
        liens: (liens.data || []).map(pl => ({ id: pl.id, actif: pl.active, url: pl.url })),
        plink_bundle: plink.id || plink.error,
      }, null, 2));
    })().catch(e => { res.writeHead(500); res.end(e.message); });
    return;
  }

  // ── Tableau de bord des ventes ────────────────────────────────────────────
  if (urlPath === '/admin/ventes' && req.method === 'GET') {
    (async () => {
      const [ventesRes, chartRes] = await Promise.all([
        db.query(
          `SELECT id, to_char(date_achat AT TIME ZONE 'Europe/Zurich', 'DD/MM/YYYY HH24:MI') AS date,
                  email, nom, produit, tag, montant, devise, stripe_session_id
           FROM ventes ORDER BY date_achat DESC LIMIT 500`
        ),
        db.query(
          `SELECT to_char(date_achat AT TIME ZONE 'Europe/Zurich', 'YYYY-MM-DD') AS jour,
                  SUM(montant) AS total, COUNT(*) AS nb
           FROM ventes
           WHERE date_achat >= NOW() - INTERVAL '30 days'
           GROUP BY jour ORDER BY jour ASC`
        ),
      ]);
      const rows = ventesRes.rows;
      const chart = chartRes.rows;
      const totalAll = rows.reduce((s, r) => s + parseFloat(r.montant || 0), 0);
      const nbClients = new Set(rows.map(r => r.email)).size;

      // Construire un tableau complet de 30 jours (jours sans vente = 0)
      const chartMap = {};
      chart.forEach(r => { chartMap[r.jour] = parseFloat(r.total).toFixed(2); });
      const days30 = Array.from({length: 30}, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - 29 + i);
        return d.toISOString().slice(0,10);
      });
      const MOIS_FR = ['jan','fév','mar','avr','mai','juin','juil','août','sep','oct','nov','déc'];
      const chartLabels = JSON.stringify(days30.map(d => {
        const p = d.split('-');
        const mois = MOIS_FR[parseInt(p[1],10)-1];
        return p[2] + ' ' + mois + ' ' + p[0];
      }));
      const chartData   = JSON.stringify(days30.map(d => chartMap[d] || '0'));
      const allRows     = JSON.stringify(rows.map(r => ({
        date: r.date, email: r.email, nom: r.nom || '', produit: r.produit,
        tag: r.tag || '', montant: parseFloat(r.montant).toFixed(2), devise: r.devise,
        sid: (r.stripe_session_id || '').substring(0, 24),
      })));

      const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>UpGrade — CRM Ventes</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;background:#070b12;color:#fff;min-height:100vh}
.header{background:#0a0f1a;border-bottom:1px solid rgba(246,220,141,.15);padding:16px 32px;display:flex;align-items:center;gap:16px}
.logo{font-size:1.25em;font-weight:700;letter-spacing:-.01em}
.logo em{font-style:italic;color:#f6dc8d}
.logo-sub{font-size:.65em;letter-spacing:.18em;color:#f6dc8d;opacity:.7;text-transform:uppercase;display:block;margin-top:1px}
.header-right{margin-left:auto;font-size:.78em;color:#a6a6a6}
.content{max-width:1120px;margin:0 auto;padding:32px 24px}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:28px}
.card{background:#1f242e;border:1px solid rgba(246,220,141,.1);border-radius:10px;padding:20px 22px;position:relative;overflow:hidden}
.card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#b58d26,#f6dc8d)}
.card .label{font-size:.72em;color:#a6a6a6;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;font-weight:500}
.card .value{font-size:1.9em;font-weight:700;color:#f6dc8d}
.card .value.white{color:#fff}
.chart-box{background:#1f242e;border:1px solid rgba(246,220,141,.1);border-radius:10px;padding:24px;margin-bottom:24px}
.chart-box h2{font-size:.82em;color:#a6a6a6;text-transform:uppercase;letter-spacing:.08em;margin-bottom:18px;font-weight:600}
.chart-wrap{position:relative;height:220px}
.filters{background:#1f242e;border:1px solid rgba(246,220,141,.1);border-radius:10px;padding:18px 22px;margin-bottom:16px;display:flex;gap:14px;flex-wrap:wrap;align-items:flex-end}
.filters label{font-size:.72em;color:#a6a6a6;display:block;margin-bottom:5px;font-weight:500;text-transform:uppercase;letter-spacing:.05em}
.filters input,.filters select{padding:8px 11px;background:#070b12;border:1px solid rgba(255,255,255,.12);border-radius:6px;font-size:.88em;color:#fff;outline:none;width:100%;font-family:'Inter',sans-serif}
.filters input:focus,.filters select:focus{border-color:#f6dc8d}
.filters select option{background:#1f242e}
.f-group{flex:1;min-width:150px}
.btn-reset{padding:8px 18px;background:transparent;color:#f6dc8d;border:1px solid #f6dc8d;border-radius:6px;cursor:pointer;font-size:.83em;font-weight:600;white-space:nowrap;font-family:'Inter',sans-serif;transition:all .2s}
.btn-reset:hover{background:#f6dc8d;color:#070b12}
.count-info{font-size:.78em;color:#a6a6a6;margin-bottom:10px;padding-left:2px}
.table-box{background:#1f242e;border:1px solid rgba(246,220,141,.1);border-radius:10px;overflow:hidden}
table{width:100%;border-collapse:collapse}
th{background:#0a0f1a;color:#a6a6a6;padding:11px 16px;text-align:left;font-size:.72em;font-weight:600;letter-spacing:.08em;text-transform:uppercase;border-bottom:1px solid rgba(246,220,141,.1)}
td{padding:11px 16px;border-bottom:1px solid rgba(255,255,255,.05);font-size:.88em;vertical-align:middle;color:#e0e0e0}
tbody tr:hover td{background:rgba(246,220,141,.04)}
tbody tr:last-child td{border-bottom:none}
.badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:.75em;font-weight:600;letter-spacing:.02em}
.livre1{background:rgba(181,141,38,.2);color:#f6dc8d;border:1px solid rgba(181,141,38,.4)}
.livre2{background:rgba(246,220,141,.12);color:#f5e090;border:1px solid rgba(246,220,141,.25)}
.bundle{background:rgba(239,67,67,.12);color:#ef9999;border:1px solid rgba(239,67,67,.25)}
.email-link{color:#f6dc8d;text-decoration:none;opacity:.85}.email-link:hover{opacity:1;text-decoration:underline}
.montant{font-weight:700;color:#f6dc8d}
.sid{font-size:.72em;color:#555;font-family:monospace}
.empty{text-align:center;padding:50px;color:#a6a6a6;font-size:.95em}
</style></head><body>
<div class="header">
  <div>
    <div class="logo"><em>Up</em>Grade<span class="logo-sub">Learning &amp; Development</span></div>
  </div>
  <div style="width:1px;height:36px;background:rgba(246,220,141,.2);margin:0 8px"></div>
  <span style="color:#a6a6a6;font-size:.88em;font-weight:500">CRM — Tableau de bord des ventes</span>
  <div class="header-right">Mis à jour : ${new Date().toLocaleString('fr-CH',{timeZone:'Europe/Zurich'})}</div>
</div>
<div class="content">
  <div class="cards">
    <div class="card"><div class="label">Chiffre d'affaires</div><div class="value" id="totalCA">${totalAll.toFixed(2)} CHF</div></div>
    <div class="card"><div class="label">Ventes totales</div><div class="value white" id="totalVentes">${rows.length}</div></div>
    <div class="card"><div class="label">Clients uniques</div><div class="value white" id="totalClients">${nbClients}</div></div>
    <div class="card"><div class="label">Panier moyen</div><div class="value" id="panierMoyen">${rows.length ? (totalAll/rows.length).toFixed(2) : '0.00'} CHF</div></div>
  </div>

  <div class="chart-box">
    <h2>Chiffre d'affaires par jour (CHF)</h2>
    <div class="chart-wrap"><canvas id="ventesChart"></canvas></div>
  </div>

  <div class="filters">
    <div class="f-group"><label>Produit</label>
      <select id="fProduit" onchange="filtrer()">
        <option value="">Tous les produits</option>
        <option value="livre1">De l'idée au plan</option>
        <option value="livre2">Compétences humaines</option>
        <option value="bundle">Offre groupée</option>
      </select>
    </div>
    <div class="f-group"><label>Date début</label><input type="date" id="fDateDeb" oninput="filtrer()"></div>
    <div class="f-group"><label>Date fin</label><input type="date" id="fDateFin" oninput="filtrer()"></div>
    <div class="f-group"><label>Recherche email / nom</label><input type="text" id="fText" placeholder="ex : jean@gmail.com" oninput="filtrer()"></div>
    <button class="btn-reset" onclick="resetFiltres()">Réinitialiser</button>
  </div>

  <p class="count-info" id="countInfo"></p>

  <div class="table-box">
    <table>
      <thead><tr><th>Date (CH)</th><th>Email</th><th>Nom</th><th>Produit</th><th>Montant</th><th>ID Stripe</th></tr></thead>
      <tbody id="tbody"></tbody>
    </table>
    <div id="emptyMsg" class="empty" style="display:none">Aucune vente ne correspond aux filtres.</div>
  </div>
</div>

<script>
const ALL = ${allRows};
const chartLabels = ${chartLabels};
const chartData   = ${chartData};

// Courbe Chart.js
const ctx = document.getElementById('ventesChart').getContext('2d');
new Chart(ctx, {
  type: 'line',
  data: {
    labels: chartLabels,
    datasets: [{
      label: 'CA (CHF)',
      data: chartData,
      borderColor: '#f6dc8d',
      backgroundColor: 'rgba(246,220,141,.07)',
      borderWidth: 2.5,
      pointBackgroundColor: '#f6dc8d',
      pointRadius: chartLabels.length < 20 ? 4 : 2,
      tension: 0.35,
      fill: true,
    }]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => c.parsed.y + ' CHF' } } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#a6a6a6', font: { size: 11 } } },
      y: { beginAtZero: true, ticks: { callback: v => v + ' CHF', color: '#a6a6a6', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,.05)' } }
    }
  }
});

function badgeCls(tag) {
  if (!tag) return 'bundle';
  if (tag.includes('livre1')) return 'livre1';
  if (tag.includes('livre2')) return 'livre2';
  return 'bundle';
}

function filtrer() {
  const txt  = document.getElementById('fText').value.toLowerCase().trim();
  const prod = document.getElementById('fProduit').value;
  const deb  = document.getElementById('fDateDeb').value;
  const fin  = document.getElementById('fDateFin').value;

  const filtered = ALL.filter(r => {
    if (txt && !r.email.toLowerCase().includes(txt) && !r.nom.toLowerCase().includes(txt)) return false;
    if (prod && !r.tag.includes(prod)) return false;
    // date au format DD/MM/YYYY → convert to YYYY-MM-DD
    const parts = r.date.split(' ')[0].split('/');
    const iso = parts[2] + '-' + parts[1] + '-' + parts[0];
    if (deb && iso < deb) return false;
    if (fin && iso > fin) return false;
    return true;
  });

  const ca = filtered.reduce((s, r) => s + parseFloat(r.montant), 0);
  document.getElementById('totalCA').textContent    = ca.toFixed(2) + ' CHF';
  document.getElementById('totalVentes').textContent = filtered.length;
  document.getElementById('totalClients').textContent = new Set(filtered.map(r => r.email)).size;
  document.getElementById('panierMoyen').textContent  = filtered.length ? (ca / filtered.length).toFixed(2) + ' CHF' : '0.00 CHF';
  document.getElementById('countInfo').textContent    = filtered.length + ' vente' + (filtered.length !== 1 ? 's' : '') + ' affichée' + (filtered.length !== 1 ? 's' : '');

  const tbody = document.getElementById('tbody');
  tbody.innerHTML = filtered.map(r => \`<tr>
    <td>\${r.date}</td>
    <td><a class="email-link" href="mailto:\${r.email}">\${r.email}</a></td>
    <td>\${r.nom || '—'}</td>
    <td><span class="badge \${badgeCls(r.tag)}">\${r.produit}</span></td>
    <td class="montant">\${r.montant} \${r.devise}</td>
    <td class="sid">\${r.sid}…</td>
  </tr>\`).join('');
  document.getElementById('emptyMsg').style.display = filtered.length ? 'none' : 'block';
}

function resetFiltres() {
  document.getElementById('fText').value = '';
  document.getElementById('fProduit').value = '';
  document.getElementById('fDateDeb').value = '';
  document.getElementById('fDateFin').value = '';
  filtrer();
}

filtrer();
</script>
</body></html>`;
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    })().catch(e => { res.writeHead(500); res.end('Erreur DB : ' + e.message); });
    return;
  }

  // ── Consultation contact + champs Systeme.io ──────────────────────────────
  if (urlPath === '/admin/contact' && req.method === 'GET') {
    (async () => {
      const params = new URLSearchParams((req.url || '').split('?')[1] || '');
      const email = params.get('email') || '';
      const [contactRes, fieldsRes] = await Promise.all([
        email ? systemeApiCall('GET', `/contacts?email=${encodeURIComponent(email)}&limit=10`, null) : Promise.resolve({ status: 0, body: {} }),
        systemeApiCall('GET', '/contact-fields?limit=50', null),
      ]);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        contact: contactRes.body,
        champs_disponibles: fieldsRes.body,
      }, null, 2));
    })().catch(e => { res.writeHead(500); res.end(e.message); });
    return;
  }

  // ── Test achat complet (temporaire) ───────────────────────────────────────
  if (urlPath === '/test-achat-complet' && req.method === 'GET') {
    (async () => {
      const params  = new URLSearchParams((req.url || '').split('?')[1] || '');
      const email   = params.get('email') || 'test@upgr.ch';
      const prenom  = params.get('prenom') || 'Test';
      const nom     = params.get('nom') || 'Client';
      const plinkKey= params.get('produit') || 'livre1';
      const plinkMap = {
        livre1: process.env.STRIPE_LINK_LIVRE1 || '__livre1__',
        livre2: process.env.STRIPE_LINK_LIVRE2 || '__livre2__',
        bundle: process.env.STRIPE_LINK_BUNDLE || '__bundle__',
      };
      const plink   = plinkMap[plinkKey] || plinkMap.livre1;
      const produit = PRODUCTS[plink];
      if (!produit) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ ok: false, error: 'produit inconnu' }));
      }
      const fakeSessionId = 'cs_test_' + Date.now() + '_' + Math.random().toString(36).slice(2,8);
      const montant  = '29.00';
      const devise   = 'CHF';
      const dateAchat = new Date().toISOString().slice(0, 10);
      const log = [];
      try {
        const dbRes = await db.query(
          `INSERT INTO ventes (email, nom, produit, tag, montant, devise, stripe_session_id, stripe_plink)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (stripe_session_id) DO NOTHING RETURNING id`,
          [email, prenom + ' ' + nom, produit.nom, produit.tag, parseFloat(montant), devise, fakeSessionId, plink]
        );
        log.push({ etape: '1-DB', ok: true, id: dbRes.rows[0]?.id });
      } catch(e) { log.push({ etape: '1-DB', ok: false, error: e.message }); }
      let contactId = null;
      try {
        contactId = await ajouterContactSystemeIO({ email, prenom, nom, tagName: produit.tag });
        log.push({ etape: '2-SystemeIO-tag', ok: true, contactId, tag: produit.tag });
      } catch(e) { log.push({ etape: '2-SystemeIO-tag', ok: false, error: e.message }); }
      if (contactId) {
        try {
          const patch = await patchContactSystemeIO(contactId, produit.nom, montant, devise, dateAchat);
          log.push({ etape: '3-SystemeIO-patch', ok: patch.status < 300, status: patch.status });
        } catch(e) { log.push({ etape: '3-SystemeIO-patch', ok: false, error: e.message }); }
      } else {
        log.push({ etape: '3-SystemeIO-patch', ok: false, note: 'contactId absent — patch ignoré' });
      }
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ email, produit: produit.nom, tag: produit.tag, fakeSessionId, log }, null, 2));
    })().catch(e => { res.writeHead(500); res.end(e.message); });
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

  // Clean URL routes → fichiers HTML dans upgr/
  const cleanRoutes = {
    '/eugene':              'eugene.html',
    '/edouard':             'edouard.html',
    '/masterclass1':        'upgr/vente-masterclass1.html',
    '/masterclass2':        'upgr/vente-masterclass2.html',
    '/pack-masterclasses':  'upgr/vente-pack-masterclasses.html',
    '/extrait-masterclass2':'upgr/extrait-masterclass2.html',
    '/extrait-masterclass1':'upgr/extrait-masterclass1.html',
  };
  const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  if (cleanRoutes[urlPath]) return serveFile(res, path.join(ROOT, cleanRoutes[urlPath]));

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
