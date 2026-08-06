# rain-partners

Personalized MSP partner-recruitment landing pages for **Rain Networks**.

Each outreach email carries a unique URL (`/p/<slug>`). Clicking it lands the
recipient on a page personalized to their MSP, arguing why partnering with Rain
and adopting **Guardz** (detect and respond), **Macrium** (recover), and
**NINJIO** (prevent, human layer) is great for their business. Pages are
pre-generated and cached at send time, so the click serves instantly with no
model call at request time.

## Stack

Node 18+, Express 4, `pg`. No build step. Deploys to Railway. The cache and
OpenRouter call patterns are adapted from the `HowDoISay` project.

## Files

| File | Role |
|------|------|
| `server.js` | Routes: `/p/:slug`, `/px/:slug.gif`, `/go/:slug`, `/admin/stats`, static |
| `generate.js` | Batch CLI: CSV -> enrich -> content -> HTML -> store + slug -> `campaign.csv` |
| `llm.js` | `generatePageContent()` (OpenRouter, falls back to static copy) |
| `render.js` | `renderPage()` server-side HTML, `escapeHtml()` |
| `db.js` | Postgres or local JSON file store, `getPage`/`savePage`/`recordVisit`/`getStats` |
| `slug.js` | `newSlug()` 64-bit URL-safe slug |
| `env.js` | Tiny `.env` loader (no dependency) |
| `test.js` | Unit tests |

## Quick start

```bash
npm install
cp .env.example .env      # optional: fill in DATABASE_URL / OpenRouter creds
npm test                  # unit tests
node generate.js partners.sample.csv --dry   # preview content, writes nothing
node generate.js partners.sample.csv         # writes pages + campaign.csv
npm start                 # serve on PORT (default 4000)
```

With no `DATABASE_URL`, data persists to `./data/*.json` locally so the
generator and server share state. With no OpenRouter creds, `generate.js`
produces strong deterministic (static) copy personalized by company + enrichment.

## Enrichment

Personalization deepens when `partners.enriched.json` is present: a JSON object
keyed by lowercased company name, each value like
`{ "industry": "...", "size": "...", "location": "...", "pain_points": ["..."], "cta_url": "..." }`.
Produce it in an environment that has web-search / prospecting tools, then run
`generate.js` (which consumes it offline).

## Deploy (Railway)

1. New service from this repo. Add a Railway Postgres plugin.
2. Set env vars: `DATABASE_URL` (from the plugin), `OPENROUTER_API_KEY`,
   `OPENROUTER_MODEL_ID`, `BASE_URL` (the public URL), `RAINPARTNERS_ADMIN_KEY`, `IP_SALT`,
   `DEFAULT_CTA_URL`.
3. Start command: `npm start`. Tables are created on boot.

## Tracking

- `page_view`: the real "prospect clicked their link" signal (logged server-side).
- `open_pixel`: optional email-open beacon via `<img src="BASE_URL/px/<slug>.gif">`.
  Treat page views as ground truth (mail clients pre-fetch images).
- `cta_click`: logged by `/go/:slug` before redirecting to the booking link.
- `GET /admin/stats?key=RAINPARTNERS_ADMIN_KEY` returns per-partner open counts.
