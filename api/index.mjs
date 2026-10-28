// API Écrin Beauté — Neon Function sans dépendance externe.
// SQL via l'endpoint HTTP de Neon (le même que @neondatabase/serverless), jetons HMAC, mots de passe scrypt.
import crypto from 'node:crypto';

const ORIGINS = [/^https:\/\/acilla-site\.onrender\.com$/, /^http:\/\/localhost(:\d+)?$/, /^http:\/\/127\.0\.0\.1(:\d+)?$/];
const STATUTS = ['nouvelle', 'confirmee', 'expediee', 'livree', 'annulee'];
const STOCK_RESERVE = ['confirmee', 'expediee', 'livree']; // statuts qui consomment le stock

/* ---------------- SQL sur HTTP ---------------- */
const DB = process.env.DATABASE_URL;
function sqlEndpoint() {
  const host = new URL(DB).hostname;
  return 'https://' + host.replace(/^[^.]+\./, 'api.') + '/sql';
}
async function neonFetch(body, extraHeaders = {}) {
  const res = await fetch(sqlEndpoint(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Neon-Connection-String': DB, 'Neon-Raw-Text-Output': 'true', 'Neon-Array-Mode': 'false', ...extraHeaders },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = null; }
  if (!res.ok) { const e = new Error('SQL ' + res.status + ': ' + (json && (json.message || json.error) || text.slice(0, 300))); e.sql = true; throw e; }
  return json;
}
async function sql(query, params = []) { return (await neonFetch({ query, params: params.map(p => p == null ? null : (typeof p === 'object' ? JSON.stringify(p) : String(p))) })).rows; }
async function tx(queries) {
  const out = await neonFetch({ queries: queries.map(([query, params = []]) => ({ query, params: params.map(p => p == null ? null : (typeof p === 'object' ? JSON.stringify(p) : String(p))) })) },
    { 'Neon-Batch-Isolation-Level': 'ReadCommitted', 'Neon-Batch-Read-Only': 'false' });
  return out.results.map(r => r.rows);
}
const num = v => v == null ? null : Number(v);
const bool = v => v === true || v === 't' || v === 'true';
const json = v => typeof v === 'string' ? JSON.parse(v) : v;

/* ---------------- Utilitaires HTTP ---------------- */
function corsHeaders(req) {
  const o = req.headers.get('origin') || '';
  const h = { 'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Max-Age': '86400', Vary: 'Origin' };
  if (ORIGINS.some(r => r.test(o))) h['Access-Control-Allow-Origin'] = o;
  return h;
}
function reply(req, status, data, extra = {}) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...corsHeaders(req), ...extra } });
}
const err = (req, status, message) => reply(req, status, { erreur: message });
async function body(req) { try { const t = await req.text(); if (t.length > 20000) return null; return JSON.parse(t || '{}'); } catch { return null; } }
function ip(req) {
  const v = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || req.headers.get('cf-connecting-ip') || req.headers.get('fly-client-ip') || '';
  return v.split(',')[0].trim() || null;
}
let headersLogged = false;
function logHeadersOnce(req) { if (headersLogged) return; headersLogged = true; console.log('[en-tetes]', [...req.headers.keys()].join(',')); }

// Limiteur simple par isolat (complète, sans remplacer, une protection en amont)
const buckets = new Map();
function limited(key, max, windowMs) {
  const now = Date.now(); const b = buckets.get(key) || { n: 0, t: now };
  if (now - b.t > windowMs) { b.n = 0; b.t = now; }
  b.n++; buckets.set(key, b);
  if (buckets.size > 5000) for (const [k, v] of buckets) if (now - v.t > windowMs) buckets.delete(k);
  return b.n > max;
}

