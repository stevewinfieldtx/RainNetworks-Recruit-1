// pipeline.js — server-side generation. Runs wherever the app runs (Railway).
// Ingest (scrape via DRiX-Scrape) -> Create (OpenRouter copy, Runware images) ->
// render -> store in Postgres. Every key comes from process.env (Railway service
// variables). No local files, no local disk, no machine dependency.

const crypto = require('crypto');
const { generatePageContent } = require('./llm');
const { renderPage } = require('./render');
const { renderSolution, SOLUTIONS } = require('./render_solution');
const { newSlug } = require('./slug');
const db = require('./db');

const SCRAPE = (process.env.SCRAPE_URL || '').replace(/\/$/, '');
const SKEY = process.env.SCRAPE_API_KEY;
const PREFIX = (process.env.PAGE_PREFIX || '/p').replace(/\/$/, '');
const PUB = (process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '');

// ── Ingest: scrape a site via the DRiX-Scrape service (also on Railway) ──────
async function scrapeSite(domain, { stealth = false } = {}) {
  const url = 'https://' + String(domain).replace(/^https?:\/\//, '').replace(/\/$/, '').trim();
  if (SCRAPE && SKEY) {
    try {
      const r = await fetch(SCRAPE + '/scrape', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + SKEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, lite_only: !stealth }),
        signal: AbortSignal.timeout(stealth ? 60000 : 25000),
      });
      if (r.ok) { const j = await r.json(); if ((j.markdown || '').length > 300) return j.markdown; }
    } catch { /* fall through */ }
  }
  return '';
}

// ── Create: build one partner page end to end and store it ───────────────────
async function buildPartnerPage(p) {
  const company = (p.company || p.domain || '').trim();
  const domain = (p.domain || '').replace(/^https?:\/\//, '').replace(/\/$/, '').trim();
  if (!company || !domain) return { company, domain, status: 'skipped', reason: 'missing-domain' };

  const md = await scrapeSite(domain);
  if (!md || md.length < 400) return { company, domain, status: 'revisit', reason: 'thin-scrape' };

  const content = await generatePageContent(company, { homepage_text: md.slice(0, 16000) });
  content._fast = true;
  const existing = await db.findByCompany(company);
  const slug = existing ? existing.slug : newSlug();
  const html = renderPage(content, { slug, prefix: PREFIX, base_url: PUB });
  await db.savePage({ slug, company, domain, contact_name: p.contact_name || null,
    contact_email: p.contact_email || null, content, html, status: 'ready' });
  return { company, domain, status: 'built', slug, url: `${PUB}${PREFIX}/${slug}` };
}

// ── Create: Runware image -> data URI (inlined, no disk) ─────────────────────
async function runwareImage(prompt, shape = 'wide') {
  const KEY = process.env.RUNWARE_API_KEY;
  if (!KEY) return null;
  const sizes = { wide: [1344, 768], square: [1024, 1024], tall: [768, 1344] };
  const [width, height] = sizes[shape] || sizes.wide;
  const task = { taskType: 'imageInference', taskUUID: crypto.randomUUID(),
    positivePrompt: prompt, model: process.env.RUNWARE_MODEL || 'runware:100@1',
    width, height, numberResults: 1, outputFormat: 'WEBP' };
  try {
    const r = await fetch('https://api.runware.ai/v1', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + KEY },
      body: JSON.stringify([task]), signal: AbortSignal.timeout(90000),
    });
    const j = await r.json();
    const img = (j.data || []).find(d => d.imageURL);
    if (!img) return null;
    const bin = Buffer.from(await (await fetch(img.imageURL)).arrayBuffer());
    return 'data:image/webp;base64,' + bin.toString('base64');
  } catch { return null; }
}

// ── Create: a vendor solution page (Runware hero inlined) ─────────────────────
async function buildSolutionPage(product) {
  const s = SOLUTIONS[product];
  if (!s) return { status: 'error', reason: 'unknown-product' };
  let heroImg = null;
  if (s.heroPrompt) heroImg = await runwareImage(s.heroPrompt, 'wide');
  const html = renderSolution(product, { prefix: PREFIX, heroImg });
  const slug = 'sol_' + product;
  await db.savePage({ slug, company: s.name + ' (solution)', domain: null,
    content: { _solution: product }, html, status: 'ready' });
  return { status: 'built', product, slug, url: `${PUB}${PREFIX}/s/${product}` };
}

module.exports = { scrapeSite, buildPartnerPage, runwareImage, buildSolutionPage };
