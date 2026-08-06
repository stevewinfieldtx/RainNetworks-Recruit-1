#!/usr/bin/env node
// Recruit ingest pipeline (v2 — link discovery, no blind path-guessing).
//
// Per partner: scrape the homepage once via DRiX-Scrape (lite, auto-escalates
// to stealth only if the homepage itself is JS-heavy), read the REAL internal
// links out of it, fetch only the about/services/partners pages that actually
// exist (in parallel, lite), feed the combined markdown into TDE's recruit
// lens, read atoms back, and classify COMPLETE vs LIGHT (revisit).
//
// Usage: node tools/recruit_ingest.js                 (built-in demo set)
//        node tools/recruit_ingest.js acme.com "Acme MSP" ...
require('../env')();

const TDE = (process.env.TDE_BASE_URL || '').replace(/\/$/, '');
const TKEY = process.env.TDE_API_KEY;
const SCRAPE = (process.env.SCRAPE_URL || '').replace(/\/$/, '');
const SKEY = process.env.SCRAPE_API_KEY;
const TH = { 'x-api-key': TKEY, 'Content-Type': 'application/json' };

const PER_SCRAPE_TIMEOUT = 45000;  // matches DRiX's internal stealth cap; bounds any one page
const MAX_SUBPAGES = 4;            // beyond the homepage (one per section category)
const PER_PAGE_CAP = 6000;
const TOTAL_CAP = 20000;
const DRY = process.argv.includes('--discover');  // scrape + discover only, skip TDE ingest
const LIGHT_TOTAL_CHARS = 1500;
const MIN_ATOMS = 18;
const POLL_MS = 330000;   // TDE's recruit munge can take 3-4 min; wait it out

// Real section pages carry the recruit signals; blog slugs do not. We match a
// link's FIRST path segment against this list, which cleanly excludes articles.
const SECTIONS = {
  partners: 1, partner: 1, partnerships: 1, vendors: 1, vendor: 1, alliances: 1,
  about: 2, 'about-us': 2, company: 2, 'who-we-are': 2, team: 2,
  services: 3, service: 3, 'managed-services': 3, 'managed-it': 3, 'managed-it-services': 3,
  'it-services': 3, solutions: 3, solution: 3, msp: 3,
  security: 4, cybersecurity: 4, 'cyber-security': 4, backup: 4, compliance: 4,
  industries: 5, industry: 5, verticals: 5,
};
// Canonical section paths probed directly (lite-only) in case the homepage does
// not link them (e.g. a /partners page reachable only via a JS menu).
const CANONICAL = ['/partners', '/partnerships', '/vendors', '/about', '/about-us',
  '/services', '/managed-services', '/it-services', '/solutions', '/industries', '/security'];

const sleep = ms => new Promise(r => setTimeout(r, ms));
const slug = d => d.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\.[a-z]+$/i, '').replace(/[^a-z0-9]+/gi, '').toLowerCase();

async function tget(p) { const r = await fetch(TDE + p, { headers: TH }); return { status: r.status, body: await r.json().catch(() => ({})) }; }
async function tpost(p, b) { const r = await fetch(TDE + p, { method: 'POST', headers: TH, body: JSON.stringify(b) }); return { status: r.status, body: await r.json().catch(() => ({})) }; }
async function tdel(p) { const r = await fetch(TDE + p, { method: 'DELETE', headers: TH }); return r.status; }

async function scrapePage(url, liteOnly = false) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), liteOnly ? 20000 : PER_SCRAPE_TIMEOUT);
  try {
    const r = await fetch(SCRAPE + '/scrape', {
      method: 'POST', headers: { 'Authorization': 'Bearer ' + SKEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, lite_only: liteOnly }), signal: ctrl.signal,
    });
    const j = await r.json().catch(() => ({}));
    return { ok: r.status === 200, status: r.status, mode: j.mode || null, title: j.title || null, markdown: j.markdown || '' };
  } catch (e) { return { ok: false, status: e.name === 'AbortError' ? 'timeout' : 'error', markdown: '' }; }
  finally { clearTimeout(t); }
}

