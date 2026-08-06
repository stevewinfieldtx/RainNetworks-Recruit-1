// pipeline.js — server-side generation, runs on Railway. Rain NEVER scrapes.
// Rain asks TDE's RECRUIT lens for a partner. TDE checks its cache; on a miss
// TDE does the scraping + recruit decomposition and caches the atoms, then
// returns them. Rain builds the page from those recruit atoms. TDE is the
// source of information; this app is a consumer + a renderer.
//
// Recruit lens (established earlier): template "recruit" / ChannelRevived,
// schema {entity_role, recruit_category, signal_type, confidence_tier}.

const { generatePageContent } = require('./llm');
const { renderPage } = require('./render');
const { renderSolution, SOLUTIONS } = require('./render_solution');
const { newSlug } = require('./slug');
const db = require('./db');

const TDE = (process.env.TDE_BASE_URL || '').replace(/\/$/, '');
const TKEY = process.env.TDE_API_KEY;
const TH = { 'x-api-key': TKEY, 'Content-Type': 'application/json' };
const PREFIX = (process.env.PAGE_PREFIX || '/p').replace(/\/$/, '');
const PUB = (process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '');
const MIN_ATOMS = 12;

const sleep = ms => new Promise(r => setTimeout(r, ms));
const slug = d => String(d).replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\.[a-z.]+$/i, '').replace(/[^a-z0-9]+/gi, '').toLowerCase();
async function tget(p) { const r = await fetch(TDE + p, { headers: TH }); return { status: r.status, body: await r.json().catch(() => ({})) }; }
async function tpost(p, b) { const r = await fetch(TDE + p, { method: 'POST', headers: TH, body: JSON.stringify(b) }); return { status: r.status, body: await r.json().catch(() => ({})) }; }

// Ask TDE (recruit lens) for a partner's atoms. Cache-first; TDE scrapes on miss.
async function tdeRecruitAtoms(domain, name) {
  if (!TDE || !TKEY) return { error: 'TDE not configured' };
  const clean = String(domain).replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '').toLowerCase();
  const id = 'partner_' + slug(clean);
  const url = 'https://' + clean;

  // 1. Cache check.
  let stats = await tget('/stats/' + id);
  let atomCount = (stats.body && stats.body.atomCount) || 0;

  // 2. Miss -> have TDE research it (TDE does the scraping + recruit decomposition, then caches).
  if (atomCount < MIN_ATOMS) {
    const exists = await tget('/collections/' + id);
    if (exists.status !== 200) await tpost('/collections', { id, name: name || clean, description: 'partner recruit lens', templateId: 'recruit', entity_role: 'partner' });
    await tpost('/ingest', { collectionId: id, type: 'web', input: url, opts: { title: name || clean } });
    const t0 = Date.now();
    while (Date.now() - t0 < 240000) {
      const { body } = await tget('/sources/' + id);
      const s = Array.isArray(body) ? body : [];
      if (s.length && s.every(x => x.status === 'ready' || x.status === 'error')) break;
      await sleep(6000);
    }
  }

  // 3. Read recruit atoms + summary.
  const atomsRes = await tget('/atoms/' + id);
  const atoms = Array.isArray(atomsRes.body) ? atomsRes.body : [];
  const meta = await tget(`/intelligence/${id}?type=recruit_meta`);
  const md = meta.body && meta.body.data ? (Array.isArray(meta.body.data) ? meta.body.data[0] : meta.body.data) : {};
  return { atoms, summary: (md && md.summary) || '' };
}

function enrichmentFromAtoms(summary, atoms) {
  const cat = c => atoms.filter(a => (a.dimensions && a.dimensions.recruit_category) === c).map(a => a.text);
  const geo = cat('where_they_operate');
  const location = (geo[0] || '').replace(/^.*?\b(operates? in|serves|based in|located in)\b/i, '').replace(/\.$/, '').trim();
  const facts = atoms.map(a => `- [${(a.dimensions && a.dimensions.recruit_category) || '?'}] ${a.text}`).join('\n');
  return { location: location || undefined, existing_alliances: cat('existing_alliances'),
    homepage_text: `PARTNER PROFILE (from Rain recruit research on TDE):\n${summary || ''}\n\nVERIFIED FACTS:\n${facts}` };
}

// Build one partner page from TDE recruit atoms and store it.
async function buildPartnerPage(p) {
  const company = (p.company || p.domain || '').trim();
  const domain = (p.domain || '').replace(/^https?:\/\//, '').replace(/\/$/, '').trim();
  if (!company || !domain) return { company, domain, status: 'skipped', reason: 'missing-domain' };

  const { atoms, summary, error } = await tdeRecruitAtoms(domain, company);
  if (error) return { company, domain, status: 'error', reason: error };
  if (!atoms || atoms.length < MIN_ATOMS) return { company, domain, status: 'revisit', reason: `thin-recruit (${atoms ? atoms.length : 0} atoms)` };

  const content = await generatePageContent(company, enrichmentFromAtoms(summary, atoms));
  content._recruit = true;
  const existing = await db.findByCompany(company);
  const s = existing ? existing.slug : newSlug();
  const html = renderPage(content, { slug: s, prefix: PREFIX, base_url: PUB });
  await db.savePage({ slug: s, company, domain, contact_name: p.contact_name || null,
    contact_email: p.contact_email || null, content, html, status: 'ready' });
  return { company, domain, status: 'built', slug: s, atoms: atoms.length, url: `${PUB}${PREFIX}/${s}` };
}

// ── Runware image -> data URI (inlined; solution pages only) ─────────────────
async function runwareImage(prompt, shape = 'wide') {
  const KEY = process.env.RUNWARE_API_KEY;
  if (!KEY) return null;
  const crypto = require('crypto');
  const sizes = { wide: [1344, 768], square: [1024, 1024], tall: [768, 1344] };
  const [width, height] = sizes[shape] || sizes.wide;
  const task = { taskType: 'imageInference', taskUUID: crypto.randomUUID(), positivePrompt: prompt,
    model: process.env.RUNWARE_MODEL || 'runware:100@1', width, height, numberResults: 1, outputFormat: 'WEBP' };
  try {
    const r = await fetch('https://api.runware.ai/v1', { method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + KEY },
      body: JSON.stringify([task]), signal: AbortSignal.timeout(90000) });
    const j = await r.json();
    const img = (j.data || []).find(d => d.imageURL);
    if (!img) return null;
    const bin = Buffer.from(await (await fetch(img.imageURL)).arrayBuffer());
    return 'data:image/webp;base64,' + bin.toString('base64');
  } catch { return null; }
}

async function buildSolutionPage(product) {
  const s = SOLUTIONS[product];
  if (!s) return { status: 'error', reason: 'unknown-product' };
  const heroImg = s.heroPrompt ? await runwareImage(s.heroPrompt, 'wide') : null;
  const html = renderSolution(product, { prefix: PREFIX, heroImg });
  const pageSlug = 'sol_' + product;
  await db.savePage({ slug: pageSlug, company: s.name + ' (solution)', domain: null, content: { _solution: product }, html, status: 'ready' });
  return { status: 'built', product, slug: pageSlug, url: `${PUB}${PREFIX}/s/${product}` };
}

module.exports = { tdeRecruitAtoms, buildPartnerPage, runwareImage, buildSolutionPage };
