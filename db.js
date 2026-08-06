// Data layer for rain-partners.
//
// Two backends, chosen at boot:
//   - Postgres (Railway) when DATABASE_URL is set. Production.
//   - A local JSON file store under ./data otherwise. Lets generate.js and
//     server.js share state locally with zero external dependencies, and lets
//     the server boot without crashing when nothing is configured.
//
// An in-memory L1 map fronts both so hot pages skip the backend entirely.

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CACHE_MAX = 5000;
const memCache = new Map(); // slug -> row (L1)

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: (/sslmode=require/.test(process.env.DATABASE_URL) || process.env.PGSSL === 'require')
        ? { rejectUnauthorized: false }
        : false
    })
  : null;

const USE_PG = !!pool;
const DATA_DIR = path.join(__dirname, 'data');
const PAGES_FILE = path.join(DATA_DIR, 'pages.json');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');
const WCA_FILE = path.join(DATA_DIR, 'wca_requests.json');

const IP_SALT = process.env.IP_SALT || 'rain-partners-default-salt';

// --- L1 cache helpers -------------------------------------------------------
function memSet(key, val) {
  if (memCache.size >= CACHE_MAX) memCache.delete(memCache.keys().next().value);
  memCache.set(key, val);
}

// --- file-store helpers (no-Postgres mode) ---------------------------------
function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}
function writeJson(file, data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function hashIp(ip) {
  if (!ip) return null;
  return crypto.createHash('sha256').update(IP_SALT + ip).digest('hex').slice(0, 32);
}

// --- schema ----------------------------------------------------------------
async function initDb() {
  if (!USE_PG) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const pages = readJson(PAGES_FILE, null);
    console.log(`DB: no DATABASE_URL, using local file store at ${DATA_DIR}` +
      (pages ? ` (${Object.keys(pages).length} pages).` : ' (empty).'));
    return;
  }
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS partner_pages (
      slug          text PRIMARY KEY,
      company       text NOT NULL,
      domain        text,
      contact_name  text,
      contact_email text,
      enrichment    jsonb,
      content       jsonb,
      html          text,
      status        text NOT NULL DEFAULT 'draft',
      created_at    timestamptz NOT NULL DEFAULT now(),
      updated_at    timestamptz NOT NULL DEFAULT now(),
      sent_at       timestamptz,
      first_open_at timestamptz,
      last_open_at  timestamptz,
      open_count    int NOT NULL DEFAULT 0
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS page_events (
      id         bigserial PRIMARY KEY,
      slug       text NOT NULL,
      kind       text NOT NULL,
      ua         text,
      ip_hash    text,
      created_at timestamptz NOT NULL DEFAULT now()
    )`);
    await pool.query(`CREATE INDEX IF NOT EXISTS page_events_slug_idx ON page_events(slug)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS leads (
      id         bigserial PRIMARY KEY,
      slug       text NOT NULL,
      company    text,
      email      text NOT NULL,
      phone      text,
      ua         text,
      ip_hash    text,
      created_at timestamptz NOT NULL DEFAULT now()
    )`);
    await pool.query(`CREATE INDEX IF NOT EXISTS leads_slug_idx ON leads(slug)`);
    // Self-serve WhatsCoolAbout generate requests: a URL submission is a hot
    // interest signal even when no email is ever left.
    await pool.query(`CREATE TABLE IF NOT EXISTS wca_requests (
      id         bigserial PRIMARY KEY,
      domain     text NOT NULL,
      product    text NOT NULL,
      slug       text,
      ip_hash    text,
      ua         text,
      created_at timestamptz NOT NULL DEFAULT now()
    )`);
    await pool.query(`CREATE INDEX IF NOT EXISTS wca_requests_created_idx ON wca_requests(created_at DESC)`);
    const { rows } = await pool.query('SELECT count(*)::int AS n FROM partner_pages');
    console.log(`DB: Postgres ready (${rows[0].n} partner_pages).`);
  } catch (err) {
    console.error('DB: Postgres init failed:', err.message);
  }
}

// --- reads -----------------------------------------------------------------
async function getPage(slug) {
  if (memCache.has(slug)) return memCache.get(slug);
  if (USE_PG) {
    try {
      const { rows } = await pool.query('SELECT * FROM partner_pages WHERE slug = $1', [slug]);
      if (rows[0]) { memSet(slug, rows[0]); return rows[0]; }
    } catch (err) { console.error('DB: pg read failed:', err.message); }
    return null;
  }
  const pages = readJson(PAGES_FILE, {});
  return pages[slug] || null;
}

async function findByCompany(company) {
  const key = (company || '').trim().toLowerCase();
  if (USE_PG) {
    try {
      const { rows } = await pool.query('SELECT * FROM partner_pages WHERE lower(company) = $1 LIMIT 1', [key]);
      return rows[0] || null;
    } catch (err) { console.error('DB: pg lookup failed:', err.message); return null; }
  }
  const pages = readJson(PAGES_FILE, {});
  return Object.values(pages).find(p => (p.company || '').trim().toLowerCase() === key) || null;
}

// --- writes ----------------------------------------------------------------
// Upsert keyed on slug. generate.js decides the slug (reuse existing on
// regenerate, or a fresh newSlug()), so this is idempotent per partner.
async function savePage(rec) {
  memCache.delete(rec.slug);
  if (USE_PG) {
    await pool.query(
      `INSERT INTO partner_pages
         (slug, company, domain, contact_name, contact_email, enrichment, content, html, status, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, now())
       ON CONFLICT (slug) DO UPDATE SET
         company=$2, domain=$3, contact_name=$4, contact_email=$5,
         enrichment=$6, content=$7, html=$8, status=$9, updated_at=now()`,
      [rec.slug, rec.company, rec.domain || null, rec.contact_name || null,
       rec.contact_email || null, rec.enrichment || null, rec.content || null,
       rec.html || null, rec.status || 'ready']
    );
    return rec.slug;
  }
  const pages = readJson(PAGES_FILE, {});
  const now = new Date().toISOString();
  const prev = pages[rec.slug] || {};
  pages[rec.slug] = {
    slug: rec.slug, company: rec.company, domain: rec.domain || null,
    contact_name: rec.contact_name || null, contact_email: rec.contact_email || null,
    enrichment: rec.enrichment || null, content: rec.content || null,
    html: rec.html || null, status: rec.status || 'ready',
    created_at: prev.created_at || now, updated_at: now,
    first_open_at: prev.first_open_at || null, last_open_at: prev.last_open_at || null,
    open_count: prev.open_count || 0
  };
  writeJson(PAGES_FILE, pages);
  return rec.slug;
}

// Insert a page under a freshly minted, collision-checked slug. Returns slug.
async function insertNewPage(rec) {
  const { newSlug } = require('./slug');
  for (let i = 0; i < 5; i++) {
    const slug = newSlug();
    if (await getPage(slug)) continue; // astronomically rare
    await savePage({ ...rec, slug });
    return slug;
  }
  throw new Error('could not mint a unique slug after 5 attempts');
}

// --- events / tracking ------------------------------------------------------
async function recordVisit(slug, kind, req) {
  const ua = req && req.headers ? (req.headers['user-agent'] || null) : null;
  const ip = req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '') : '';
  const ipHash = hashIp((ip || '').split(',')[0].trim());
  const bumps = (kind === 'page_view' || kind === 'open_pixel');

  if (USE_PG) {
    try {
      await pool.query('INSERT INTO page_events (slug, kind, ua, ip_hash) VALUES ($1,$2,$3,$4)',
        [slug, kind, ua, ipHash]);
      if (bumps) {
        await pool.query(
          `UPDATE partner_pages SET open_count = open_count + 1,
             last_open_at = now(),
             first_open_at = COALESCE(first_open_at, now())
           WHERE slug = $1`, [slug]);
        memCache.delete(slug);
      }
    } catch (err) { console.error('DB: event write failed:', err.message); }
    return;
  }
  const events = readJson(EVENTS_FILE, []);
  events.push({ slug, kind, ua, ip_hash: ipHash, created_at: new Date().toISOString() });
  writeJson(EVENTS_FILE, events);
  if (bumps) {
    const pages = readJson(PAGES_FILE, {});
    if (pages[slug]) {
      const now = new Date().toISOString();
      pages[slug].open_count = (pages[slug].open_count || 0) + 1;
      pages[slug].last_open_at = now;
      pages[slug].first_open_at = pages[slug].first_open_at || now;
      writeJson(PAGES_FILE, pages);
      memCache.delete(slug);
    }
  }
}

// A lead is a partner submitting their email (phone optional) via the page CTA.
async function saveLead(slug, email, phone, req) {
  const page = await getPage(slug);
  const company = page ? page.company : null;
  const ua = req && req.headers ? (req.headers['user-agent'] || null) : null;
  const ip = req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '') : '';
  const ipHash = hashIp((ip || '').split(',')[0].trim());
  const lead = { slug, company, email, phone: phone || null, created_at: new Date().toISOString() };

  if (USE_PG) {
    try {
      await pool.query(
        'INSERT INTO leads (slug, company, email, phone, ua, ip_hash) VALUES ($1,$2,$3,$4,$5,$6)',
        [slug, company, email, phone || null, ua, ipHash]);
    } catch (err) { console.error('DB: lead write failed:', err.message); }
  } else {
    const leads = readJson(LEADS_FILE, []);
    leads.push({ ...lead, ua, ip_hash: ipHash });
    writeJson(LEADS_FILE, leads);
  }
  await recordVisit(slug, 'lead', req);
  return lead;
}

async function getLeads() {
  if (USE_PG) {
    const { rows } = await pool.query(
      'SELECT slug, company, email, phone, created_at FROM leads ORDER BY created_at DESC');
    return rows;
  }
  return readJson(LEADS_FILE, []).slice().reverse();
}

async function getStats() {
  if (USE_PG) {
    const { rows } = await pool.query(
      `SELECT p.slug, p.company, p.status, p.open_count, p.first_open_at, p.last_open_at,
              p.created_at, COALESCE(l.n, 0) AS lead_count
         FROM partner_pages p
         LEFT JOIN (SELECT slug, count(*)::int AS n FROM leads GROUP BY slug) l ON l.slug = p.slug
        ORDER BY lead_count DESC, p.open_count DESC, p.created_at DESC`);
    return rows;
  }
  const leadCounts = {};
  for (const l of readJson(LEADS_FILE, [])) leadCounts[l.slug] = (leadCounts[l.slug] || 0) + 1;
  const pages = readJson(PAGES_FILE, {});
  return Object.values(pages)
    .map(p => ({ slug: p.slug, company: p.company, status: p.status,
      open_count: p.open_count || 0, lead_count: leadCounts[p.slug] || 0,
      first_open_at: p.first_open_at, last_open_at: p.last_open_at, created_at: p.created_at }))
    .sort((a, b) => (b.lead_count - a.lead_count) || (b.open_count - a.open_count));
}

// Every stored page with its content, for bulk re-render.
async function getAllPages() {
  if (USE_PG) {
    const { rows } = await pool.query(
      'SELECT slug, company, domain, contact_name, contact_email, content, html, status FROM partner_pages');
    return rows;
  }
  return Object.values(readJson(PAGES_FILE, {}));
}

// --- WhatsCoolAbout self-serve pages ---------------------------------------

// A visitor-generated page for this (domain, product) pair, if one exists.
async function findWcaPage(domain, product) {
  if (USE_PG) {
    const { rows } = await pool.query(
      `SELECT * FROM partner_pages WHERE domain = $1 AND content->'_wca'->>'product' = $2 LIMIT 1`,
      [domain, product]);
    return rows[0] || null;
  }
  const pages = readJson(PAGES_FILE, {});
  return Object.values(pages).find(p => p.domain === domain &&
    p.content && p.content._wca && p.content._wca.product === product) || null;
}

// Log a generate request (the URL submission itself is an interest signal).
async function saveWcaRequest({ domain, product, slug, req }) {
  const ua = req && req.headers ? (req.headers['user-agent'] || null) : null;
  const ip = req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '') : '';
  const ipHash = hashIp((ip || '').split(',')[0].trim());
  if (USE_PG) {
    try {
      await pool.query(
        'INSERT INTO wca_requests (domain, product, slug, ip_hash, ua) VALUES ($1,$2,$3,$4,$5)',
        [domain, product, slug || null, ipHash, ua]);
    } catch (err) { console.error('DB: wca request write failed:', err.message); }
  } else {
    const reqs = readJson(WCA_FILE, []);
    reqs.push({ domain, product, slug: slug || null, ip_hash: ipHash, ua, created_at: new Date().toISOString() });
    writeJson(WCA_FILE, reqs);
  }
}

async function getWcaRequests(limit = 1000) {
  if (USE_PG) {
    const { rows } = await pool.query(
      'SELECT id, domain, product, slug, ip_hash, created_at FROM wca_requests ORDER BY created_at DESC LIMIT $1',
      [limit]);
    return rows;
  }
  return readJson(WCA_FILE, []).slice().reverse().slice(0, limit);
}

module.exports = {
  initDb, getPage, getAllPages, findByCompany, savePage, insertNewPage,
  recordVisit, saveLead, getLeads, getStats,
  findWcaPage, saveWcaRequest, getWcaRequests, USE_PG
};
