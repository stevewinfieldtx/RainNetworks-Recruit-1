// og.js — Open Graph preview card for a personalized partner page. No headless
// browser: a hand-authored SVG (the page's own hero photo, brand colors, and
// its headline) gets rasterized to PNG by resvg-js. Generated on request from
// stored page content, so no extra generation step and no new storage.
//
// resvg-js cannot decode WebP (the site's hero-threat.webp renders blank), so
// public/og-hero.jpg is a pre-converted, pre-cropped (1200x630, matching the
// live page's object-position:70% 40%) copy checked into the repo for this.

const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const HERO_DATA_URI = (() => {
  try {
    const buf = fs.readFileSync(path.join(__dirname, 'public', 'og-hero.jpg'));
    return `data:image/jpeg;base64,${buf.toString('base64')}`;
  } catch { return null; } // missing asset: card still renders, just without the photo
})();

function escXml(v) {
  return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Greedy word-wrap by character count. Good enough for a fixed 1200x630 card;
// this is not a text layout engine, just enough to keep the headline readable.
function wrapLines(text, maxChars, maxLines) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > maxChars && cur) { lines.push(cur); cur = w; }
    else cur = next;
    if (lines.length === maxLines - 1 && cur.length > maxChars) break;
  }
  if (cur) lines.push(cur);
  let truncated = false;
  if (lines.length > maxLines) { lines.length = maxLines; truncated = true; }
  if (truncated) lines[maxLines - 1] = lines[maxLines - 1].replace(/[.,;: ]*$/, '') + '…';
  return lines;
}

function cardSvg({ company, headline }) {
  const W = 1200, H = 630;
  const co = company || 'your MSP';
  const lines = wrapLines(headline || `${co}, Rain Networks has a stack for you`, 28, 4);
  const lineHeight = 68;
  const startY = H / 2 - ((lines.length - 1) * lineHeight) / 2 + 6;
  const textSpans = lines.map((l, i) => `<tspan x="80" y="${startY + i * lineHeight}">${escXml(l)}</tspan>`).join('');

  // Truncate the badge company text so long legal names never overrun the pill
  // or the canvas (rough char-width estimate at 15px bold, not real metrics).
  const badgePrefix = 'RECOMMENDED FOR ';
  const badgeMaxW = 1040, charW = 11.5, padW = 56;
  const maxCoChars = Math.max(6, Math.floor((badgeMaxW - padW) / charW) - badgePrefix.length);
  const coUpper = co.toUpperCase();
  const coBadge = coUpper.length > maxCoChars ? coUpper.slice(0, maxCoChars - 1).trimEnd() + '…' : coUpper;
  const badgeW = Math.min(badgeMaxW, padW + (badgePrefix.length + coBadge.length) * charW);

  const pill = (x, w, label) => `<rect x="${x}" y="520" width="${w}" height="40" rx="20" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.16)"/><text x="${x + w / 2}" y="545" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="#dbeafe">${label}</text>`;

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a1122"/>
      <stop offset="100%" stop-color="#070b16"/>
    </linearGradient>
    <linearGradient id="fade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#070b16" stop-opacity="0.98"/>
      <stop offset="38%" stop-color="#070b16" stop-opacity="0.92"/>
      <stop offset="62%" stop-color="#070b16" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#070b16" stop-opacity="0.18"/>
    </linearGradient>
    <radialGradient id="glow" cx="85%" cy="8%" r="65%">
      <stop offset="0%" stop-color="#1f8fd6" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#1f8fd6" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${HERO_DATA_URI ? `<image href="${HERO_DATA_URI}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"/>` : ''}
  <rect width="${W}" height="${H}" fill="url(#fade)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <text x="80" y="92" font-family="Arial, sans-serif" font-size="28" font-weight="800" fill="#ffffff">RAIN NETWORKS</text>
  <rect x="80" y="128" width="${badgeW}" height="40" rx="20" fill="rgba(31,143,214,0.16)" stroke="#5cc8ff" stroke-opacity="0.4"/>
  <circle cx="102" cy="148" r="4" fill="#5cc8ff"/>
  <text x="116" y="154" font-family="Arial, sans-serif" font-size="15" font-weight="700" letter-spacing="1" fill="#a9d6f4">${escXml(badgePrefix + coBadge)}</text>
  <text font-family="Arial, sans-serif" font-size="52" font-weight="800" fill="#eef4fd">${textSpans}</text>
  ${pill(80, 118, 'Prevent')}${pill(210, 108, 'Detect')}${pill(330, 120, 'Recover')}
</svg>`;
}

function renderOgPng({ company, headline }) {
  const svg = cardSvg({ company, headline });
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
  return resvg.render().asPng();
}

module.exports = { renderOgPng, cardSvg, wrapLines };
