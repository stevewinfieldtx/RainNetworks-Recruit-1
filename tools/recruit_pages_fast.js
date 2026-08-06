#!/usr/bin/env node
// FAST direct pipeline: scrape each partner's homepage (lite) and generate the
// page straight from that raw content. No TDE dependency, no munge wait. Builds
// all pages in minutes. TDE's recruit brain populates separately and can upgrade
// these later. Concurrency-safe: pages are built in parallel in memory, then the
// store is written ONCE at the end (no per-page read-modify-write races).
//
// Usage: node tools/recruit_pages_fast.js [partners.csv] [--limit N] [--conc 6]
require('../env')();
const fs = require('fs');
const path = require('path');
const { generatePageContent } = require('../llm');
const { renderPage } = require('../render');
const { newSlug } = require('../slug');

const SCRAPE = (process.env.SCRAPE_URL || '').replace(/\/$/, '');
const SKEY = process.env.SCRAPE_API_KEY;
const BASE_URL = (process.env.BASE_URL || 'http://localhost:4000').replace(/\/$/, '');
const PAGE_PREFIX = (process.env.PAGE_PREFIX || '/p').replace(/\/$/, '');
const PUB = (process.env.PUBLIC_BASE_URL || BASE_URL).replace(/\/$/, '');
const ROOT = path.join(__dirname, '..');
const PAGES_FILE = path.join(ROOT, 'data', 'pages.json');
const HOME_CAP = 16000, MIN_HOME = 500, SCRAPE_TIMEOUT = 22000;
const arg = (f, d) => { const i = process.argv.indexOf(f); return i >= 0 ? process.argv[i + 1] : d; };
const CONC = parseInt(arg('--conc', '6'), 10);
const LIMIT = parseInt(arg('--limit', '0'), 10);

function splitCsvLine(l) { const o = []; let f = '', q = false; for (let i = 0; i < l.length; i++) { const c = l[i]; if (q) { if (c === '"' && l[i + 1] === '"') { f += '"'; i++; } else if (c === '"') q = false; else f += c; } else if (c === '"') q = true; else if (c === ',') { o.push(f); f = ''; } else f += c; } o.push(f); return o; }
function parseCsv(t) { const ls = t.split(/\r?\n/).filter(l => l.trim()); const h = splitCsvLine(ls[0]).map(x => x.trim().toLowerCase()); return ls.slice(1).map(l => { const c = splitCsvLine(l); const o = {}; h.forEach((k, i) => o[k] = (c[i] || '').trim()); return o; }); }
const readJson = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };

async function scrapeHome(url) {
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), SCRAPE_TIMEOUT);
  try {
    const r = await fetch(SCRAPE + '/scrape', { method: 'POST', headers: { 'Authorization': 'Bearer ' + SKEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ url, lite_only: true }), signal: ctrl.signal });
    const j = await r.json().catch(() => ({}));
    return { ok: r.status === 200, status: r.status, md: j.markdown || '' };
  } catch (e) { return { ok: false, status: e.name === 'AbortError' ? 'timeout' : 'error', md: '' }; }
  finally { clearTimeout(t); }
}

async function pool(items, n, fn) { const res = new Array(items.length); let i = 0, done = 0; await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (i < items.length) { const idx = i++; res[idx] = await fn(items[idx]); done++; const r = res[idx]; if (done % 10 === 0 || r.state !== 'built') console.log(`  ${done}/${items.length} ${r.state} ${r.name || ''}${r.reason ? ' (' + r.reason + ')' : ''}`); } })); return res; }

(async () => {
  const csv = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : path.join(ROOT, 'partners.csv');
  let partners = parseCsv(fs.readFileSync(csv, 'utf8')).filter(p => p.company || p.domain);
  if (LIMIT > 0) partners = partners.slice(0, LIMIT);

  const store = readJson(PAGES_FILE, {});
  const slugByCompany = {}; for (const [slug, row] of Object.entries(store)) if (row.company) slugByCompany[row.company.toLowerCase()] = slug;

  console.log(`Fast pages: ${partners.length} partners, concurrency ${CONC}, direct from scrape (no TDE).\n`);
  const T0 = Date.now();
  const results = await pool(partners, CONC, async (p) => {
    const domain = (p.domain || '').replace(/^https?:\/\//, '').replace(/\/$/, '').trim();
    const name = p.company || domain;
    if (!domain) return { name, state: 'skip', reason: 'no-domain' };
    const r = await scrapeHome('https://' + domain);
    if (!r.ok || r.md.length < MIN_HOME) return { name, domain, state: 'skip', reason: 'scrape:' + r.status };
    const content = await generatePageContent(name, { homepage_text: r.md.slice(0, HOME_CAP) });
    content._fast = true;
    const slug = slugByCompany[name.toLowerCase()] || newSlug();
    const html = renderPage(content, { slug, prefix: PAGE_PREFIX, base_url: PUB });
    return { name, domain, state: 'built', slug, content, html, contact_email: p.contact_email || '', contact_name: p.contact_name || '' };
  });

  const built = results.filter(r => r.state === 'built');
  const now = new Date().toISOString();
  for (const r of built) {
    const prev = store[r.slug] || {};
    store[r.slug] = { slug: r.slug, company: r.name, domain: r.domain, contact_name: r.contact_name || null, contact_email: r.contact_email || null,
      enrichment: null, content: r.content, html: r.html, status: 'ready',
      created_at: prev.created_at || now, updated_at: now, first_open_at: prev.first_open_at || null, last_open_at: prev.last_open_at || null, open_count: prev.open_count || 0 };
  }
  fs.mkdirSync(path.dirname(PAGES_FILE), { recursive: true });
  fs.writeFileSync(PAGES_FILE, JSON.stringify(store, null, 2)); // single write, race-free

  const rows = ['company,contact_email,first_name,url'];
  for (const r of built) rows.push(`${JSON.stringify(r.name)},${r.contact_email || ''},${(r.contact_name || '').split(' ')[0]},${PUB}${PAGE_PREFIX}/${r.slug}`);
  fs.writeFileSync(path.join(ROOT, 'campaign.csv'), rows.join('\n') + '\n');

  const skipped = results.filter(r => r.state === 'skip');
  console.log(`\n================= FAST PAGES DONE =================`);
  console.log(`BUILT: ${built.length} | SKIPPED (thin/JS-heavy): ${skipped.length} | ${((Date.now() - T0) / 1000).toFixed(0)}s`);
  console.log(`Store: data/pages.json | campaign.csv updated with ${built.length} URLs.`);
})().catch(e => { console.error('ERR:', e.message); process.exit(1); });
