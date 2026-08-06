#!/usr/bin/env node
// Poll DRiX until the new lite_only behavior is live: a missing path with
// lite_only:true should return FAST (no stealth). Detect by response time.
require('../env')();
const SCRAPE = (process.env.SCRAPE_URL || '').replace(/\/$/, '');
const SKEY = process.env.SCRAPE_API_KEY;
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function probe() {
  const t = Date.now(); const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 14000);
  try {
    const r = await fetch(SCRAPE + '/scrape', { method: 'POST', headers: { 'Authorization': 'Bearer ' + SKEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ url: 'https://example.com/__no_such_' + Date.now(), lite_only: true }), signal: ctrl.signal });
    return { status: r.status, secs: (Date.now() - t) / 1000 };
  } catch { return { status: 'timeout', secs: (Date.now() - t) / 1000 }; }
  finally { clearTimeout(to); }
}

(async () => {
  const start = Date.now();
  while (Date.now() - start < 420000) {
    const p = await probe();
    const live = p.status !== 'timeout' && p.secs < 9; // fast miss = stealth was skipped = new version
    console.log(`probe: HTTP ${p.status} in ${p.secs.toFixed(1)}s ${live ? '<-- LITE_ONLY LIVE' : '(old still deployed / rebuilding)'}`);
    if (live) { console.log('READY'); process.exit(0); }
    await sleep(15000);
  }
  console.log('TIMED OUT waiting for redeploy'); process.exit(1);
})();
