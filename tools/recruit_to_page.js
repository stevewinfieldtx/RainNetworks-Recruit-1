#!/usr/bin/env node
// Close the loop: pull a partner's recruit atoms + summary from TDE, turn them
// into page enrichment, generate the page copy (OpenRouter), render, and write
// a standalone sample. Proves recruit-intelligence -> personalized page.
//
// Usage: node tools/recruit_to_page.js partner_trutechnical "Tru Technical Partners" ...
require('../env')();
const fs = require('fs');
const path = require('path');
const { generatePageContent } = require('../llm');
const { renderPage } = require('../render');

const TDE = (process.env.TDE_BASE_URL || '').replace(/\/$/, '');
const H = { 'x-api-key': process.env.TDE_API_KEY };
const ROOT = path.join(__dirname, '..');
const dataUri = (f, m) => 'data:' + m + ';base64,' + fs.readFileSync(path.join(ROOT, 'public', f)).toString('base64');
const ASSETS = {
  logo: dataUri('rain-logo.png', 'image/png'),
  heroImg: dataUri('hero-threat.webp', 'image/webp'),
  boardImg: dataUri('backup-board.webp', 'image/webp'),
};
const OUT = path.join(process.env.USERPROFILE, 'Desktop', 'Silk-and-Crown-Samples');

async function jget(p) { const r = await fetch(TDE + p, { headers: H }); return r.json().catch(() => ({})); }

function enrichmentFromAtoms(summary, atoms) {
  const cat = c => atoms.filter(a => (a.dimensions && a.dimensions.recruit_category) === c).map(a => a.text);
  const geo = cat('where_they_operate');
  const location = (geo[0] || '').replace(/^.*?\b(operates? in|serves|based in|located in)\b/i, '').replace(/\.$/, '').trim();
  const facts = atoms.map(a => `- [${(a.dimensions && a.dimensions.recruit_category) || '?'}] ${a.text}`).join('\n');
  return {
    location: location || undefined,
    existing_alliances: cat('existing_alliances'),
    // Feed the clean recruit facts as the grounding text the page prompt reads.
    homepage_text: `PARTNER PROFILE (from Rain recruit research on TDE):\n${summary || ''}\n\nVERIFIED FACTS:\n${facts}`,
  };
}

async function run(slug, name) {
  const meta = await jget(`/intelligence/${slug}?type=recruit_meta`);
  const md = meta && meta.data ? (Array.isArray(meta.data) ? meta.data[0] : meta.data) : {};
  const summary = (md && md.summary) || '';
  const atoms = await jget('/atoms/' + slug);
  const list = Array.isArray(atoms) ? atoms : [];
  console.log(`${name}: summary ${summary ? 'yes' : 'no'}, atoms ${list.length}`);
  const enrichment = enrichmentFromAtoms(summary, list);
  const content = await generatePageContent(name, enrichment);
  const html = renderPage(content, { slug: 'demo', ...ASSETS });
  const file = 'Rain-Recruit-' + slug.replace(/^partner_/, '') + '.html';
  fs.writeFileSync(path.join(OUT, file), html);
  console.log('  hero:', content.hero && content.hero.headline);
  console.log('  wrote', file);
}

(async () => {
  const args = process.argv.slice(2);
  let targets = [];
  for (let i = 0; i < args.length; i += 2) targets.push({ slug: args[i], name: args[i + 1] || args[i] });
  if (!targets.length) targets = [
    { slug: 'partner_trutechnical', name: 'Tru Technical Partners' },
    { slug: 'partner_plummerslade', name: 'Plummer Slade' },
  ];
  for (const t of targets) await run(t.slug, t.name);
  console.log('DONE');
})().catch(e => { console.error('ERR:', e.message); process.exit(1); });
