require('./env')();
const express = require('express');
const path = require('path');
const crypto = require('crypto');
const db = require('./db');
const pipeline = require('./pipeline');
const { renderNotFound, renderThanks } = require('./render');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ extended: false }));
app.set('trust proxy', true);

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
// Pages are served under this path (e.g. /RainNetworks/1). Client + campaign scoped.
const PREFIX = (process.env.PAGE_PREFIX || '/p').replace(/\/$/, '');

// 1x1 transparent GIF for email open tracking.
const PIXEL = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

// --- Health ----------------------------------------------------------------
app.get('/healthz', (req, res) => res.json({ ok: true, store: db.USE_PG ? 'postgres' : 'file' }));

// --- Personalized partner page ---------------------------------------------
app.get(`${PREFIX}/:slug`, async (req, res) => {
  const row = await db.getPage(req.params.slug);
  if (!row || !row.html) return res.status(404).send(renderNotFound());
  db.recordVisit(req.params.slug, 'page_view', req).catch(() => {}); // fire and forget
  res.set('Cache-Control', 'public, max-age=300');
  res.send(row.html);
});

// --- Email open pixel ------------------------------------------------------
app.get(`${PREFIX}/px/:slug([A-Za-z0-9_-]+).gif`, async (req, res) => {
  db.recordVisit(req.params.slug, 'open_pixel', req).catch(() => {});
  res.set('Content-Type', 'image/gif');
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.send(PIXEL);
});

// --- Lead capture (email required, phone optional) -------------------------
app.post(`${PREFIX}/l/:slug`, async (req, res) => {
  const slug = req.params.slug;
  const email = String(req.body.email || '').trim();
  const phone = String(req.body.phone || '').trim().slice(0, 40);
  const wantsJson = req.is('application/json') || (req.get('accept') || '').includes('application/json');

  if (!EMAIL_RE.test(email) || email.length > 254) {
    const msg = 'Please enter a valid email address.';
    return wantsJson
      ? res.status(400).json({ ok: false, error: msg })
      : res.status(400).send(renderThanks(null, { error: msg }));
  }

  const page = await db.getPage(slug);
  const company = page ? page.company : null;
  await db.saveLead(slug, email, phone || null, req).catch(err => console.error('lead save:', err.message));

  return wantsJson
    ? res.json({ ok: true, email, phone: phone || null })
    : res.send(renderThanks(company, { email, phone }));
});

// --- Optional CTA redirect (kept for any legacy /go links) ------------------
app.get(`${PREFIX}/go/:slug`, async (req, res) => {
  const row = await db.getPage(req.params.slug);
  db.recordVisit(req.params.slug, 'cta_click', req).catch(() => {});
  const url = (row && row.content && row.content.cta && row.content.cta.url)
    || process.env.DEFAULT_CTA_URL || 'https://rainnetworks.com/';
  res.redirect(302, url);
});

// --- Vendor solution page (server-generated, stored in Postgres) -----------
app.get(`${PREFIX}/s/:product`, async (req, res) => {
  const row = await db.getPage('sol_' + req.params.product);
  if (!row || !row.html) return res.status(404).send(renderNotFound());
  db.recordVisit('sol_' + req.params.product, 'page_view', req).catch(() => {});
  res.set('Cache-Control', 'public, max-age=300');
  res.send(row.html);
});

// --- Server-side generation (runs on Railway; keys from env, no local disk) --
const jobs = new Map();
function requireAdmin(req, res) {
  const key = process.env.RAINPARTNERS_ADMIN_KEY;
  if (!key || req.query.key !== key) { res.status(403).json({ error: 'forbidden' }); return false; }
  return true;
}

app.post('/admin/generate/partner', async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try { res.json(await pipeline.buildPartnerPage(req.body || {})); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/admin/generate/solution', async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try { res.json(await pipeline.buildSolutionPage(String((req.body && req.body.product) || '').toLowerCase())); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/admin/generate/batch', async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const partners = Array.isArray(req.body && req.body.partners) ? req.body.partners : [];
  if (!partners.length) return res.status(400).json({ error: 'body.partners[] required' });
  const conc = Math.min(Math.max(parseInt((req.body && req.body.concurrency) || 6, 10), 1), 10);
  const jobId = crypto.randomUUID().slice(0, 8);
  const job = { id: jobId, total: partners.length, done: 0, built: 0, revisit: 0, status: 'running', results: [] };
  jobs.set(jobId, job);
  res.json({ jobId, total: job.total, status: 'running', poll: `/admin/generate/status?key=YOURKEY&jobId=${jobId}` });
  (async () => {
    let i = 0;
    const worker = async () => {
      while (i < partners.length) {
        const p = partners[i++];
        try { const r = await pipeline.buildPartnerPage(p); job[r.status === 'built' ? 'built' : 'revisit']++; job.results.push(r); }
        catch (e) { job.revisit++; job.results.push({ company: p.company, status: 'error', reason: e.message }); }
        job.done++;
      }
    };
    await Promise.all(Array.from({ length: Math.min(conc, partners.length) }, worker));
    job.status = 'done';
  })().catch(e => { job.status = 'error'; job.error = e.message; });
});

// Re-render every stored page with the current template (no scrape, no LLM).
app.post('/admin/rerender', async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try { res.json(await pipeline.rerenderAll()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/admin/generate/status', (req, res) => {
  if (!requireAdmin(req, res)) return;
  const job = jobs.get(req.query.jobId);
  if (!job) return res.status(404).json({ error: 'unknown jobId' });
  const { results, ...summary } = job;
  res.json({ ...summary, revisit_list: results.filter(r => r.status !== 'built').map(r => r.domain || r.company) });
});

// --- Simple env-guarded reporting ------------------------------------------
app.get('/admin/stats', async (req, res) => {
  const key = process.env.RAINPARTNERS_ADMIN_KEY;
  if (!key || req.query.key !== key) return res.status(403).json({ error: 'forbidden' });
  try { res.json(await db.getStats()); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// Captured leads. Add &format=csv for a downloadable list for your outreach.
app.get('/admin/leads', async (req, res) => {
  const key = process.env.RAINPARTNERS_ADMIN_KEY;
  if (!key || req.query.key !== key) return res.status(403).json({ error: 'forbidden' });
  try {
    const leads = await db.getLeads();
    if (req.query.format === 'csv') {
      const esc = v => { const s = String(v == null ? '' : v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
      const lines = ['company,email,phone,created_at',
        ...leads.map(l => [l.company, l.email, l.phone, l.created_at].map(esc).join(','))];
      res.set('Content-Type', 'text/csv');
      res.set('Content-Disposition', 'attachment; filename="rain-leads.csv"');
      return res.send(lines.join('\n') + '\n');
    }
    res.json(leads);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- Generic root / static (registered last) -------------------------------
app.get('/', (req, res) => res.send(renderNotFound()));
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`rain-partners server on port ${PORT}`);
  db.initDb();
});
