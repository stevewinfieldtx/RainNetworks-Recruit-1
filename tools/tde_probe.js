#!/usr/bin/env node
// READ-ONLY probe of TDE's HTTP API to validate the key and see the intel shape.
// GET /intel/company/:domain does NOT trigger research or write anything.
require('../env')();
const base = (process.env.TDE_BASE_URL || '').replace(/\/$/, '');
const key = process.env.TDE_API_KEY;
const domains = process.argv.slice(2);
if (!domains.length) domains.push('trutechnical.com', 'keeyu.com');

(async () => {
  for (const d of domains) {
    const r = await fetch(`${base}/intel/company/${encodeURIComponent(d)}`, { headers: { 'x-api-key': key } });
    const j = await r.json().catch(() => ({}));
    console.log(`\n=== ${d} (HTTP ${r.status}) ===`);
    if (j.found) {
      console.log('company:', j.company_name, '| industry:', j.industry || '(none)');
      console.log('freshness:', JSON.stringify(j.freshness && j.freshness.stale_sections ? { all_fresh: j.freshness.all_fresh, stale: j.freshness.stale_sections } : j.freshness));
      console.log('sections present:', Object.keys(j.sections || {}).join(', '));
    } else {
      console.log(JSON.stringify(j).slice(0, 300));
    }
  }
})().catch(e => { console.error('ERR:', e.message); process.exit(1); });
