#!/usr/bin/env node
// Preview the AUTOMATED (homepage-fetch + AI) copy for a few partners without
// touching the store or the hand-authored partners.content.json overrides.
// Renders standalone HTML (images inlined) to the Desktop samples folder.
//
// Usage: node tools/ai_preview.js
require('../env')();
const fs = require('fs');
const path = require('path');
const { generatePageContent } = require('../llm');
const { fetchSiteText } = require('../site');
const { renderPage } = require('../render');

const ROOT = path.join(__dirname, '..');
const enriched = JSON.parse(fs.readFileSync(path.join(ROOT, 'partners.enriched.json'), 'utf8'));
const dataUri = (f, m) => 'data:' + m + ';base64,' + fs.readFileSync(path.join(ROOT, 'public', f)).toString('base64');
const assets = {
  logo: dataUri('rain-logo.png', 'image/png'),
  heroImg: dataUri('hero-threat.webp', 'image/webp'),
  boardImg: dataUri('backup-board.webp', 'image/webp')
};
const outDir = path.join(process.env.USERPROFILE, 'Desktop', 'Silk-and-Crown-Samples');

const targets = [
  { company: 'Tru Technical Partners', domain: 'trutechnical.com', file: 'Rain-AI-1-TruTechnical.html' },
  { company: 'Plummer Slade, Inc.', domain: 'plummerslade.com', file: 'Rain-AI-2-PlummerSlade.html' },
  { company: 'Atlanta I.T. Service', domain: 'atlantaitservice.com', file: 'Rain-AI-3-AtlantaITService.html' }
];

(async () => {
  if (!process.env.OPENROUTER_API_KEY || !process.env.OPENROUTER_MODEL_ID) {
    console.error('No OPENROUTER creds in .env; cannot run AI preview.'); process.exit(1);
  }
  console.log('Model:', process.env.OPENROUTER_MODEL_ID, '\n');
  for (const t of targets) {
    const facts = { ...(enriched[t.company.toLowerCase()] || {}) };
    process.stdout.write(`Fetching ${t.domain} ... `);
    facts.homepage_text = await fetchSiteText(t.domain, { refresh: true });
    console.log(`${facts.homepage_text ? facts.homepage_text.length + ' chars' : 'no text'}; generating...`);
    const content = await generatePageContent(t.company, facts);
    const html = renderPage(content, { slug: 'demo', ...assets });
    fs.writeFileSync(path.join(outDir, t.file), html);
    console.log(`\n===== ${t.company} =====`);
    console.log('HERO:', content.hero && content.hero.headline);
    console.log('SUB :', content.hero && content.hero.subhead);
    (content.defense_in_depth && content.defense_in_depth.products || []).forEach(p =>
      console.log(`  ${p.name}: ${p.for_you}`));
    console.log('CTA :', content.cta && content.cta.headline, '/', content.cta && content.cta.subhead);
    console.log('wrote ->', t.file, '\n');
  }
  console.log('Done.');
})().catch(e => { console.error(e); process.exit(1); });
