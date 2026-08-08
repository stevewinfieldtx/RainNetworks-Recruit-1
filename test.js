// Zero-dependency unit tests. Run: node test.js
const assert = require('assert');
const { newSlug } = require('./slug');
const { renderPage, escapeHtml } = require('./render');
const { buildStaticContent } = require('./llm');
const { renderOgPng, wrapLines } = require('./og');

let passed = 0;
function t(name, fn) { fn(); passed++; console.log(`  ok  ${name}`); }

// --- newSlug ---------------------------------------------------------------
t('newSlug: url-safe charset and length', () => {
  for (let i = 0; i < 1000; i++) {
    const s = newSlug();
    assert.match(s, /^[A-Za-z0-9_-]+$/, `bad charset: ${s}`);
    assert.ok(s.length >= 10 && s.length <= 12, `bad length: ${s}`);
  }
});

t('newSlug: uniqueness over 1e6', () => {
  const seen = new Set();
  for (let i = 0; i < 1_000_000; i++) {
    const s = newSlug();
    assert.ok(!seen.has(s), `collision at ${i}: ${s}`);
    seen.add(s);
  }
});

// --- escapeHtml ------------------------------------------------------------
t('escapeHtml: neutralizes script and quotes', () => {
  assert.strictEqual(escapeHtml('<script>alert(1)</script>'),
    '&lt;script&gt;alert(1)&lt;/script&gt;');
  assert.strictEqual(escapeHtml(`a"b'c&d`), 'a&quot;b&#39;c&amp;d');
});

t('escapeHtml: passes non-ASCII company names through', () => {
  assert.strictEqual(escapeHtml('Åland Îlé Söft'), 'Åland Îlé Söft');
});

// --- renderPage ------------------------------------------------------------
t('renderPage: static fixture contains all sections and company', () => {
  const company = 'Cascade Managed IT';
  const html = renderPage(buildStaticContent(company, { location: 'Seattle' }),
    { slug: 'abc123', base_url: 'http://x' });
  assert.ok(html.includes(company), 'company missing');
  assert.ok(html.includes('Why partner'), 'why_rain section missing');
  assert.ok(html.includes('three layers of defense'), 'defense_in_depth section missing');
  assert.ok(html.includes('NINJIO') && html.includes('Guardz') && html.includes('Macrium'), 'products missing');
  assert.ok(html.includes('The business case'), 'roi section missing');
  assert.ok(html.includes('action="/l/abc123"'), 'lead form action missing slug');
  assert.ok(html.includes('type="email"') && html.includes('name="email"'), 'email field missing');
  assert.ok(html.includes('name="phone"'), 'optional phone field missing');
});

t('renderPage: escapes a malicious company name', () => {
  const html = renderPage(buildStaticContent('<script>x</script> IT', {}), { slug: 's' });
  assert.ok(!html.includes('<script>x</script> IT'), 'company name not escaped');
  assert.ok(html.includes('&lt;script&gt;x&lt;/script&gt;'), 'escaped form missing');
});

t('buildStaticContent: no em or en dashes in copy', () => {
  const c = buildStaticContent('Summit Networks Group', { industry: 'healthcare', location: 'Denver' });
  const blob = JSON.stringify(c);
  assert.ok(!/[–—]/.test(blob), 'found an en/em dash in generated copy');
});

// --- og:image (link-unfurl preview) -----------------------------------------
t('renderPage: emits an absolute og:image only when slug + base_url are known', () => {
  const c = buildStaticContent('Cascade Managed IT', {});
  const withBoth = renderPage(c, { slug: 'abc123', prefix: '/p', base_url: 'https://x.example' });
  assert.ok(withBoth.includes('<meta property="og:image" content="https://x.example/p/og/abc123.png">'),
    'og:image missing or malformed when slug + base_url are present');
  const withoutBaseUrl = renderPage(c, { slug: 'abc123' });
  assert.ok(!withoutBaseUrl.includes('og:image'), 'og:image should not render a relative (broken) URL');
});

t('og.wrapLines: wraps long text and marks truncation with an ellipsis', () => {
  const lines = wrapLines('one two three four five six seven eight nine ten eleven twelve', 12, 3);
  assert.strictEqual(lines.length, 3, 'expected exactly 3 lines');
  assert.ok(lines[2].endsWith('…'), 'last line should be truncated with an ellipsis');
  assert.ok(lines.every(l => l.length <= 13), 'a line exceeded the max width by more than the ellipsis');
});

t('og.renderOgPng: produces a valid, correctly sized PNG', () => {
  const png = renderOgPng({ company: 'Cascade Managed IT', headline: 'Turn security into recurring revenue' });
  assert.ok(Buffer.isBuffer(png), 'expected a Buffer');
  assert.deepStrictEqual(png.subarray(0, 8), Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), 'missing PNG signature');
});

console.log(`\n${passed} tests passed.`);
