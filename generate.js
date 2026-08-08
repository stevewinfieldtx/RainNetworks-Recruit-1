#!/usr/bin/env node
// Batch generator: CSV of partners -> (optional enrichment) -> page content ->
// HTML -> store with a unique slug -> emit campaign.csv for mail merge.
//
// Usage:
//   node generate.js partners.csv
//   node generate.js partners.csv --dry               # print, write nothing
//   node generate.js partners.csv --company "Acme IT"  # regenerate one (keeps slug)
//   node generate.js partners.csv --base-url https://partners.example.com
//
// Enrichment: if partners.enriched.json exists (produced in the authoring
// environment via web search / prospecting tools, keyed by lowercased company),
// its facts are merged in. Runs fully offline without it.

const fs = require('fs');
const path = require('path');
require('./env')();

const { generatePageContent, generateOutreachEmail } = require('./llm');
const { fetchSiteText } = require('./site');
const { renderPage } = require('./render');
const db = require('./db');

// --- tiny CSV parser (handles quoted fields and embedded commas) -----------
function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i], next = text[i + 1];
    if (inQ) {
      if (ch === '"' && next === '"') { field += '"'; i++; }
      else if (ch === '"') inQ = false;
      else field += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\r') { /* skip */ }
    else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else field += ch;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim() !== ''));
}

function rowsToObjects(rows) {
  if (!rows.length) return [];
  const header = rows[0].map(h => h.trim().toLowerCase());
  return rows.slice(1).map(r => {
    const o = {};
    header.forEach((h, i) => { o[h] = (r[i] || '').trim(); });
    return o;
  });
}

function loadJsonMap(name) {
  const f = path.join(__dirname, name);
  if (!fs.existsSync(f)) return {};
  try { return JSON.parse(fs.readFileSync(f, 'utf8')); }
  catch (e) { console.error(`generate: could not parse ${name}:`, e.message); return {}; }
}
const loadEnrichment = () => loadJsonMap('partners.enriched.json');
// Fully research-authored page content per company (keyed by lowercased name).
// When present for a company it is used verbatim, bypassing the LLM/static path.
const loadContent = () => loadJsonMap('partners.content.json');

function arg(flag) {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath || csvPath.startsWith('--')) {
    console.error('Usage: node generate.js <partners.csv> [--dry] [--company "Name"] [--base-url URL]');
    process.exit(1);
  }
  const dry = process.argv.includes('--dry');
  const onlyCompany = arg('--company');
  const baseUrl = (arg('--base-url') || process.env.BASE_URL || 'http://localhost:4000').replace(/\/$/, '');
  const noFetch = process.argv.includes('--no-fetch');
  const refresh = process.argv.includes('--refresh');
  const concurrency = Math.max(1, parseInt(arg('--concurrency') || '4', 10));
  const useLlm = !!(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_MODEL_ID);

  const text = fs.readFileSync(path.resolve(csvPath), 'utf8');
  let partners = rowsToObjects(parseCsv(text));
  if (onlyCompany) {
    const key = onlyCompany.trim().toLowerCase();
    partners = partners.filter(p => (p.company || '').trim().toLowerCase() === key);
    if (!partners.length) { console.error(`generate: "${onlyCompany}" not found in CSV.`); process.exit(1); }
  }

  const enrichAll = loadEnrichment();
  const contentAll = loadContent();
  await db.initDb();

  console.log(`Generating ${partners.length} page(s). Mode: ` +
    (useLlm ? `AI grounded${noFetch ? ' (no homepage fetch)' : ' + homepage research'}` : 'static copy (no OPENROUTER creds)') +
    `. Concurrency ${concurrency}.`);

  // Build one page for a partner. Returns a campaign row (or null).
  async function buildOne(p) {
    const company = p.company;
    if (!company) return null;
    const key = company.trim().toLowerCase();
    let content = contentAll[key];

    if (!content) {
      const enrichment = { ...(enrichAll[key] || {}) };
      // Ground AI copy in the partner's real homepage (skip when no LLM / --no-fetch).
      if (useLlm && !noFetch && p.domain) {
        try { enrichment.homepage_text = await fetchSiteText(p.domain, { refresh }); }
        catch (e) { /* fetch failures are non-fatal; fall back to facts only */ }
      }
      content = await generatePageContent(company, enrichment);
    }

    const first = (p.contact_name || '').split(' ')[0] || '';

    if (dry) {
      console.log(`\n===== ${company} =====`);
      console.log(JSON.stringify(content, null, 2));
      const previewUrl = `${baseUrl}/p/<slug>`;
      const email = await generateOutreachEmail(company, content, previewUrl, first);
      console.log(`\n----- outreach email -----\nSubject: ${email.subject}\n\n${email.body}`);
      return null;
    }

    const enrichment = enrichAll[key] || {};
    const existing = await db.findByCompany(company);
    let finalSlug = existing ? existing.slug : null;
    if (!finalSlug) {
      finalSlug = await db.insertNewPage({ company, domain: p.domain, contact_name: p.contact_name,
        contact_email: p.contact_email, enrichment, content, html: null, status: 'ready' });
    }
    const html = renderPage(content, { slug: finalSlug, base_url: baseUrl });
    await db.savePage({ slug: finalSlug, company, domain: p.domain, contact_name: p.contact_name,
      contact_email: p.contact_email, enrichment, content, html, status: 'ready' });

    const url = `${baseUrl}/p/${finalSlug}`;
    const email = await generateOutreachEmail(company, content, url, first);
    console.log(`ok  ${company}  ->  ${url}`);
    return `${csvField(company)},${csvField(p.contact_email || '')},${csvField(first)},${csvField(url)},${csvField(email.subject)},${csvField(email.body)}`;
  }

  const rows = await pMap(partners, concurrency, buildOne);

  if (!dry) {
    const campaign = ['company,contact_email,first_name,url,email_subject,email_body', ...rows.filter(Boolean)];
    fs.writeFileSync(path.join(__dirname, 'campaign.csv'), campaign.join('\n') + '\n');
    console.log(`\nWrote campaign.csv (${campaign.length - 1} partners). Base URL: ${baseUrl}`);
    console.log('Store:', db.USE_PG ? 'Postgres' : 'local ./data files');
  }
  process.exit(0);
}

// Bounded-concurrency map that preserves input order in the result array.
async function pMap(items, n, fn) {
  const res = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) { const idx = i++; res[idx] = await fn(items[idx], idx); }
  });
  await Promise.all(workers);
  return res;
}

function csvField(v) {
  const s = String(v == null ? '' : v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

main().catch(err => { console.error(err); process.exit(1); });
