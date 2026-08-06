#!/usr/bin/env node
// Recruit BATCH: scrape each partner's homepage fast (lite, hard cap), fire it
// into TDE's recruit lens, and move on. Does NOT wait for the (slow) munge.
// Thin / JS-heavy / failed sites are dropped to a revisit list. A later collect
// pass reads atoms + builds pages.
//
// Usage: node tools/recruit_batch.js [partners.csv] [--limit N] [--conc N]
require('../env')();
const fs = require('fs');
const path = require('path');

const TDE = (process.env.TDE_BASE_URL || '').replace(/\/$/, '');
const TKEY = process.env.TDE_API_KEY;
const SCRAPE = (process.env.SCRAPE_URL || '').replace(/\/$/, '');
const SKEY = process.env.SCRAPE_API_KEY;
const TH = { 'x-api-key': TKEY, 'Content-Type': 'application/json' };

const HOME_CAP = 16000, MIN_HOME = 500, SCRAPE_TIMEOUT = 22000;
const arg = (f, d) => { const i = process.argv.indexOf(f); return i >= 0 ? process.argv[i + 1] : d; };
const CONC = parseInt(arg('--conc', '6'), 10);
const LIMIT = parseInt(arg('--limit', '0'), 10);
const DATA = path.join(__dirname, '..', 'data');

const slug = d => d.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\.[a-z.]+$/i, '').replace(/[^a-z0-9]+/gi, '').toLowerCase();
async function tpost(p, b) { const r = await fetch(TDE + p, { method: 'POST', headers: TH, body: JSON.stringify(b) }); return { status: r.status, body: await r.json().catch(() => ({})) }; }
async function tdel(p) { try { await fetch(TDE + p, { method: 'DELETE', headers: TH }); } catch {} }

function splitCsvLine(l) { const o = []; let f = '', q = false; for (let i = 0; i < l.length; i++) { const c = l[i]; if (q) { if (c === '"' && l[i + 1] === '"') { f += '"'; i++; } else if (c === '"') q = false; else f += c; } else if (c === '"') q = true; else if (c === ',') { o.push(f); f = ''; } else f += c; } o.push(f); return o; }
function parseCsv(t) { const ls = t.split(/\r?\n/).filter(l => l.trim()); const h = splitCsvLine(ls[0]).map(x => x.trim().toLowerCase()); return ls.slice(1).map(l => { const c = splitCsvLine(l); const o = {}; h.forEach((k, i) => o[k] = (c[i] || '').trim()); return o; }); }

async function scrapeHome(url) {
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), SCRAPE_TIMEOUT);
  try {
    const r = await fetch(SCRAPE + '/scrape', { method: 'POST', headers: { 'Authorization': 'Bearer ' + SKEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ url, lite_only: true }), signal: ctrl.signal });
    const j = await r.json().catch(() => ({}));
    return { ok: r.status === 200, status: r.status, mode: j.mode || null, md: j.markdown || '' };
  } catch (e) { return { ok: false, status: e.name === 'AbortError' ? 'timeout' : 'error', md: '' }; }
  finally { clearTimeout(t); }
}

async function processOne(p) {
  const domain = (p.domain || '').replace(/^https?:\/\//, '').replace(/\/$/, '').trim();
  const name = p.company || domain;
  if (!domain) return { domain, name, status: 'revisit', reason: 'no-domain' };
  const id = 'partner_' + slug(domain);
  const r = await scrapeHome('https://' + domain);
  if (!r.ok || r.md.length < MIN_HOME) return { domain, name, status: 'revisit', reason: 'scrape:' + r.status };
  await tdel('/collections/' + id);
  await tpost('/collections', { id, name, description: 'partner lens', templateId: 'recruit', entity_role: 'partner' });
  const ing = await tpost('/ingest', { collectionId: id, type: 'text', input: r.md.slice(0, HOME_CAP), opts: { title: name } });
  return ing.status === 200
    ? { domain, name, id, status: 'queued', mode: r.mode, chars: r.md.length }
    : { domain, name, id, status: 'revisit', reason: 'ingest:' + ing.status };
}

async function pool(items, n, fn) {
  const res = new Array(items.length); let i = 0, done = 0;
  const workers = Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) { const idx = i++; res[idx] = await fn(items[idx], idx); done++;
      const r = res[idx]; console.log(`  ${done}/${items.length} ${r.status === 'queued' ? 'OK   ' : 'set-aside'} ${r.name}${r.status !== 'queued' ? ' (' + r.reason + ')' : ''}`); }
  });
  await Promise.all(workers); return res;
}

(async () => {
  const csv = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : path.join(__dirname, '..', 'partners.csv');
  let partners = parseCsv(fs.readFileSync(csv, 'utf8')).filter(p => p.company || p.domain);
  if (LIMIT > 0) partners = partners.slice(0, LIMIT);
  console.log(`Batch: ${partners.length} partners, concurrency ${CONC}. Scrape=lite-only, fire-and-forget ingest.\n`);
  const T0 = Date.now();
  const results = await pool(partners, CONC, processOne);
  const queued = results.filter(r => r.status === 'queued');
  const revisit = results.filter(r => r.status !== 'queued');
  fs.mkdirSync(DATA, { recursive: true });
  fs.writeFileSync(path.join(DATA, 'recruit_queue.json'), JSON.stringify(queued, null, 2));
  fs.writeFileSync(path.join(DATA, 'recruit_revisit.json'), JSON.stringify(revisit, null, 2));
  console.log(`\n================= BATCH DONE =================`);
  console.log(`QUEUED (running in TDE): ${queued.length}`);
  console.log(`SET ASIDE (revisit later): ${revisit.length}`);
  console.log(`Time: ${((Date.now() - T0) / 1000).toFixed(0)}s. Wrote data/recruit_queue.json + data/recruit_revisit.json`);
})().catch(e => { console.error('ERR:', e.message); process.exit(1); });
