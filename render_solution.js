// Vendor-themed SOLUTION landing pages. Each page adopts the VENDOR's own
// palette and feel (so a Macrium page looks like Macrium's world, an ESET page
// like ESET), with MSP-advocacy copy ("why you want to use <product>"),
// presented by Rain Networks as an authorized distributor. It never claims to
// be the vendor: clear attribution + a "not affiliated / not endorsed"
// disclaimer + a link to the vendor's official site. Zero em/en dashes.

function esc(v) {
  if (v === null || v === undefined) return '';
  return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const ICON = {
  bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M13 3L5 13h6l-1 8 8-10h-6z"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5c0 4.6-3 7.7-7 9-4-1.3-7-4.4-7-9V6z"/><path d="M9 12l2 2 4-4"/></svg>',
  restore: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4v6h6"/><path d="M4 10a8 8 0 1 1 2 6"/></svg>',
  monitor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>',
  dollar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  layers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/></svg>',
};

// One entry per product. theme drives the whole look; copy is MSP-advocacy.
const SOLUTIONS = {
  macrium: {
    name: 'Macrium',
    category: 'Backup, imaging and rapid recovery',
    official: 'https://www.macrium.com/',
    theme: { light: true, bg: '#ffffff', bg2: '#f2f5f9', ink: '#0b1f38', muted: '#475467', line: '#e4e7ec',
             primary: '#003B71', accent: '#009FE3', hero: 'linear-gradient(135deg,#003B71,#0a5aa0 60%,#009FE3)' },
    hero: {
      eyebrow: 'For managed service providers',
      headline: 'Build your backup and recovery practice on Macrium',
      subhead: 'Fast, ransomware-resistant Windows backup and imaging that you resell as a managed BCDR service, with one pane of glass across every client you protect.',
    },
    why: [
      { icon: ICON.dollar, title: 'Recurring BCDR revenue you own', body: 'Sell backup and disaster recovery as a managed service with predictable monthly margin, not a one-time license.' },
      { icon: ICON.shield, title: 'Ransomware-resistant by design', body: 'Encrypted, protected images mean a client can be brought back even after an attack, so you are the hero, not the headline.' },
      { icon: ICON.restore, title: 'Recover in minutes, to any hardware', body: 'Rapid image recovery, instant virtualization, and restore to dissimilar hardware keep clients billable instead of down.' },
      { icon: ICON.monitor, title: 'One pane across every client', body: 'MultiSite monitoring collates all your clients backups into a single dashboard, so one tech can cover your whole book.' },
    ],
    does: [
      'Windows server and workstation imaging', 'Rapid clone and full image recovery', 'Instant virtualization of a backup',
      'Restore to dissimilar hardware', 'MultiSite central monitoring for MSPs', 'Encryption and ransomware protection',
    ],
    caseTitle: 'A partner program built for the channel',
    caseBody: 'Macrium runs a partner program that equips resellers and service providers with technical resources, marketing materials, and margin. Through Rain Networks you get the licensing, onboarding, and enablement to stand it up fast.',
    cta: { headline: 'Add Macrium to your stack through Rain', sub: 'Leave your email and Rain Networks will send pricing, the partner terms, and how onboarding works. No obligation.' },
  },
};

function themeVars(t) {
  return `--bg:${t.bg};--bg2:${t.bg2};--ink:${t.ink};--muted:${t.muted};--line:${t.line};--primary:${t.primary};--accent:${t.accent}`;
}

const STYLE = t => `
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;${themeVars(t)};background:var(--bg);color:var(--ink);line-height:1.6;
font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
.wrap{max-width:1080px;margin:0 auto;padding:0 24px}
h1,h2,h3{margin:0;line-height:1.1;letter-spacing:-.02em;color:var(--primary)}
p{margin:0}
a{color:var(--accent);text-decoration:none}
.nav{border-bottom:1px solid var(--line);background:var(--bg)}
.nav .wrap{display:flex;align-items:center;justify-content:space-between;height:64px}
.present{display:flex;align-items:center;gap:10px;font-size:12.5px;color:var(--muted)}
.present img{height:22px;background:#fff;border:1px solid var(--line);border-radius:7px;padding:4px 8px}
.btn{display:inline-flex;align-items:center;gap:8px;font-weight:700;font-size:15px;padding:13px 22px;border-radius:10px;border:0;cursor:pointer;transition:filter .15s,transform .15s}
.btn-primary{background:var(--accent);color:#fff;box-shadow:0 8px 22px rgba(0,159,227,.35)}
.btn-primary:hover{filter:brightness(1.05);transform:translateY(-1px)}
.btn-ghost{background:transparent;color:var(--primary);border:1px solid var(--line)}
.hero{background:${t.hero};color:#fff;padding:66px 0 72px;position:relative;overflow:hidden}
.hero::after{content:"";position:absolute;inset:0;background:radial-gradient(45% 70% at 85% 10%,rgba(255,255,255,.18),transparent 55%);pointer-events:none}
.hero .wrap{position:relative}
.wordmark{font-size:34px;font-weight:800;letter-spacing:-.02em;color:#fff;margin-bottom:10px}
.eyebrow{display:inline-block;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#cfeafd;margin-bottom:14px}
.hero h1{color:#fff;font-size:clamp(30px,4.6vw,48px);font-weight:800;max-width:16ch;margin-bottom:16px}
.hero p{color:#e6f3fc;font-size:clamp(16px,2vw,20px);max-width:620px;margin-bottom:26px}
.hero .row{display:flex;flex-wrap:wrap;gap:12px;align-items:center}
.hero .row a.small{color:#cfeafd;font-size:14px;text-decoration:underline}
section{padding:64px 0}
.h2{font-size:clamp(24px,3.2vw,34px);font-weight:800;margin-bottom:12px}
.lead{color:var(--muted);font-size:18px;max-width:640px;margin-bottom:30px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}
@media(max-width:740px){.grid{grid-template-columns:1fr}}
.card{background:var(--bg);border:1px solid var(--line);border-radius:16px;padding:24px;box-shadow:0 1px 2px rgba(16,24,40,.04)}
.card .ic{width:40px;height:40px;color:var(--accent);margin-bottom:12px}
.card h3{font-size:18px;color:var(--ink);margin-bottom:6px}
.card p{color:var(--muted);font-size:15px}
.does{background:var(--bg2)}
.doeslist{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:24px}
@media(max-width:740px){.doeslist{grid-template-columns:1fr}}
.doeslist div{background:var(--bg);border:1px solid var(--line);border-radius:12px;padding:15px 16px;font-size:15px;color:var(--ink);display:flex;gap:10px;align-items:center}
.doeslist div::before{content:"";width:8px;height:8px;border-radius:2px;background:var(--accent);flex:0 0 auto}
.case{display:grid;grid-template-columns:auto 1fr;gap:20px;align-items:start;background:var(--bg);border:1px solid var(--line);border-left:4px solid var(--primary);border-radius:16px;padding:28px}
.case .ic{width:44px;height:44px;color:var(--primary)}
.ctaband{background:${t.hero};border-radius:22px;padding:48px 30px;text-align:center;color:#fff}
.ctaband h2{color:#fff;font-size:clamp(24px,3.2vw,34px)}
.ctaband p{color:#e6f3fc;max-width:560px;margin:12px auto 24px;font-size:17px}
.lead-form{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;max-width:560px;margin:0 auto}
.lead-form input{flex:1 1 230px;min-width:0;padding:14px 15px;border-radius:10px;border:0;font-size:16px}
.lead-form button{flex:1 1 100%;background:#0b1f38;color:#fff;font-weight:800;border:0;padding:14px;border-radius:10px;font-size:16px;cursor:pointer}
@media(min-width:560px){.lead-form button{flex:0 0 auto}}
footer{border-top:1px solid var(--line);padding:34px 0 54px;color:var(--muted);font-size:13px}
footer .disc{max-width:820px;line-height:1.6}
footer a{color:var(--accent)}
`;

function renderSolution(slug, meta = {}) {
  const s = SOLUTIONS[slug];
  if (!s) return null;
  const t = s.theme;
  const rainLogo = meta.logo || '/rain-logo.png';
  const prefix = (meta.prefix || '').replace(/\/$/, '');
  const formAction = `${prefix}/l/sol_${encodeURIComponent(slug)}`;
  const title = `Why MSPs choose ${s.name} | via Rain Networks`;
  const desc = s.hero.subhead;
  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta name="robots" content="noindex"><meta name="theme-color" content="${t.primary}">
<style>${STYLE(t)}</style></head><body id="top">

<nav class="nav"><div class="wrap">
  <span class="present">Presented by <img src="${esc(rainLogo)}" alt="Rain Networks">, an authorized distributor</span>
  <a class="btn btn-primary" href="#start" style="padding:9px 16px;font-size:14px">Talk to Rain about ${esc(s.name)}</a>
</div></nav>

<header class="hero"><div class="wrap">
  <div class="wordmark">${esc(s.name)}</div>
  <span class="eyebrow">${esc(s.hero.eyebrow)}</span>
  <h1>${esc(s.hero.headline)}</h1>
  <p>${esc(s.hero.subhead)}</p>
  <div class="row">
    <a class="btn btn-primary" href="#start">Talk to Rain about ${esc(s.name)}</a>
    <a class="small" href="${esc(s.official)}" target="_blank" rel="noopener">Visit the official ${esc(s.name)} site</a>
  </div>
</div></header>

<section><div class="wrap">
  <h2 class="h2">Why you want ${esc(s.name)} in your stack</h2>
  <p class="lead">${esc(s.category)}, packaged the way an MSP actually sells and delivers it.</p>
  <div class="grid">${s.why.map(w => `<div class="card"><div class="ic">${w.icon}</div><h3>${esc(w.title)}</h3><p>${esc(w.body)}</p></div>`).join('')}</div>
</div></section>

<section class="does"><div class="wrap">
  <h2 class="h2">What ${esc(s.name)} does</h2>
  <div class="doeslist">${s.does.map(d => `<div>${esc(d)}</div>`).join('')}</div>
</div></section>

<section><div class="wrap"><div class="case">
  <div class="ic">${ICON.layers}</div>
  <div><h2 class="h2" style="font-size:22px;margin-bottom:8px">${esc(s.caseTitle)}</h2><p style="color:var(--muted);font-size:16px">${esc(s.caseBody)}</p></div>
</div></div></section>

<section><div class="wrap"><div class="ctaband" id="cta-box">
  <h2>${esc(s.cta.headline)}</h2>
  <p>${esc(s.cta.sub)}</p>
  <form class="lead-form" id="start" method="post" action="${esc(formAction)}">
    <input type="email" name="email" required autocomplete="email" placeholder="Your work email">
    <input type="tel" name="phone" autocomplete="tel" placeholder="Phone (optional)">
    <button type="submit">Send me ${esc(s.name)} details</button>
  </form>
</div></div></section>

<footer><div class="wrap"><p class="disc">
  This page is provided by <strong>Rain Networks</strong>, an authorized distributor, to explain why managed service providers choose ${esc(s.name)}.
  ${esc(s.name)} and the ${esc(s.name)} name and logos are trademarks of their respective owner. This page is not affiliated with, sponsored by, or endorsed by ${esc(s.name)}.
  For official product information, visit <a href="${esc(s.official)}" target="_blank" rel="noopener">${esc(s.official.replace(/^https?:\/\//, '').replace(/\/$/, ''))}</a>.
</p></div></footer>
</body></html>`;
}

module.exports = { renderSolution, SOLUTIONS };
