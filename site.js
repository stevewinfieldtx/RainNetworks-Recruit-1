// Fetch and extract a partner's website text, to ground the AI copy in what
// the company actually does. Zero dependencies (native fetch + regex strip).
// Results are cached under data/sites/ so re-runs do not re-fetch.

const fs = require('fs');
const path = require('path');

const CACHE_DIR = path.join(__dirname, 'data', 'sites');
const UA = 'RainPartnersBot/1.0 (+https://rainnetworks.com; partner research)';

async function fetchOne(url, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { signal: ctrl.signal, redirect: 'follow', headers: { 'User-Agent': UA } });
    if (!r.ok) return '';
    const ct = r.headers.get('content-type') || '';
    if (ct && !/text\/html|text\/plain|xml/.test(ct)) return '';
    return await r.text();
  } catch { return ''; }
  finally { clearTimeout(timer); }
}

function htmlToText(html) {
  if (!html) return '';
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

// Returns extracted, capped text describing the company. '' on total failure.
async function fetchSiteText(domain, opts = {}) {
  const timeoutMs = opts.timeoutMs || 8000;
  const maxChars = opts.maxChars || 6000;
  const clean = String(domain || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim().toLowerCase();
  if (!clean) return '';

  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const cacheFile = path.join(CACHE_DIR, clean.replace(/[^a-z0-9.-]/gi, '_') + '.txt');
  if (!opts.refresh && fs.existsSync(cacheFile)) {
    try { return fs.readFileSync(cacheFile, 'utf8'); } catch {}
  }

  const homeRaw = (await fetchOne('https://' + clean + '/', timeoutMs))
    || (await fetchOne('http://' + clean + '/', timeoutMs));
  const title = (homeRaw.match(/<title[^>]*>([^<]+)/i) || [])[1] || '';
  const metaDesc = (homeRaw.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']+)/i) || [])[1] || '';

  let combined = '';
  if (title) combined += 'TITLE: ' + title.trim() + '\n';
  if (metaDesc) combined += 'DESCRIPTION: ' + metaDesc.trim() + '\n';
  combined += htmlToText(homeRaw) + '\n';

  // Best-effort secondary pages for verticals / services / security signals.
  const extra = ['/about', '/about-us', '/services', '/managed-services', '/it-services',
                 '/security', '/cybersecurity', '/industries'];
  for (const p of extra) {
    if (combined.length > maxChars) break;
    const t = await fetchOne('https://' + clean + p, Math.min(timeoutMs, 6000));
    if (t) combined += '\n[' + p + '] ' + htmlToText(t) + '\n';
  }

  combined = combined.replace(/[ \t]+/g, ' ').trim().slice(0, maxChars);
  try { fs.writeFileSync(cacheFile, combined); } catch {}
  return combined;
}

module.exports = { fetchSiteText };
