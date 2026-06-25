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

// ── Configuration produits (à renseigner via Secrets Replit) ─────────────────
// Identifiants des Payment Links Stripe (plink_xxx) — depuis le dashboard Stripe
const PRODUCTS = {
  [process.env.STRIPE_LINK_LIVRE1 || '__livre1__']: {
    nom: "De l'idée au plan",
    desc: "Guide numérique — De l'idée au plan · 80 pages · Téléchargeable · Imprimable",
    lien: process.env.PROTON_LINK_LIVRE1 || '',
    code: process.env.PROTON_CODE_LIVRE1 || '',
  },
  [process.env.STRIPE_LINK_LIVRE2 || '__livre2__']: {
    nom: "Vos compétences humaines invisibles",
    desc: "Guide numérique — Vos compétences humaines invisibles · 120 pages · Téléchargeable · Imprimable",
    lien: process.env.PROTON_LINK_LIVRE2 || '',
    code: process.env.PROTON_CODE_LIVRE2 || '',
  },
  [process.env.STRIPE_LINK_BUNDLE || '__bundle__']: {
    nom: "Offre groupée — Les deux guides",
    desc: "Guides numériques — De l'idée au plan + Vos compétences humaines invisibles",
    lien: process.env.PROTON_LINK_BUNDLE || '',
    code: process.env.PROTON_CODE_BUNDLE || '',
  },
};

// ── Informations de facturation UpGrade ──────────────────────────────────────
const COMPANY = {
  nom:     process.env.COMPANY_NAME    || 'UpGrade Learning & Development',
  adresse: process.env.COMPANY_ADDRESS || '',
  ide:     process.env.COMPANY_IDE     || '',
  email:   process.env.FROM_EMAIL      || 'bonjour@upgr.ch',
  site:    'www.upgr.ch',
};

// ── Génération PDF facture ────────────────────────────────────────────────────
function genererFacturePDF({ numero, date, client, produit, montant, devise }) {
  return new Promise((resolve, reject) => {
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const gold = '#B48C28';
    const dark = '#0d1628';
    const grey = '#555555';

    // En-tête
    doc.rect(0, 0, doc.page.width, 90).fill(dark);
    doc.fillColor('#F5E090').fontSize(22).font('Helvetica-Bold')
       .text('UpGrade L&D', 50, 28);
    doc.fillColor('#ffffff').fontSize(9).font('Helvetica')
       .text(COMPANY.site, 50, 56);

    doc.fillColor(gold).fontSize(11).font('Helvetica-Bold')
       .text('FACTURE', doc.page.width - 150, 35, { width: 100, align: 'right' });
    doc.fillColor('#ffffff').fontSize(9).font('Helvetica')
       .text(`N° ${numero}`, doc.page.width - 150, 52, { width: 100, align: 'right' })
       .text(date, doc.page.width - 150, 66, { width: 100, align: 'right' });

    // Vendeur / Acheteur
    doc.moveDown(3);
    const y1 = doc.y;
    doc.fillColor(dark).fontSize(9).font('Helvetica-Bold').text('VENDEUR', 50, y1);
    doc.fillColor(grey).font('Helvetica')
       .text(COMPANY.nom, 50, y1 + 14)
       .text(COMPANY.adresse || '', 50, y1 + 26)
       .text(COMPANY.ide ? `IDE : ${COMPANY.ide}` : 'Non assujetti à la TVA', 50, y1 + 38)
       .text(COMPANY.email, 50, y1 + 50);

    doc.fillColor(dark).fontSize(9).font('Helvetica-Bold').text('ACHETEUR', 300, y1);
    doc.fillColor(grey).font('Helvetica')
       .text(client.nom || '', 300, y1 + 14)
       .text(client.email || '', 300, y1 + 26);

    // Ligne séparatrice
    const yTab = y1 + 80;
    doc.moveTo(50, yTab).lineTo(doc.page.width - 50, yTab).strokeColor(gold).lineWidth(1).stroke();

    // Tableau
    doc.fillColor(dark).fontSize(9).font('Helvetica-Bold')
       .text('DÉSIGNATION', 50, yTab + 12)
       .text('MONTANT', doc.page.width - 150, yTab + 12, { width: 100, align: 'right' });

    doc.moveTo(50, yTab + 28).lineTo(doc.page.width - 50, yTab + 28).strokeColor('#dddddd').lineWidth(0.5).stroke();

    doc.fillColor(grey).font('Helvetica').fontSize(9)
       .text(produit.desc, 50, yTab + 38, { width: 360 });

    const montantStr = `${montant} ${devise}`;
    doc.fillColor(dark).font('Helvetica-Bold').fontSize(10)
       .text(montantStr, doc.page.width - 150, yTab + 38, { width: 100, align: 'right' });

    // Total
    const yTotal = yTab + 90;
    doc.moveTo(50, yTotal).lineTo(doc.page.width - 50, yTotal).strokeColor(gold).lineWidth(1).stroke();
    doc.fillColor(dark).font('Helvetica-Bold').fontSize(11)
       .text('TOTAL', 50, yTotal + 12)
       .text(montantStr, doc.page.width - 150, yTotal + 12, { width: 100, align: 'right' });

    // Mention TVA
    doc.fillColor(grey).font('Helvetica').fontSize(8)
       .text(COMPANY.ide ? 'TVA incluse selon taux en vigueur.' : 'Non assujetti à la TVA — Art. 10 LTVA (Suisse) ou équivalent local.', 50, yTotal + 36);

    // Pied de page
    const yFoot = doc.page.height - 60;
    doc.moveTo(50, yFoot).lineTo(doc.page.width - 50, yFoot).strokeColor('#dddddd').lineWidth(0.5).stroke();
    doc.fillColor(grey).fontSize(7).font('Helvetica')
       .text(`${COMPANY.nom} · ${COMPANY.adresse || ''} · ${COMPANY.email} · ${COMPANY.site}`, 50, yFoot + 10, { align: 'center', width: doc.page.width - 100 });

    doc.end();
  });
}

