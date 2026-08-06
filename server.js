require('./env')();
const express = require('express');
const path = require('path');
const crypto = require('crypto');
const db = require('./db');
const pipeline = require('./pipeline');
const { renderNotFound, renderThanks } = require('./render');
const { renderHome } = require('./render_home');
const { SOLUTIONS } = require('./render_solution');
const { newSlug } = require('./slug');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ extended: false }));
app.set('trust proxy', true);

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
// Pages are served under this path (e.g. /RainNetworks/1). Client + campaign scoped.
const PREFIX = (process.env.PAGE_PREFIX || '/p').replace(/\/$/, '');

// --- WhatsCoolAbout self-serve: domain validation + abuse caps ---------------
const DOMAIN_RE = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/;
function normalizeDomain(raw) {
  let d = String(raw || '').trim().toLowerCase()
    .replace(/^https?:\/\//, '').replace(/^www\./, '')
    .replace(/[\/?#].*$/, '').replace(/:\d+$/, '');
  if (!d || d.length > 253 || !DOMAIN_RE.test(d)) return null;
  if (/^(localhost|.*\.local)$/.test(d) || /^\d+\.\d+\.\d+\.\d+$/.test(d)) return null;
  return d;
}
const clientIp = req => String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
const wcaHits = new Map();      // ip -> [timestamps]; generation triggers paid work
const wcaInflight = new Map();  // `${domain}|${product}` -> jobId
const WCA_LIMIT = 5, WCA_WINDOW = 3600e3, WCA_MAX_RUNNING = 4;

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

// --- WhatsCoolAbout self-serve generation (public, capped) ------------------

// Visitor-generated page: whatscoolabout.com/<product>/1/<slug>. Product is
// allowlisted at the router level to the known solution keys.
app.get(`/:product(${Object.keys(SOLUTIONS).join('|')})/1/:slug`, async (req, res) => {
  const row = await db.getPage(req.params.slug);
  if (!row || !row.html || !(row.content && row.content._wca)) return res.status(404).send(renderNotFound());
  db.recordVisit(req.params.slug, 'page_view', req).catch(() => {});
  res.set('Cache-Control', 'public, max-age=300');
  res.send(row.html);
});

app.post('/wca/generate', async (req, res) => {
  const product = String((req.body && req.body.product) || '').toLowerCase();
  if (!SOLUTIONS[product]) return res.status(400).json({ error: 'Pick one of the covered solutions.' });
  const domain = normalizeDomain(req.body && req.body.domain);
  if (!domain) return res.status(400).json({ error: 'That does not look like a website address. Try something like yourcompany.com.' });

  // Repeat interest: same page, instantly. Still log the signal.
  const existing = await db.findWcaPage(domain, product).catch(() => null);
  if (existing) {
    db.saveWcaRequest({ domain, product, slug: existing.slug, req }).catch(() => {});
    return res.json({ url: `/${product}/1/${existing.slug}`, cached: true });
  }

  // Concurrent duplicate submits share one job.
  const key = `${domain}|${product}`;
  if (wcaInflight.has(key)) return res.json({ jobId: wcaInflight.get(key) });

  // Per-IP and global caps: this endpoint triggers paid research + LLM work.
  const ip = clientIp(req);
  const now = Date.now();
  const hits = (wcaHits.get(ip) || []).filter(t => now - t < WCA_WINDOW);
  if (hits.length >= WCA_LIMIT) return res.status(429).json({ error: 'rate' });
  hits.push(now); wcaHits.set(ip, hits);
  const running = [...jobs.values()].filter(j => j.wca && j.status === 'running').length;
  if (running >= WCA_MAX_RUNNING) return res.status(429).json({ error: 'busy' });

  const pageSlug = newSlug();
  const jobId = crypto.randomUUID().slice(0, 8);
  const job = { id: jobId, wca: true, status: 'running', phase: 'research', url: null, slug: pageSlug, product, error: null };
  jobs.set(jobId, job);
  wcaInflight.set(key, jobId);
  db.saveWcaRequest({ domain, product, slug: pageSlug, req }).catch(() => {});
  res.json({ jobId });

  (async () => {
    const r = await pipeline.buildWcaPage({ product, domain, slug: pageSlug,
      email: job.email, onPhase: p => { job.phase = p; } });
    if (r.status === 'built') { job.url = r.url; job.status = 'done'; }
    else { job.status = 'error'; job.error = r.reason; }
    // Email arrived mid-build (notify endpoint) after buildWcaPage read it.
    if (job.status === 'done' && job.email && !job.emailSaved) {
      job.emailSaved = true;
      db.saveLead(job.slug, job.email, null, null).catch(() => {});
    }
  })().catch(e => { job.status = 'error'; job.error = e.message; })
    .finally(() => wcaInflight.delete(key));
});

// Public job status: minimal surface, wca jobs only, no internals.
app.get('/wca/status', (req, res) => {
  const job = jobs.get(String(req.query.jobId || ''));
  if (!job || !job.wca) return res.json({ status: 'unknown' });
  res.json({ status: job.status, phase: job.phase, url: job.url });
});

// "Email me the link": records a lead against the page being built.
app.post('/wca/notify', async (req, res) => {
  const job = jobs.get(String((req.body && req.body.jobId) || ''));
  const email = String((req.body && req.body.email) || '').trim();
  if (!job || !job.wca) return res.status(404).json({ ok: false });
  if (!EMAIL_RE.test(email) || email.length > 254) return res.status(400).json({ ok: false });
  job.email = email;
  job.emailSaved = true; // save now; slug is already minted so attribution holds
  await db.saveLead(job.slug, email, null, req).catch(() => {});
  res.json({ ok: true });
});

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

// Build every product page (generates each hero image). Background job.
app.post('/admin/generate/solutions', async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { SOLUTIONS } = require('./render_solution');
  const list = Object.keys(SOLUTIONS);
  const jobId = crypto.randomUUID().slice(0, 8);
  const job = { id: jobId, total: list.length, done: 0, built: 0, status: 'running', results: [] };
  jobs.set(jobId, job);
  res.json({ jobId, total: job.total, status: 'running' });
  (async () => {
    for (const p of list) {
      try { const r = await pipeline.buildSolutionPage(p); job.built++; job.results.push(r); }
      catch (e) { job.results.push({ product: p, status: 'error', reason: e.message }); }
      job.done++;
    }
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

// Self-serve generate requests (hot interest signals, email or not).
app.get('/admin/wca', async (req, res) => {
  const key = process.env.RAINPARTNERS_ADMIN_KEY;
  if (!key || req.query.key !== key) return res.status(403).json({ error: 'forbidden' });
  try {
    const reqs = await db.getWcaRequests();
    if (req.query.format === 'csv') {
      const esc = v => { const s = String(v == null ? '' : v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
      const lines = ['domain,product,slug,created_at',
        ...reqs.map(r => [r.domain, r.product, r.slug, r.created_at].map(esc).join(','))];
      res.set('Content-Type', 'text/csv');
      res.set('Content-Disposition', 'attachment; filename="wca-requests.csv"');
      return res.send(lines.join('\n') + '\n');
    }
    res.json(reqs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- WhatsCoolAbout home / static (registered last) -------------------------
app.get('/', (req, res) => {
  res.set('Cache-Control', 'public, max-age=300');
  res.send(renderHome());
});
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`rain-partners server on port ${PORT}`);
  db.initDb();
});
