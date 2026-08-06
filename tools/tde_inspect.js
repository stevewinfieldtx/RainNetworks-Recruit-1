#!/usr/bin/env node
// READ-ONLY inspection of the TDE Postgres. Connection string is passed via
// the TDE_DB env var (never hardcoded, never committed). No writes.
const { Client } = require('pg');

async function connect(url) {
  for (const ssl of [false, { rejectUnauthorized: false }]) {
    try {
      const c = new Client({ connectionString: url, ssl, connectionTimeoutMillis: 9000 });
      await c.connect();
      return c;
    } catch (e) {
      if (/ssl|SSL/.test(e.message) && ssl === false) continue;
      throw e;
    }
  }
}

(async () => {
  const url = process.env.TDE_DB;
  if (!url) { console.error('Set TDE_DB'); process.exit(1); }
  const c = await connect(url);
  const t = await c.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY 1");
  console.log('TABLES (' + t.rows.length + '):', t.rows.map(r => r.table_name).join(', '));
  for (const tbl of ['company_intel', 'industry_intel', 'run_cache', 'collections', 'sources', 'atoms']) {
    try { const r = await c.query(`SELECT count(*)::int n FROM ${tbl}`); console.log(`  ${tbl}: ${r.rows[0].n} rows`); }
    catch { console.log(`  ${tbl}: (not present)`); }
  }
  try {
    const s = await c.query(
      'SELECT domain, company_name, industry, updated_at FROM company_intel ORDER BY updated_at DESC LIMIT 6');
    if (s.rows.length) { console.log('recent company_intel:'); s.rows.forEach(r => console.log('  ', r.domain, '|', r.company_name, '|', r.industry || '(no industry)')); }
  } catch {}
  try {
    const i = await c.query('SELECT industry_key, company_count FROM industry_intel ORDER BY company_count DESC LIMIT 6');
    if (i.rows.length) { console.log('top industry_intel:'); i.rows.forEach(r => console.log('  ', r.industry_key, '|', r.company_count)); }
  } catch {}
  await c.end();
})().catch(e => { console.error('ERR:', e.message); process.exit(1); });
