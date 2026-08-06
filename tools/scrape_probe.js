#!/usr/bin/env node
// Verify DRiX-Scrape is up and the key works. Tests a JS-heavy site to confirm
// stealth escalation returns real content.
require('../env')();
const base = (process.env.SCRAPE_URL || '').replace(/\/$/, '');
const key = process.env.SCRAPE_API_KEY;

async function scrape(url, stealth = false) {
  const r = await fetch(base + '/scrape', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, stealth }),
  });
  return { status: r.status, body: await r.json().catch(() => ({})) };
}

(async () => {
  const h = await fetch(base + '/health');
  console.log('health:', h.status, (await h.text()).slice(0, 80));
  for (const u of (process.argv.slice(2).length ? process.argv.slice(2) : ['https://schillingit.com', 'https://trutechnical.com'])) {
    const { status, body } = await scrape(u);
    console.log(`\n${u} -> HTTP ${status} | mode:${body.mode || '-'} | chars:${(body.markdown || '').length}`);
    console.log('title:', body.title || '(none)');
    console.log('preview:', (body.markdown || body.detail || '').slice(0, 260).replace(/\s+/g, ' '));
  }
})().catch(e => { console.error('ERR:', e.message); process.exit(1); });
