#!/usr/bin/env node
// Re-render every built page from its stored content with the current
// PAGE_PREFIX (so form actions point at /RainNetworks/1/l/<slug>), and emit
// campaign.csv with the production URLs. No scrape, no AI. Single store write.
require('../env')();
const fs = require('fs');
const path = require('path');
const { renderPage } = require('../render');

const ROOT = path.join(__dirname, '..');
const PAGES_FILE = path.join(ROOT, 'data', 'pages.json');
const PREFIX = (process.env.PAGE_PREFIX || '/p').replace(/\/$/, '');
const PUB = (process.env.PUBLIC_BASE_URL || process.env.BASE_URL || '').replace(/\/$/, '');

const store = JSON.parse(fs.readFileSync(PAGES_FILE, 'utf8'));
const now = new Date().toISOString();
let n = 0;
const campaign = ['company,contact_email,first_name,url'];
for (const [slug, row] of Object.entries(store)) {
  if (!row || !row.content) continue;
  row.html = renderPage(row.content, { slug, prefix: PREFIX, base_url: PUB });
  row.updated_at = now;
  n++;
  const first = (row.contact_name || '').split(' ')[0] || '';
  campaign.push(`${JSON.stringify(row.company || '')},${row.contact_email || ''},${first},${PUB}${PREFIX}/${slug}`);
}
fs.writeFileSync(PAGES_FILE, JSON.stringify(store, null, 2));
fs.writeFileSync(path.join(ROOT, 'campaign.csv'), campaign.join('\n') + '\n');
console.log(`Re-rendered ${n} pages with prefix ${PREFIX}. campaign.csv -> ${PUB}${PREFIX}/<slug> (${campaign.length - 1} URLs).`);
