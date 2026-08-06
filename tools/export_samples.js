#!/usr/bin/env node
// Export a few built pages as standalone HTML (assets inlined) so they can be
// viewed without the server. Picks fresh (_fast) pages, or names given as args.
require('../env')();
const fs = require('fs');
const path = require('path');
const { renderPage } = require('../render');

const ROOT = path.join(__dirname, '..');
const store = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'pages.json'), 'utf8'));
const dataUri = (f, m) => 'data:' + m + ';base64,' + fs.readFileSync(path.join(ROOT, 'public', f)).toString('base64');
const ASSETS = { logo: dataUri('rain-logo.png', 'image/png'), heroImg: dataUri('hero-threat.webp', 'image/webp'), boardImg: dataUri('backup-board.webp', 'image/webp') };
const fontData = { 400: dataUri('rain-font-400.woff2', 'font/woff2'), 600: dataUri('rain-font-600.woff2', 'font/woff2'), 800: dataUri('rain-font-800.woff2', 'font/woff2') };
const OUT = path.join(process.env.USERPROFILE, 'Desktop', 'Silk-and-Crown-Samples');

const wanted = process.argv.slice(2).map(s => s.toLowerCase());
let rows = Object.values(store).filter(r => r.content && r.content._fast);
if (wanted.length) rows = Object.values(store).filter(r => r.company && wanted.includes(r.company.toLowerCase()));
rows = rows.slice(0, wanted.length || 4);

const files = [];
for (const r of rows) {
  const html = renderPage(r.content, { slug: r.slug, prefix: process.env.PAGE_PREFIX || '/p', fontData, ...ASSETS });
  const file = 'Rain-Batch-' + (r.company || r.slug).replace(/[^a-z0-9]+/gi, '-').slice(0, 40) + '.html';
  fs.writeFileSync(path.join(OUT, file), html);
  files.push(file);
  console.log('wrote', file, '|', r.content.hero && r.content.hero.headline);
}
console.log(JSON.stringify(files));
