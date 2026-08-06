#!/usr/bin/env node
// Collect pass: for each QUEUED partner whose TDE recruit decomposition is
// ready, pull atoms + summary, generate the page copy, render, and store it in
// rain-partners (slug + /p/<slug>). Idempotent + re-runnable: skips partners
// still decomposing and partners that already have a page. Run repeatedly until
// the queue drains.
//
// Usage: node tools/recruit_collect.js [--conc 4]
require('../env')();
const fs = require('fs');
const path = require('path');
const { generatePageContent } = require('../llm');
const { renderPage } = require('../render');
const db = require('../db');

const TDE = (process.env.TDE_BASE_URL || '').replace(/\/$/, '');
const TH = { 'x-api-key': process.env.TDE_API_KEY };
const BASE_URL = (process.env.BASE_URL || 'http://localhost:4000').replace(/\/$/, '');
const MIN_ATOMS = 12;
const arg = (f, d) => { const i = process.argv.indexOf(f); return i >= 0 ? process.argv[i + 1] : d; };
const CONC = parseInt(arg('--conc', '4'), 10);
const ROOT = path.join(__dirname, '..');

async function jget(p) { const r = await fetch(TDE + p, { headers: TH }); return r.json().catch(() => ({})); }

// Map partner domain -> {email, first} from the source CSV for the campaign file.
const csv = fs.readFileSync(path.join(ROOT, 'partners.csv'), 'utf8').split(/\r?\n/).filter(Boolean).slice(1);
const contact = {};
for (const line of csv) { const c = line.split(','); const dom = (c[1] || '').replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '').toLowerCase(); if (dom) contact[dom] = { name: c[2] || '', email: c[3] || '' }; }

function enrichmentFromAtoms(summary, atoms) {
  const cat = c => atoms.filter(a => (a.dimensions && a.dimensions.recruit_category) === c).map(a => a.text);
  const geo = cat('where_they_operate');
  const location = (geo[0] || '').replace(/^.*?\b(operates? in|serves|based in|located in)\b/i, '').replace(/\.$/, '').trim();
  const facts = atoms.map(a => `- [${(a.dimensions && a.dimensions.recruit_category) || '?'}] ${a.text}`).join('\n');
  return { location: location || undefined, existing_alliances: cat('existing_alliances'),
    homepage_text: `PARTNER PROFILE (Rain recruit research on TDE):\n${summary || ''}\n\nVERIFIED FACTS:\n${facts}` };
}

async function collectOne(p) {
  const domKey = (p.domain || '').replace(/^www\./, '').toLowerCase();
  const stats = await jget('/stats/' + p.id);
  if (!stats || (stats.atomCount || 0) < MIN_ATOMS) return { ...p, state: 'pending', atoms: stats && stats.atomCount || 0 };

  const existing = await db.findByCompany(p.name);
  // Skip only pages already built from recruit atoms; old pre-recruit pages get rebuilt.
  if (existing && existing.content && existing.content._recruit) return { ...p, state: 'exists', slug: existing.slug };

  const meta = await jget(`/intelligence/${p.id}?type=recruit_meta`);
  const md = meta && meta.data ? (Array.isArray(meta.data) ? meta.data[0] : meta.data) : {};
  const atoms = await jget('/atoms/' + p.id);
  const list = Array.isArray(atoms) ? atoms : [];
  const content = await generatePageContent(p.name, enrichmentFromAtoms(md.summary || '', list));
  content._recruit = true;  // mark as recruit-built so re-runs skip it

  const c = contact[domKey] || {};
  let slug = existing ? existing.slug : await db.insertNewPage({ company: p.name, domain: p.domain, contact_email: c.email || null, contact_name: c.name || null, content, html: null, status: 'ready' });
  const html = renderPage(content, { slug, base_url: BASE_URL });
  await db.savePage({ slug, company: p.name, domain: p.domain, contact_email: c.email || null, contact_name: c.name || null, content, html, status: 'ready' });
  return { ...p, state: 'built', slug, atoms: list.length };
}

async function pool(items, n, fn) {
  const res = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (i < items.length) { const idx = i++; res[idx] = await fn(items[idx]); } }));
  return res;
}

(async () => {
  await db.initDb();
  const queue = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'recruit_queue.json'), 'utf8'));
  console.log(`Collect: ${queue.length} queued partners, concurrency ${CONC}.`);
  const results = await pool(queue, CONC, collectOne);
  const built = results.filter(r => r.state === 'built');
  const exists = results.filter(r => r.state === 'exists');
  const pending = results.filter(r => r.state === 'pending');

  // Campaign file for everything that now has a page.
  const done = [...built, ...exists];
  const rows = ['company,contact_email,first_name,url'];
  for (const r of done) { const c = contact[(r.domain || '').replace(/^www\./, '').toLowerCase()] || {}; rows.push(`${JSON.stringify(r.name)},${c.email || ''},${(c.name || '').split(' ')[0]},${BASE_URL}/p/${r.slug}`); }
  fs.writeFileSync(path.join(ROOT, 'campaign.csv'), rows.join('\n') + '\n');

  console.log(`\nBUILT this run: ${built.length} | already had page: ${exists.length} | STILL DECOMPOSING: ${pending.length}`);
  console.log(`Total pages ready: ${done.length}/${queue.length}. campaign.csv updated.`);
  if (pending.length) console.log('Re-run this to sweep up the rest as TDE finishes.');
  process.exit(pending.length === 0 ? 42 : 0); // 42 = queue fully drained
})().catch(e => { console.error('ERR:', e.message); process.exit(1); });
