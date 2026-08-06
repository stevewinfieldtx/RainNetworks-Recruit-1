#!/usr/bin/env node
// Stand up the Rain recruit graph in TDE (clean namespace) and read back the
// partner recruit atoms. Idempotent: skips collection creation if it exists.
// Writes to production TDE (create collections + ingest). Read-then-print.
require('../env')();
const base = (process.env.TDE_BASE_URL || '').replace(/\/$/, '');
const key = process.env.TDE_API_KEY;
const H = { 'x-api-key': key, 'Content-Type': 'application/json' };

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function jget(p) { const r = await fetch(base + p, { headers: H }); return { status: r.status, body: await r.json().catch(() => ({})) }; }
async function jpost(p, body) { const r = await fetch(base + p, { method: 'POST', headers: H, body: JSON.stringify(body) }); return { status: r.status, body: await r.json().catch(() => ({})) }; }

const VENDOR = { id: 'rain_vendor', name: 'Rain Networks', url: 'https://rainnetworks.com', role: 'vendor' };
const PRODUCTS = [
  { id: 'prod_guardz', name: 'Guardz', url: 'https://guardz.com', role: 'product' },
  { id: 'prod_macrium', name: 'Macrium', url: 'https://www.macrium.com', role: 'product' },
  { id: 'prod_ninjio', name: 'NINJIO', url: 'https://ninjio.com', role: 'product' },
];
const PARTNERS = [
  { id: 'partner_trutechnical', name: 'Tru Technical Partners', url: 'https://trutechnical.com', role: 'partner' },
  { id: 'partner_plummerslade', name: 'Plummer Slade', url: 'https://plummerslade.com', role: 'partner' },
];
const ALL = [VENDOR, ...PRODUCTS, ...PARTNERS];

async function ensureAndIngest(e) {
  const exists = await jget('/collections/' + e.id);
  if (exists.status !== 200) {
    const c = await jpost('/collections', { id: e.id, name: e.name, description: `${e.role} lens`, templateId: 'recruit', entity_role: e.role });
    console.log(`create ${e.id} (${e.role}) -> HTTP ${c.status}${c.body.error ? ' ' + c.body.error : ''}`);
  } else {
    console.log(`exists ${e.id} (${e.role})`);
  }
  const ing = await jpost('/ingest', { collectionId: e.id, type: 'web', input: e.url, opts: { title: e.name } });
  console.log(`ingest ${e.id} <- ${e.url} -> HTTP ${ing.status} ${ing.body.status || ''}`);
}

async function pollReady(e, timeoutMs = 300000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const { body } = await jget('/sources/' + e.id);
    const sources = Array.isArray(body) ? body : [];
    const s = sources.find(x => (x.source_url || '').includes(e.url.replace(/^https?:\/\//, '').replace(/\/$/, ''))) || sources[sources.length - 1];
    if (s && s.status === 'ready') return { status: 'ready' };
    if (s && s.status === 'error') return { status: 'error', error: (typeof s.metadata === 'string' ? s.metadata : JSON.stringify(s.metadata || {})).slice(0, 200) };
    await sleep(6000);
  }
  return { status: 'timeout' };
}

async function showPartner(e) {
  console.log(`\n========== ${e.name} (${e.id}) ==========`);
  const meta = await jget(`/intelligence/${e.id}?type=recruit_meta`);
  const summary = meta.body && meta.body.data && (Array.isArray(meta.body.data) ? meta.body.data[0] : meta.body.data);
  if (summary && summary.summary) console.log('SUMMARY:', summary.summary);
  const atomsRes = await jget('/atoms/' + e.id);
  const atoms = Array.isArray(atomsRes.body) ? atomsRes.body : [];
  console.log(`ATOMS: ${atoms.length}`);
  const byCat = {};
  for (const a of atoms) { const c = (a.dimensions && a.dimensions.recruit_category) || '?'; byCat[c] = (byCat[c] || 0) + 1; }
  console.log('by category:', JSON.stringify(byCat));
  // Show the recruit-critical atoms first
  const priority = ['existing_alliances', 'risk_or_conflict', 'technical_capability', 'who_they_serve', 'where_they_operate', 'readiness_timing'];
  const pick = atoms.filter(a => priority.includes(a.dimensions && a.dimensions.recruit_category)).slice(0, 10);
  const rest = atoms.filter(a => !pick.includes(a)).slice(0, 4);
  for (const a of [...pick, ...rest]) {
    const d = a.dimensions || {};
    console.log(`  [${d.recruit_category}/${d.signal_type}/${d.confidence_tier}] ${a.text}`);
  }
}

(async () => {
  console.log('== create + ingest ==');
  for (const e of ALL) await ensureAndIngest(e);
  console.log('\n== polling until ready ==');
  for (const e of ALL) {
    const r = await pollReady(e);
    console.log(`${e.id}: ${r.status}${r.error ? ' :: ' + r.error : ''}`);
  }
  for (const e of PARTNERS) await showPartner(e);
  console.log('\nDONE');
})().catch(e => { console.error('ERR:', e.message); process.exit(1); });
