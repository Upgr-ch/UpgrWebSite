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
           GROUP BY jour ORDER BY jour ASC`
        ),
      ]);
      const rows = ventesRes.rows;
      const chart = chartRes.rows;
      const totalAll = rows.reduce((s, r) => s + parseFloat(r.montant || 0), 0);
      const nbClients = new Set(rows.map(r => r.email)).size;
      const chartLabels = JSON.stringify(chart.map(r => r.jour));
      const chartData   = JSON.stringify(chart.map(r => parseFloat(r.total).toFixed(2)));
      const allRows     = JSON.stringify(rows.map(r => ({
        date: r.date, email: r.email, nom: r.nom || '', produit: r.produit,
        tag: r.tag || '', montant: parseFloat(r.montant).toFixed(2), devise: r.devise,
        sid: (r.stripe_session_id || '').substring(0, 24),
      })));

      const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>UpGrade — CRM Ventes</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f4f6fb;color:#222;min-height:100vh}
.header{background:#1a1a2e;color:#fff;padding:18px 32px;display:flex;align-items:center;gap:12px}
.header h1{font-size:1.3em;font-weight:700}
.header span{font-size:.85em;opacity:.6;margin-left:auto}
.content{max-width:1100px;margin:0 auto;padding:28px 24px}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:28px}
.card{background:#fff;border-radius:10px;padding:20px 22px;box-shadow:0 1px 4px rgba(0,0,0,.07)}
.card .label{font-size:.75em;color:#888;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px}
.card .value{font-size:1.8em;font-weight:700;color:#1a1a2e}
.card .value.green{color:#198754}.card .value.blue{color:#0d6efd}
.chart-box{background:#fff;border-radius:10px;padding:22px;box-shadow:0 1px 4px rgba(0,0,0,.07);margin-bottom:28px}
.chart-box h2{font-size:.95em;color:#555;margin-bottom:16px;font-weight:600}
.chart-wrap{position:relative;height:220px}
.filters{background:#fff;border-radius:10px;padding:18px 22px;box-shadow:0 1px 4px rgba(0,0,0,.07);margin-bottom:20px;display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end}
.filters label{font-size:.78em;color:#666;display:block;margin-bottom:4px;font-weight:500}
.filters input,.filters select{padding:7px 10px;border:1px solid #ddd;border-radius:6px;font-size:.88em;outline:none;width:100%}
.filters input:focus,.filters select:focus{border-color:#4361ee}
.f-group{flex:1;min-width:140px}
.btn-reset{padding:7px 16px;background:#e94560;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:.88em;font-weight:600;white-space:nowrap;height:34px}
.btn-reset:hover{background:#c73652}
.table-box{background:#fff;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,.07);overflow:hidden}
table{width:100%;border-collapse:collapse}
th{background:#1a1a2e;color:#fff;padding:11px 14px;text-align:left;font-size:.8em;font-weight:600;letter-spacing:.03em}
td{padding:10px 14px;border-bottom:1px solid #f0f0f0;font-size:.88em;vertical-align:middle}
tbody tr:hover td{background:#f8f9ff}
tbody tr:last-child td{border-bottom:none}
.badge{display:inline-block;padding:3px 9px;border-radius:12px;font-size:.78em;font-weight:600}
.livre1{background:#d1e7dd;color:#0a3622}.livre2{background:#cfe2ff;color:#084298}.bundle{background:#fff3cd;color:#664d03}
.email-link{color:#4361ee;text-decoration:none}.email-link:hover{text-decoration:underline}
.montant{font-weight:700;color:#198754}
.sid{font-size:.72em;color:#aaa;font-family:monospace}
.empty{text-align:center;padding:50px;color:#aaa;font-size:1em}
.count-info{font-size:.82em;color:#888;margin-bottom:10px}
</style></head><body>
<div class="header">
  <span>📊</span><h1>CRM Ventes — UpGrade</h1>
  <span>Dernière mise à jour : ${new Date().toLocaleString('fr-CH',{timeZone:'Europe/Zurich'})}</span>
</div>
<div class="content">
  <div class="cards">
    <div class="card"><div class="label">Chiffre d'affaires</div><div class="value green" id="totalCA">${totalAll.toFixed(2)} CHF</div></div>
    <div class="card"><div class="label">Ventes totales</div><div class="value blue" id="totalVentes">${rows.length}</div></div>
    <div class="card"><div class="label">Clients uniques</div><div class="value" id="totalClients">${nbClients}</div></div>
    <div class="card"><div class="label">Panier moyen</div><div class="value" id="panierMoyen">${rows.length ? (totalAll / rows.length).toFixed(2) : '0.00'} CHF</div></div>
  </div>

  <div class="chart-box">
    <h2>📈 Chiffre d'affaires par jour</h2>
    <div class="chart-wrap"><canvas id="ventesChart"></canvas></div>
  </div>

  <div class="filters">
    <div class="f-group"><label>🔍 Email ou nom</label><input type="text" id="fText" placeholder="ex: jean@gmail.com" oninput="filtrer()"></div>
    <div class="f-group"><label>📦 Produit</label>
      <select id="fProduit" onchange="filtrer()">
        <option value="">Tous</option>
        <option value="livre1">De l'idée au plan</option>
        <option value="livre2">Compétences humaines</option>
        <option value="bundle">Offre groupée</option>
      </select>
    </div>
    <div class="f-group"><label>📅 Date début</label><input type="date" id="fDateDeb" oninput="filtrer()"></div>
    <div class="f-group"><label>📅 Date fin</label><input type="date" id="fDateFin" oninput="filtrer()"></div>
    <button class="btn-reset" onclick="resetFiltres()">✕ Réinitialiser</button>
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
      borderColor: '#4361ee',
      backgroundColor: 'rgba(67,97,238,.08)',
      borderWidth: 2.5,
      pointBackgroundColor: '#4361ee',
      pointRadius: chartLabels.length < 20 ? 4 : 2,
      tension: 0.35,
      fill: true,
    }]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => c.parsed.y + ' CHF' } } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { beginAtZero: true, ticks: { callback: v => v + ' CHF', font: { size: 11 } }, grid: { color: '#f0f0f0' } }
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