// ── Envoi email ──────────────────────────────────────────────────────────────
function creerTransport() {
  const nodemailer = require('nodemailer');
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'mail.infomaniak.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  });
}

async function envoyerEmailClient({ to, clientNom, produit, lien, code, pdfBuffer, devise, montant, numeroFacture }) {
  const transport = creerTransport();
  const sujet = `Votre commande UpGrade — ${produit.nom}`;
  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:6px;overflow:hidden;max-width:600px;">
        <!-- Header -->
        <tr><td style="background:#0d1628;padding:28px 40px;">
          <span style="font-size:22px;font-weight:bold;color:#F5E090;letter-spacing:0.05em;">UpGrade L&amp;D</span>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:36px 40px;">
          <p style="font-size:16px;color:#0d1628;font-weight:bold;margin:0 0 8px;">Merci pour votre commande${clientNom ? ', ' + clientNom : ''} !</p>
          <p style="font-size:14px;color:#555;margin:0 0 24px;">Votre paiement a bien été reçu. Voici votre lien de téléchargement.</p>

          <div style="background:#0d1628;border-radius:6px;padding:24px 28px;margin-bottom:28px;">
            <p style="color:#F5E090;font-size:11px;font-weight:bold;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 8px;">Votre commande</p>
            <p style="color:#ffffff;font-size:15px;font-weight:bold;margin:0 0 4px;">${produit.nom}</p>
            <p style="color:rgba(255,255,255,0.6);font-size:12px;margin:0 0 20px;">${produit.desc}</p>
            <p style="color:#F5E090;font-size:11px;font-weight:bold;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 8px;">Lien de téléchargement</p>
            <a href="${lien}" style="display:inline-block;background:#F5E090;color:#0d1628;padding:12px 24px;border-radius:3px;text-decoration:none;font-weight:bold;font-size:13px;margin-bottom:14px;">Télécharger mon guide →</a>
            <br>
            <p style="color:rgba(255,255,255,0.7);font-size:12px;margin:8px 0 4px;">Code d'accès :</p>
            <p style="color:#ffffff;font-size:16px;font-weight:bold;letter-spacing:0.2em;margin:0;font-family:monospace;">${code}</p>
          </div>

          <p style="font-size:13px;color:#888;margin:0 0 6px;">Votre facture est jointe à cet email (PDF).</p>
          <p style="font-size:13px;color:#888;margin:0;">Une question ? Écrivez-nous : <a href="mailto:${COMPANY.email}" style="color:#B48C28;">${COMPANY.email}</a></p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f8f8f8;padding:18px 40px;border-top:1px solid #eeeeee;">
          <p style="font-size:11px;color:#aaa;margin:0;text-align:center;">${COMPANY.nom} · ${COMPANY.site}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await transport.sendMail({
    from: `"UpGrade L&D" <${COMPANY.email}>`,
    to,
    subject: sujet,
    html,
    attachments: [{
      filename: `facture-${numeroFacture}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf',
    }],
  });
}

async function envoyerEmailProprietaire({ produit, client, montant, devise, numeroFacture }) {
  const ownerEmail = process.env.OWNER_EMAIL || COMPANY.email;
  const transport = creerTransport();
  await transport.sendMail({
    from: `"UpGrade Webhook" <${COMPANY.email}>`,
    to: ownerEmail,
    subject: `💰 Nouvelle vente — ${produit.nom} · ${montant} ${devise}`,
    text: `Nouvelle commande reçue.\n\nProduit : ${produit.nom}\nMontant : ${montant} ${devise}\nClient : ${client.nom || '—'} <${client.email}>\nFacture : ${numeroFacture}\n\nÀ enregistrer dans facture.net.`,
  });
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

  const client = {
    nom:   (session.customer_details && session.customer_details.name)  || '',
    email: (session.customer_details && session.customer_details.email) || '',
  };

  if (!client.email) {
    console.warn('Email client absent dans la session :', session.id);
    return;
  }

  // Montant : Stripe stocke en centimes (sauf JPY etc.)
  const devise  = (session.currency || 'eur').toUpperCase();
  const montant = (session.amount_total / 100).toFixed(2).replace('.00', '');

  // Numéro de facture : UPGR-YYYYMMDD-SESSIONID(6)
  const now = new Date();
  const yyyymmdd = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
  const numeroFacture = `UPGR-${yyyymmdd}-${session.id.slice(-6).toUpperCase()}`;
  const dateStr = now.toLocaleDateString('fr-CH', { year: 'numeric', month: 'long', day: 'numeric' });

  // Génération PDF
  const pdfBuffer = await genererFacturePDF({
    numero: numeroFacture,
    date: dateStr,
    client,
    produit,
    montant,
    devise,
  });

  // Envoi emails
  await envoyerEmailClient({
    to: client.email,
    clientNom: client.nom,
    produit,
    lien: produit.lien,
    code: produit.code,
    pdfBuffer,
    devise,
    montant,
    numeroFacture,
  });

  await envoyerEmailProprietaire({ produit, client, montant, devise, numeroFacture });

  console.log(`✅ Commande traitée : ${numeroFacture} — ${client.email} — ${produit.nom} — ${montant} ${devise}`);
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
      const rawBody  = Buffer.concat(chunks);
      const sig      = req.headers['stripe-signature'] || '';
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
  if (!process.env.STRIPE_SECRET_KEY)  console.warn('⚠️  STRIPE_SECRET_KEY non défini — webhook inactif');
  if (!process.env.STRIPE_WEBHOOK_SECRET) console.warn('⚠️  STRIPE_WEBHOOK_SECRET non défini — webhook inactif');
  if (!process.env.SMTP_USER) console.warn('⚠️  SMTP_USER non défini — emails inactifs');
});
