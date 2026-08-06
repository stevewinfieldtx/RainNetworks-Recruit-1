#!/usr/bin/env node
// One-time migration: load the built pages from the local file store into
// Postgres (the shared TDE DB) so the deployed app serves from there. Run with
// DATABASE_URL set to the target Postgres. Idempotent (upsert by slug).
require('../env')();
const fs = require('fs');
const path = require('path');
const db = require('../db');

(async () => {
  if (!db.USE_PG) { console.error('DATABASE_URL is not set to Postgres. Aborting (would write to file store).'); process.exit(1); }
  await db.initDb();
  const store = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'pages.json'), 'utf8'));
  const rows = Object.values(store).filter(r => r.content && r.html);
  let n = 0;
  for (const r of rows) {
    await db.savePage({ slug: r.slug, company: r.company, domain: r.domain, contact_name: r.contact_name,
      contact_email: r.contact_email, enrichment: r.enrichment || null, content: r.content, html: r.html, status: r.status || 'ready' });
    if (++n % 50 === 0) console.log(`  ${n}/${rows.length}`);
  }
  const stats = await db.getStats();
  console.log(`Migrated ${n} pages. Postgres now reports ${stats.length} partner_pages rows.`);
  process.exit(0);
})().catch(e => { console.error('ERR:', e.message); process.exit(1); });