// Pull real internal links from homepage markdown. Same registrable host
// (www-insensitive), and keep only links whose FIRST path segment is a real
// section page (about/services/partners/...), which excludes blog articles.
const canonHost = u => u.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '').toLowerCase();
function discoverLinks(markdown, base) {
  const host = canonHost(base);
  // Pull URLs from markdown links, href attributes, and bare URLs, so nav that
  // survives in any of those forms is captured.
  const urls = new Set();
  for (const rx of [/\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)/g, /href=["'](https?:\/\/[^"']+|\/[^"']+)["']/g, /(https?:\/\/[^\s)"'<>]+)/g]) {
    let m; while ((m = rx.exec(markdown))) urls.add(m[1]);
  }
  // Keep at most ONE page per section category (the shortest, most canonical),
  // so we diversify across partners + about + services + security instead of
  // grabbing three subpages of the same section.
  const byRank = new Map();
  for (let raw of urls) {
    let u = raw.split('#')[0].split('?')[0];
    if (u.startsWith('/')) u = base + u;
    if (!/^https?:\/\//.test(u)) continue;
    if (canonHost(u) !== host) continue;
    const path = u.replace(/^https?:\/\/[^/]+/, '').toLowerCase().replace(/\/$/, '');
    const first = path.split('/').filter(Boolean)[0];
    if (!first || !(first in SECTIONS)) continue;
    const rank = SECTIONS[first];
    const cur = byRank.get(rank);
    if (!cur || path.length < cur.path.length) byRank.set(rank, { url: u, path, rank });
  }
  return [...byRank.values()].sort((a, b) => a.rank - b.rank).slice(0, MAX_SUBPAGES);
}

async function pollReady(id) {
  const t0 = Date.now();
  while (Date.now() - t0 < POLL_MS) {
    const { body } = await tget('/sources/' + id);
    const s = Array.isArray(body) ? body : [];
    if (s.length && s.every(x => x.status === 'ready' || x.status === 'error')) return s.some(x => x.status === 'ready') ? 'ready' : 'error';
    await sleep(4000);
  }
  return 'timeout';
}

async function runPartner(domain, name) {
  const id = 'partner_' + slug(domain);
  const base = 'https://' + domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const t0 = Date.now();
  console.log(`\n########## ${name} (${domain}) -> ${id} ##########`);

  // 1. Homepage.
  const home = await scrapePage(base + '/');
  if (!home.ok || home.markdown.length < 200) {
    console.log(`  home -> ${home.status}/${home.mode || '-'} (thin) :: LIGHT (revisit with stealth)`);
    return { id, name, domain, status: 'light', reason: 'home-thin', atoms: 0, secs: ((Date.now() - t0) / 1000).toFixed(0) };
  }
  console.log(`  home -> ${home.mode} ${home.markdown.length}c`);

  // 2. Candidate subpages = links found on the homepage + canonical section
  // paths. Probe each LITE-ONLY (fast; missing paths miss instantly, no stealth),
  // then keep one page per section category (partners > about > services > ...).
  const discovered = discoverLinks(home.markdown, base).map(l => l.path);
  const candidates = [...new Set([...discovered, ...CANONICAL])].filter(p => p && p !== '/');
  const probed = await Promise.all(candidates.map(async p => ({ p, r: await scrapePage(base + p, true) })));
  const byRank = new Map();
  for (const { p, r } of probed) {
    if (!(r.ok && r.markdown.length > 200)) continue;
    const first = p.toLowerCase().split('/').filter(Boolean)[0];
    const rank = (first in SECTIONS) ? SECTIONS[first] : 6;
    const cur = byRank.get(rank);
    if (!cur || p.length < cur.p.length) byRank.set(rank, { p, md: r.markdown, rank });
  }
  const chosen = [...byRank.values()].sort((a, b) => a.rank - b.rank).slice(0, MAX_SUBPAGES);
  const pages = [{ path: '/', md: home.markdown.slice(0, PER_PAGE_CAP) },
    ...chosen.map(c => ({ path: c.p, md: c.md.slice(0, PER_PAGE_CAP) }))];
  const usedStealth = home.mode === 'stealth';
  console.log('  subpages:', chosen.map(c => c.p).join(', ') || '(none)');

  const combined = pages.map(p => `# PAGE ${p.path}\n${p.md}`).join('\n\n').slice(0, TOTAL_CAP);

  if (DRY) {
    console.log(`  [discover-only] ${pages.length} pages (${combined.length}c): ${pages.map(p => p.path).join(', ')}`);
    return { id, name, domain, status: 'dry', atoms: 0 };
  }

  // 3. Clean rebuild + ingest as text into the recruit lens.
  await tdel('/collections/' + id);
  await tpost('/collections', { id, name, description: 'partner lens', templateId: 'recruit', entity_role: 'partner' });
  const ing = await tpost('/ingest', { collectionId: id, type: 'text', input: combined, opts: { title: name + ' (recruit crawl)' } });
  console.log(`  ingest -> HTTP ${ing.status} (${combined.length}c, ${pages.length} pages)`);
  const ready = await pollReady(id);

  // 4. Read atoms (regardless of poll result) + classify.
  const atomsRes = await tget('/atoms/' + id);
  const atoms = Array.isArray(atomsRes.body) ? atomsRes.body : [];
  const byCat = {};
  for (const a of atoms) { const c = (a.dimensions && a.dimensions.recruit_category) || '?'; byCat[c] = (byCat[c] || 0) + 1; }
  const keySignals = (byCat.existing_alliances || 0) + (byCat.risk_or_conflict || 0) + (byCat.readiness_timing || 0);
  const secs = ((Date.now() - t0) / 1000).toFixed(0);
  console.log(`  decompose:${ready} | ATOMS:${atoms.length} keySignals:${keySignals} | ${secs}s`);
  for (const a of atoms.filter(a => ['existing_alliances', 'risk_or_conflict', 'readiness_timing'].includes(a.dimensions && a.dimensions.recruit_category)).slice(0, 6))
    console.log(`   * [${a.dimensions.recruit_category}] ${a.text}`);
  const light = combined.length < LIGHT_TOTAL_CHARS || atoms.length < MIN_ATOMS;
  console.log(`  RESULT: ${light ? 'LIGHT (revisit)' : 'COMPLETE'}`);
  return { id, name, domain, status: light ? 'light' : 'complete', atoms: atoms.length, keySignals, usedStealth, secs };
}

(async () => {
  const args = process.argv.slice(2).filter(a => a !== '--discover');
  let partners = [];
  for (let i = 0; i < args.length; i += 2) partners.push({ domain: args[i], name: args[i + 1] || args[i] });
  if (!partners.length) partners = [
    { domain: 'trutechnical.com', name: 'Tru Technical Partners' },
    { domain: 'plummerslade.com', name: 'Plummer Slade' },
    { domain: 'schillingit.com', name: 'Schilling IT' },
  ];
  const T0 = Date.now();
  const results = [];
  for (const p of partners) results.push(await runPartner(p.domain, p.name));
  console.log('\n================= SUMMARY =================');
  for (const r of results) console.log(`${r.status === 'complete' ? '[OK]  ' : '[LIGHT]'} ${r.name}: ${r.atoms} atoms, key-signals ${r.keySignals || 0}, ${r.secs}s${r.usedStealth ? ', stealth' : ''}`);
  const revisit = results.filter(r => r.status === 'light').map(r => r.domain);
  console.log(revisit.length ? '\nREVISIT: ' + revisit.join(', ') : '\nAll complete.');
  console.log(`TOTAL ${((Date.now() - T0) / 1000).toFixed(0)}s`);
})().catch(e => { console.error('ERR:', e.message); process.exit(1); });