/* ---------------- Jetons et mots de passe ---------------- */
let secretCache = null;
async function secret() {
  if (!secretCache) secretCache = (await sql("SELECT valeur FROM reglages WHERE cle='jwt_secret'"))[0].valeur;
  return secretCache;
}
const b64u = b => Buffer.from(b).toString('base64url');
async function signToken(payload) {
  const head = b64u(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const pl = b64u(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', await secret()).update(head + '.' + pl).digest('base64url');
  return head + '.' + pl + '.' + sig;
}
async function verifyToken(tok) {
  if (!tok) return null;
  const [h, p, s] = tok.split('.'); if (!h || !p || !s) return null;
  const good = crypto.createHmac('sha256', await secret()).update(h + '.' + p).digest();
  const given = Buffer.from(s, 'base64url');
  if (given.length !== good.length || !crypto.timingSafeEqual(given, good)) return null;
  try { const pl = JSON.parse(Buffer.from(p, 'base64url').toString()); return pl.exp > Date.now() / 1000 ? pl : null; } catch { return null; }
}
function checkPassword(pw, stored) {
  const [alg, N, r, p, salt, hash] = stored.split('$');
  if (alg !== 'scrypt') return false;
  const h = crypto.scryptSync(String(pw), Buffer.from(salt, 'base64'), 32, { N: +N, r: +r, p: +p, maxmem: 64 * 1024 * 1024 });
  const ref = Buffer.from(hash, 'base64');
  return ref.length === h.length && crypto.timingSafeEqual(ref, h);
}
function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const h = crypto.scryptSync(String(pw), salt, 32, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt.toString('base64')}$${h.toString('base64')}`;
}

/* ---------------- Routes publiques ---------------- */
async function catalogue(req) {
  logHeadersOnce(req);
  const rows = await sql("SELECT id, nom, description, contenance, prix, stock, visible, variantes FROM produits ORDER BY ordre");
  const liv = await sql("SELECT valeur FROM reglages WHERE cle='livraison_tnd'");
  return reply(req, 200, {
    livraison_tnd: num(liv[0]?.valeur ?? 7),
    produits: rows.map(r => ({ id: r.id, nom: r.nom, description: r.description, contenance: r.contenance, prix: num(r.prix), stock: num(r.stock), visible: bool(r.visible), variantes: json(r.variantes) })),
  }, { 'Cache-Control': 'public, max-age=30' });
}

async function creerCommande(req) {
  const cip = ip(req);
  if (limited('cmd:global', 300, 10 * 60 * 1000) || (cip && limited('cmd:' + cip, 8, 10 * 60 * 1000))) return err(req, 429, 'Trop de commandes en peu de temps. Réessayez dans quelques minutes.');
  const b = await body(req);
  if (!b || !Array.isArray(b.lignes) || !b.lignes.length || b.lignes.length > 40) return err(req, 400, 'Panier invalide.');
  const ids = [...new Set(b.lignes.map(l => String(l.id)))];
  const prods = await sql('SELECT id, nom, reference, prix, stock, visible, variantes FROM produits WHERE id IN (SELECT jsonb_array_elements_text($1::jsonb))', [ids]);
  const by = Object.fromEntries(prods.map(p => [p.id, p]));
  const lignes = []; let sousTotal = 0; let aConfirmer = false;
  for (const l of b.lignes) {
    const p = by[String(l.id)]; const q = Math.floor(Number(l.q));
    if (!p || !bool(p.visible) || !(q >= 1 && q <= 20)) return err(req, 400, 'Un produit du panier n’est plus disponible.');
    const vars = json(p.variantes) || []; let label = p.nom; let prix = num(p.prix);
    if (vars.length) {
      const vi = Number(l.v); const v = vars[Number.isInteger(vi) ? vi : 0];
      if (!v) return err(req, 400, 'Version de produit invalide.');
      label += ' (' + v.label + ')'; prix = Number(v.prix);
    }
    if (p.stock != null && num(p.stock) < q) return err(req, 409, `Stock insuffisant pour « ${p.nom} » (reste ${num(p.stock)}).`);
    if (!(prix > 0)) aConfirmer = true;
    sousTotal += prix * q;
    lignes.push({ id: p.id, variante: vars.length ? Number(l.v) || 0 : null, libelle: label, reference: p.reference, prix, quantite: q, total: prix * q });
  }
  const c = b.client || {};
  const clip = (s, n) => String(s || '').trim().slice(0, n) || null;
  const liv = num((await sql("SELECT valeur FROM reglages WHERE cle='livraison_tnd'"))[0]?.valeur ?? 7);
  const [, rows] = await tx([
    ["UPDATE reglages SET valeur = (valeur::int + 1)::text, updated_at = now() WHERE cle = 'commande_compteur'"],
    [`INSERT INTO commandes (numero, client_nom, client_tel, client_adresse, lignes, sous_total, livraison, total, prix_a_confirmer)
      SELECT 'EB' || to_char(now() AT TIME ZONE 'Africa/Tunis', 'YYMMDD') || '-' || lpad((SELECT valeur FROM reglages WHERE cle='commande_compteur'), 4, '0'), $1, $2, $3, $4::jsonb, $5, $6, $7, $8
      RETURNING id, numero, total`, [clip(c.nom, 120), clip(c.tel, 40), clip(c.adresse, 300), lignes, sousTotal, liv, sousTotal + liv, aConfirmer]],
  ]);
  return reply(req, 201, { numero: rows[0].numero, total: num(rows[0].total), livraison: liv, prix_a_confirmer: aConfirmer });
}

/* ---------------- Administration ---------------- */
async function connexion(req) {
  if (limited('login:' + (ip(req) || 'global'), ip(req) ? 8 : 30, 15 * 60 * 1000)) return err(req, 429, 'Trop de tentatives. Réessayez dans 15 minutes.');
  const b = await body(req);
  const stored = (await sql("SELECT valeur FROM reglages WHERE cle='admin_password'"))[0]?.valeur;
  if (!b || !stored || !checkPassword(b.mot_de_passe || '', stored)) return err(req, 401, 'Mot de passe incorrect.');
  const exp = Math.floor(Date.now() / 1000) + 12 * 3600;
  return reply(req, 200, { jeton: await signToken({ sub: 'admin', exp }), expire: exp });
}

async function resume(req) {
  const [kpi, parStatut, jours, top, stockBas] = await Promise.all([
    sql(`SELECT
        count(*) FILTER (WHERE statut <> 'annulee') AS nb,
        coalesce(sum(total) FILTER (WHERE statut IN ('confirmee','expediee','livree')), 0) AS ca,
        count(*) FILTER (WHERE statut = 'nouvelle') AS a_traiter,
        count(*) FILTER (WHERE created_at >= date_trunc('day', now() AT TIME ZONE 'Africa/Tunis') AT TIME ZONE 'Africa/Tunis') AS aujourdhui,
        coalesce(avg(total) FILTER (WHERE statut IN ('confirmee','expediee','livree')), 0) AS panier_moyen
      FROM commandes`),
    sql("SELECT statut, count(*) AS n FROM commandes GROUP BY statut"),
    sql(`SELECT to_char(d, 'YYYY-MM-DD') AS jour,
        coalesce(sum(c.total) FILTER (WHERE c.statut IN ('confirmee','expediee','livree')), 0) AS ca,
        count(c.id) FILTER (WHERE c.statut <> 'annulee') AS nb
      FROM generate_series((now() AT TIME ZONE 'Africa/Tunis')::date - 29, (now() AT TIME ZONE 'Africa/Tunis')::date, interval '1 day') d
      LEFT JOIN commandes c ON (c.created_at AT TIME ZONE 'Africa/Tunis')::date = d::date
      GROUP BY d ORDER BY d`),
    sql(`SELECT l->>'id' AS id, max(l->>'libelle') AS libelle, sum((l->>'quantite')::int) AS quantite, sum((l->>'total')::numeric) AS montant
      FROM commandes, jsonb_array_elements(lignes) l WHERE statut IN ('confirmee','expediee','livree')
      GROUP BY 1 ORDER BY quantite DESC LIMIT 8`),
    sql("SELECT id, nom, stock FROM produits WHERE stock IS NOT NULL AND stock <= 3 AND visible ORDER BY stock, nom LIMIT 20"),
  ]);
  const k = kpi[0];
  return reply(req, 200, {
    commandes: num(k.nb), chiffre_affaires: num(k.ca), a_traiter: num(k.a_traiter), aujourdhui: num(k.aujourdhui), panier_moyen: num(k.panier_moyen),
    par_statut: Object.fromEntries(parStatut.map(r => [r.statut, num(r.n)])),
    jours: jours.map(r => ({ jour: r.jour, ca: num(r.ca), nb: num(r.nb) })),
    top: top.map(r => ({ id: r.id, libelle: r.libelle, quantite: num(r.quantite), montant: num(r.montant) })),
    stock_bas: stockBas.map(r => ({ id: r.id, nom: r.nom, stock: num(r.stock) })),
  });
}

async function listeCommandes(req, url) {
  const statut = url.searchParams.get('statut'); const q = (url.searchParams.get('q') || '').trim();
  const params = []; const where = [];
  if (statut && STATUTS.includes(statut)) { params.push(statut); where.push(`statut = $${params.length}`); }
  if (q) { params.push('%' + q.replace(/[%_\\]/g, '\\$&') + '%'); where.push(`(numero ILIKE $${params.length} OR client_nom ILIKE $${params.length} OR client_tel ILIKE $${params.length})`); }
  const rows = await sql(`SELECT id, numero, created_at, client_nom, client_tel, client_adresse, lignes, sous_total, livraison, total, prix_a_confirmer, statut, note
    FROM commandes ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY created_at DESC LIMIT 200`, params);
  return reply(req, 200, rows.map(r => ({ ...r, id: num(r.id), lignes: json(r.lignes), sous_total: num(r.sous_total), livraison: num(r.livraison), total: num(r.total), prix_a_confirmer: bool(r.prix_a_confirmer) })));
}

async function majCommande(req, id) {
  const b = await body(req); if (!b) return err(req, 400, 'Requête invalide.');
  const cur = (await sql('SELECT statut, lignes FROM commandes WHERE id = $1', [id]))[0];
  if (!cur) return err(req, 404, 'Commande introuvable.');
  const nouveau = b.statut ?? cur.statut;
  if (!STATUTS.includes(nouveau)) return err(req, 400, 'Statut invalide.');
  const queries = [];
  const avant = STOCK_RESERVE.includes(cur.statut), apres = STOCK_RESERVE.includes(nouveau);
  if (avant !== apres) {
    // passage en confirmée : on retire du stock ; annulation d'une commande confirmée : on le remet
    const sens = apres ? -1 : 1;
    for (const l of json(cur.lignes)) queries.push(['UPDATE produits SET stock = greatest(stock + $1, 0), updated_at = now() WHERE id = $2 AND stock IS NOT NULL', [sens * Number(l.quantite), l.id]]);
  }
  queries.push(['UPDATE commandes SET statut = $1, note = coalesce($2, note), updated_at = now() WHERE id = $3 RETURNING id, statut, note', [nouveau, b.note == null ? null : String(b.note).slice(0, 1000), id]]);
  const res = await tx(queries);
  return reply(req, 200, res[res.length - 1][0]);
}

async function listeProduits(req) {
  const rows = await sql('SELECT id, categorie, sous_cat, nom, description, contenance, reference, prix, stock, visible, variantes, updated_at FROM produits ORDER BY ordre');
  return reply(req, 200, rows.map(r => ({ ...r, prix: num(r.prix), stock: num(r.stock), visible: bool(r.visible), variantes: json(r.variantes) })));
}

async function majProduit(req, id) {
  const b = await body(req); if (!b) return err(req, 400, 'Requête invalide.');
  const sets = []; const params = [];
  const set = (col, val) => { params.push(val); sets.push(`${col} = $${params.length}`); };
  if ('prix' in b) { const v = Number(b.prix); if (!(v >= 0 && v < 100000)) return err(req, 400, 'Prix invalide.'); set('prix', v); }
  if ('stock' in b) { if (b.stock === null || b.stock === '') set('stock', null); else { const v = Math.floor(Number(b.stock)); if (!(v >= 0 && v < 100000)) return err(req, 400, 'Stock invalide.'); set('stock', v); } }
  if ('visible' in b) set('visible', !!b.visible);
  if ('nom' in b) { const v = String(b.nom).trim(); if (!v || v.length > 200) return err(req, 400, 'Nom invalide.'); set('nom', v); }
  if ('description' in b) set('description', String(b.description || '').slice(0, 3000));
  if ('contenance' in b) set('contenance', String(b.contenance || '').slice(0, 40) || null);
  if ('variantes' in b) {
    if (!Array.isArray(b.variantes) || b.variantes.some(v => !v || !v.label || !(Number(v.prix) >= 0))) return err(req, 400, 'Variantes invalides.');
    set('variantes', JSON.stringify(b.variantes.map(v => ({ code: v.code || null, label: String(v.label).slice(0, 120), prix: Number(v.prix) }))));
    sets[sets.length - 1] += '::jsonb';
  }
  if (!sets.length) return err(req, 400, 'Rien à modifier.');
  params.push(id);
  const rows = await sql(`UPDATE produits SET ${sets.join(', ')}, updated_at = now() WHERE id = $${params.length} RETURNING id, nom, prix, stock, visible, variantes`, params);
  if (!rows.length) return err(req, 404, 'Produit introuvable.');
  const r = rows[0];
  return reply(req, 200, { ...r, prix: num(r.prix), stock: num(r.stock), visible: bool(r.visible), variantes: json(r.variantes) });
}

async function changerMotDePasse(req) {
  const b = await body(req);
  const stored = (await sql("SELECT valeur FROM reglages WHERE cle='admin_password'"))[0].valeur;
  if (!b || !checkPassword(b.ancien || '', stored)) return err(req, 401, 'Mot de passe actuel incorrect.');
  if (String(b.nouveau || '').length < 10) return err(req, 400, 'Le nouveau mot de passe doit faire au moins 10 caractères.');
  await sql("UPDATE reglages SET valeur = $1, updated_at = now() WHERE cle = 'admin_password'", [hashPassword(b.nouveau)]);
  return reply(req, 200, { ok: true });
}


/* ---------------- Autotest (actif seulement si reglages.autotest_actif = '1') ---------------- */
async function autotest(handler) {
  const on = (await sql("SELECT valeur FROM reglages WHERE cle='autotest_actif'"))[0]?.valeur === '1';
  if (!on) return null;
  const log = []; const ok = (nom, cond, info) => log.push((cond ? 'OK   ' : 'ECHEC ') + nom + (info ? ' — ' + info : ''));
  const call = async (method, path, data, token) => {
    const r = await handler.fetch(new Request('https://autotest.local' + path, { method, headers: { 'Content-Type': 'application/json', Origin: 'https://acilla-site.onrender.com', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: data ? JSON.stringify(data) : undefined }));
    let j = null; try { j = await r.json(); } catch {}
    return { s: r.status, j, h: r.headers };
  };
  try {
    let r = await call('GET', '/api/catalogue');
    ok('catalogue', r.s === 200 && r.j.produits.length >= 80, r.j && r.j.produits && r.j.produits.length + ' produits');
    ok('cors', r.h.get('access-control-allow-origin') === 'https://acilla-site.onrender.com');
    const jojoba = r.j.produits.find(p => p.id === 'huile-jojoba');
    // stock de test sur le jojoba
    await sql("UPDATE produits SET stock = 5 WHERE id = 'huile-jojoba'");
    r = await call('POST', '/api/commandes', { lignes: [{ id: 'huile-jojoba', q: 2 }, { id: 'narcisse', v: 1, q: 1 }], client: { nom: 'TEST AUTOTEST', tel: '00000000', adresse: 'Tunis' } });
    ok('commande créée', r.s === 201 && /^EB\d{6}-\d{4}$/.test(r.j.numero), r.j && (r.j.numero + ' total ' + r.j.total));
    ok('total serveur', r.j && r.j.total === jojoba.prix * 2 + 65 + 7, 'attendu ' + (jojoba.prix * 2 + 72));
    const numero = r.j && r.j.numero;
    r = await call('POST', '/api/commandes', { lignes: [{ id: 'huile-jojoba', q: 9 }] });
    ok('refus stock insuffisant', r.s === 409, r.j && r.j.erreur);
    r = await call('POST', '/api/commandes', { lignes: [{ id: 'inexistant', q: 1 }] });
    ok('refus produit inconnu', r.s === 400);
    r = await call('POST', '/api/admin/connexion', { mot_de_passe: 'mauvais' });
    ok('connexion refusée', r.s === 401);
    r = await call('GET', '/api/admin/resume');
    ok('admin sans jeton refusé', r.s === 401);
    const tok = await signToken({ sub: 'admin', exp: Math.floor(Date.now() / 1000) + 300 });
    r = await call('GET', '/api/admin/resume', null, tok);
    ok('résumé', r.s === 200 && r.j.par_statut.nouvelle >= 1 && r.j.jours.length === 30, r.j && JSON.stringify({ a_traiter: r.j.a_traiter, commandes: r.j.commandes }));
    r = await call('GET', '/api/admin/commandes?q=AUTOTEST', null, tok);
    const cmd = r.j && r.j.find(c => c.numero === numero);
    ok('liste commandes', r.s === 200 && !!cmd);
    r = await call('PATCH', '/api/admin/commandes/' + cmd.id, { statut: 'confirmee', note: 'test' }, tok);
    let st = (await sql("SELECT stock FROM produits WHERE id='huile-jojoba'"))[0].stock;
    ok('confirmation décrémente le stock', r.s === 200 && Number(st) === 3, 'stock ' + st);
    r = await call('GET', '/api/admin/resume', null, tok);
    ok('CA après confirmation', r.j.chiffre_affaires >= jojoba.prix * 2 + 72, 'CA ' + r.j.chiffre_affaires);
    r = await call('PATCH', '/api/admin/commandes/' + cmd.id, { statut: 'annulee' }, tok);
    st = (await sql("SELECT stock FROM produits WHERE id='huile-jojoba'"))[0].stock;
    ok('annulation remet le stock', r.s === 200 && Number(st) === 5, 'stock ' + st);
    r = await call('PATCH', '/api/admin/produits/huile-jojoba', { prix: 16.5, visible: true, stock: null }, tok);
    ok('modif produit', r.s === 200 && r.j.prix === 16.5 && r.j.stock === null);
    r = await call('PATCH', '/api/admin/produits/huile-jojoba', { prix: -3 }, tok);
    ok('prix négatif refusé', r.s === 400);
    r = await call('GET', '/api/admin/produits', null, tok);
    ok('liste produits', r.s === 200 && r.j.length >= 80);
    // nettoyage
    await sql("UPDATE produits SET prix = $1, stock = NULL WHERE id = 'huile-jojoba'", [jojoba.prix]);
    await sql("DELETE FROM commandes WHERE client_nom = 'TEST AUTOTEST'");
    await sql("UPDATE reglages SET valeur = '0' WHERE cle = 'commande_compteur'");
    ok('nettoyage', true);
  } catch (e) { ok('exception', false, e.message); }
  console.log('[autotest]\n' + log.join('\n'));
  return log;
}

/* ---------------- Routeur ---------------- */
const app = {
  async fetch(req) {
    const url = new URL(req.url); const path = url.pathname.replace(/\/+$/, '') || '/'; const m = req.method;
    if (m === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(req) });
    try {
      if (path === '/' || path === '/api/sante') {
        const r = await sql('SELECT count(*) AS n FROM produits');
        console.log('[sante] ok', r[0].n);
        return reply(req, 200, { ok: true, produits: num(r[0].n) });
      }
      if (path === '/api/autotest' && m === 'POST') { const log = await autotest(app); return log ? reply(req, 200, log) : err(req, 404, 'Route inconnue.'); }
      if (path === '/api/catalogue' && m === 'GET') return await catalogue(req);
      if (path === '/api/commandes' && m === 'POST') return await creerCommande(req);
      if (path === '/api/admin/connexion' && m === 'POST') return await connexion(req);
      if (path.startsWith('/api/admin/')) {
        const auth = req.headers.get('authorization') || '';
        const pl = await verifyToken(auth.toLowerCase().startsWith('bearer ') ? auth.slice(7) : '');
        if (!pl || pl.sub !== 'admin') return err(req, 401, 'Session expirée. Reconnectez-vous.');
        if (path === '/api/admin/resume' && m === 'GET') return await resume(req);
        if (path === '/api/admin/commandes' && m === 'GET') return await listeCommandes(req, url);
        let mm = path.match(/^\/api\/admin\/commandes\/(\d+)$/);
        if (mm && m === 'PATCH') return await majCommande(req, mm[1]);
        if (path === '/api/admin/produits' && m === 'GET') return await listeProduits(req);
        mm = path.match(/^\/api\/admin\/produits\/([\w-]{1,80})$/);
        if (mm && m === 'PATCH') return await majProduit(req, mm[1]);
        if (path === '/api/admin/mot-de-passe' && m === 'POST') return await changerMotDePasse(req);
      }
      return err(req, 404, 'Route inconnue.');
    } catch (e) {
      console.error('[api]', m, path, e && e.message);
      return err(req, 500, 'Erreur serveur. Réessayez.');
    }
  },
};
export default app;
