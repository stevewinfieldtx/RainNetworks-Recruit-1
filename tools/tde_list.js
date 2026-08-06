#!/usr/bin/env node
// READ-ONLY: list TDE collections + templates, highlight anything relevant to
// Rain / the three products / our partners, so we don't create duplicates.
require('../env')();
const base = (process.env.TDE_BASE_URL || '').replace(/\/$/, '');
const key = process.env.TDE_API_KEY;
const H = { 'x-api-key': key };

(async () => {
  const cols = await (await fetch(base + '/collections', { headers: H })).json();
  const list = Array.isArray(cols) ? cols : [];
  console.log('total collections:', list.length);
  const rx = /rain|guardz|macrium|ninjio|\bmsp\b|trutechnical|plummer|atlanta|recruit|channel|partner|vendor/i;
  const meta = c => (typeof c.metadata === 'string' ? JSON.parse(c.metadata || '{}') : (c.metadata || {}));
  const rel = list.filter(c => rx.test(`${c.id} ${c.name} ${JSON.stringify(meta(c))}`));
  console.log('relevant collections:', rel.length);
  for (const c of rel) {
    const m = meta(c);
    const tmpl = m.templateId || (m.template && m.template.id) || '?';
    console.log(`  - ${c.id} | "${c.name}" | tmpl:${tmpl} | role:${m.entity_role || '-'} | atoms:${(c.stats && c.stats.atomCount) ?? '?'}`);
  }
  const tmpl = await (await fetch(base + '/templates', { headers: H })).json();
  console.log('templates:', (Array.isArray(tmpl) ? tmpl : []).map(t => t.id).join(', '));
})().catch(e => { console.error('ERR:', e.message); process.exit(1); });
