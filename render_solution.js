// Vendor-themed SOLUTION landing pages, premium build. Each page adopts the
// vendor's palette and feel, with a cinematic hero over a generated (Runware)
// image, depth, motion, and real graphics. MSP-advocacy copy ("why you want
// <product>"), published by NYN Impact as an INDEPENDENT third party that
// reviews solutions for MSPs and makes introductions. Never claims to be the
// vendor: clear attribution + "independent / not affiliated" + official-site
// link. Leads go to NYN Impact, not the vendor. Zero em/en dashes.

const PUBLISHER = {
  name: 'NYN Impact',
  role: 'Independent MSP solution reviews and introductions',
  site: process.env.PUBLISHER_URL || 'https://nynimpact.com',
};

function esc(v) {
  if (v === null || v === undefined) return '';
  return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const ICON = {
  dollar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5c0 4.6-3 7.7-7 9-4-1.3-7-4.4-7-9V6z"/><path d="M9 12l2 2 4-4"/></svg>',
  restore: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4v6h6"/><path d="M4 10a8 8 0 1 1 2 6"/></svg>',
  monitor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>',
  layers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
};

const SOLUTIONS = {
  macrium: {
    name: 'Macrium', category: 'Backup, imaging and rapid recovery', official: 'https://www.macrium.com/',
    theme: { primary: '#003B71', accent: '#009FE3', deep: '#001B36', ink: '#0b1f38', muted: '#5b6b82', line: 'rgba(255,255,255,.10)' },
    heroPrompt: 'Cinematic abstract enterprise technology hero: secure data backup and rapid disaster recovery, streams of glowing data converging into a resilient protective shield, sleek server and storage forms restored, speed and resilience. Deep navy blue base hex 003B71 with bright cyan hex 009FE3 glowing highlights, dark gradient background, subtle grid and particles, premium polished corporate tech aesthetic, dramatic lighting, high detail, no text, no words, no letters, no logos',
    hero: { eyebrow: 'For managed service providers', headline: 'Build your backup and recovery practice on Macrium',
      subhead: 'Fast, ransomware-resistant Windows backup and imaging that you resell as a managed BCDR service, with one pane of glass across every client you protect.' },
    why: [
      { icon: ICON.dollar, title: 'Recurring BCDR revenue you own', body: 'Sell backup and disaster recovery as a managed service with predictable monthly margin, not a one-time license.' },
      { icon: ICON.shield, title: 'Ransomware-resistant by design', body: 'Encrypted, protected images mean a client comes back even after an attack, so you are the hero, not the headline.' },
      { icon: ICON.restore, title: 'Recover in minutes, to any hardware', body: 'Rapid image recovery, instant virtualization, and restore to dissimilar hardware keep clients billable instead of down.' },
      { icon: ICON.monitor, title: 'One pane across every client', body: 'MultiSite monitoring collates all your clients backups into a single dashboard, so one tech can cover your whole book.' },
    ],
    does: ['Windows server and workstation imaging', 'Rapid clone and full image recovery', 'Instant virtualization of a backup',
      'Restore to dissimilar hardware', 'MultiSite central monitoring for MSPs', 'Encryption and ransomware protection'],
    caseTitle: 'A partner program built for the channel',
    caseBody: 'Macrium runs a partner program that equips resellers and service providers with technical resources, materials, and margin. I can introduce you to the right distributor so you get licensing, onboarding, and enablement without starting cold.',
    cta: { headline: 'Want more information?', sub: 'Leave your work email and I will send it over.' },
  },
};

const STYLE = t => `
:root{--primary:${t.primary};--accent:${t.accent};--deep:${t.deep};--ink:${t.ink};--muted:${t.muted};--line:${t.line};--bg:#0a1626}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:#eaf2fb;overflow-x:hidden;line-height:1.6;
font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
.bgfx{position:fixed;inset:0;z-index:-1;background:radial-gradient(55% 45% at 82% 6%,${t.accent}22,transparent 60%),radial-gradient(50% 45% at 8% 30%,${t.primary}33,transparent 60%),linear-gradient(180deg,var(--bg),var(--deep) 60%,var(--bg))}
.wrap{max-width:1120px;margin:0 auto;padding:0 24px}
h1,h2,h3{margin:0;line-height:1.08;letter-spacing:-.02em}
p{margin:0}
a{color:var(--accent);text-decoration:none}
.nav{position:sticky;top:0;z-index:40;backdrop-filter:blur(10px);background:rgba(10,22,38,.6);border-bottom:1px solid var(--line)}
.nav .wrap{display:flex;align-items:center;justify-content:space-between;height:66px}
.present{display:flex;align-items:center;gap:10px;font-size:12.5px;color:#a9bdd6}
.present img{height:22px;background:#fff;border-radius:7px;padding:4px 8px}
.btn{display:inline-flex;align-items:center;gap:9px;font-weight:700;font-size:15px;padding:14px 24px;border-radius:12px;border:0;cursor:pointer;transition:transform .16s,filter .16s,box-shadow .16s}
.btn-primary{background:linear-gradient(180deg,${t.accent},${t.primary});color:#fff;box-shadow:0 12px 30px ${t.accent}55}
.btn-primary:hover{transform:translateY(-2px);filter:brightness(1.06)}
.btn-ghost{background:rgba(255,255,255,.06);color:#eaf2fb;border:1px solid var(--line)}
.hero{position:relative;min-height:88vh;display:flex;align-items:center;overflow:hidden}
.hero-bg{position:absolute;inset:0;z-index:0}
.hero-bg img{width:100%;height:100%;object-fit:cover;object-position:center right}
.hero-bg::after{content:"";position:absolute;inset:0;background:linear-gradient(100deg,var(--deep) 6%,rgba(0,27,54,.9) 36%,rgba(0,27,54,.55) 62%,transparent 100%)}
.hero .wrap{position:relative;z-index:2;padding:40px 24px 56px}
.wordmark{font-size:30px;font-weight:800;color:#fff;margin-bottom:14px}
.eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#bfe4fb;background:${t.accent}1f;border:1px solid ${t.accent}44;padding:7px 13px;border-radius:999px}
.hero h1{color:#fff;font-size:clamp(32px,5vw,58px);font-weight:800;max-width:15ch;margin:20px 0 18px}
.hero .sub{color:#dbe9f7;font-size:clamp(17px,2vw,21px);max-width:620px;margin-bottom:30px}
.hero .row{display:flex;flex-wrap:wrap;gap:12px;align-items:center}
.hero .row .small{color:#bfe4fb;font-size:14px;text-decoration:underline}
section{padding:80px 0;position:relative}
.h2{font-size:clamp(26px,3.6vw,40px);font-weight:800;color:#fff;margin-bottom:14px}
.lead{color:#a9bdd6;font-size:19px;max-width:660px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:38px}
@media(max-width:760px){.grid{grid-template-columns:1fr}}
.card{position:relative;background:rgba(255,255,255,.045);border:1px solid var(--line);border-radius:18px;padding:26px;overflow:hidden;transition:transform .2s,border-color .2s}
.card:hover{transform:translateY(-5px);border-color:${t.accent}66}
.card::before{content:"";position:absolute;inset:0 0 auto 0;height:3px;background:linear-gradient(90deg,${t.accent},transparent)}
.card .ic{width:42px;height:42px;color:${t.accent};margin-bottom:14px}
.card h3{font-size:19px;color:#fff;margin-bottom:7px}
.card p{color:#a9bdd6;font-size:15px}
.does{background:linear-gradient(180deg,${t.primary}18,transparent)}
.doeslist{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:30px}
@media(max-width:760px){.doeslist{grid-template-columns:1fr}}
.doeslist div{display:flex;gap:11px;align-items:center;background:rgba(255,255,255,.04);border:1px solid var(--line);border-radius:12px;padding:15px 16px;font-size:15px;color:#eaf2fb}
.doeslist .ck{width:18px;height:18px;color:${t.accent};flex:0 0 auto}
.case{display:grid;grid-template-columns:auto 1fr;gap:22px;align-items:start;background:rgba(255,255,255,.045);border:1px solid var(--line);border-left:4px solid ${t.accent};border-radius:18px;padding:30px}
.case .ic{width:46px;height:46px;color:${t.accent}}
.case h3{color:#fff;font-size:22px;margin-bottom:8px}
.case p{color:#a9bdd6;font-size:16px}
.ctaband{position:relative;overflow:hidden;border-radius:26px;padding:56px 32px;text-align:center;background:linear-gradient(125deg,${t.primary},${t.accent} 90%);border:1px solid rgba(255,255,255,.16)}
.ctaband::before{content:"";position:absolute;inset:0;background:radial-gradient(45% 80% at 82% 0,rgba(255,255,255,.25),transparent 55%)}
.ctaband h2{position:relative;color:#fff}
.ctaband p{position:relative;color:#eaf6ff;max-width:560px;margin:12px auto 26px;font-size:18px}
.lead-form{position:relative;display:flex;flex-wrap:wrap;gap:10px;justify-content:center;max-width:600px;margin:0 auto}
.lead-form input{flex:1 1 230px;min-width:0;padding:15px 16px;border-radius:11px;border:0;font-size:16px;background:#fff;color:#0b1f38}
.lead-form button{flex:1 1 100%;background:var(--deep);color:#fff;font-weight:800;border:0;padding:15px;border-radius:11px;font-size:16px;cursor:pointer}
@media(min-width:560px){.lead-form button{flex:0 0 auto}}
footer{border-top:1px solid var(--line);padding:36px 0 56px;color:#7d92ad;font-size:13px}
footer .disc{max-width:860px;line-height:1.6}
.reveal{opacity:0;transform:translateY(22px);transition:opacity .7s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1)}
.reveal.in{opacity:1;transform:none}
@media(prefers-reduced-motion:reduce){.reveal{opacity:1;transform:none;transition:none}html{scroll-behavior:auto}}
`;

// Fallback hero if no generated image: a themed gradient canvas (still cinematic).
function heroBg(heroImg, t) {
  if (heroImg) return `<div class="hero-bg"><img src="${esc(heroImg)}" alt="" loading="eager"></div>`;
  return `<div class="hero-bg" style="background:radial-gradient(60% 90% at 78% 30%,${t.accent}55,transparent 60%),linear-gradient(120deg,${t.deep},${t.primary})"></div>`;
}

function renderSolution(product, meta = {}) {
  const s = SOLUTIONS[product];
  if (!s) return null;
  const t = s.theme;
  const prefix = (meta.prefix || '').replace(/\/$/, '');
  const heroImg = meta.heroImg || null;
  const formAction = `${prefix}/l/sol_${encodeURIComponent(product)}`;
  const title = `Why MSPs choose ${s.name} | ${PUBLISHER.name}`;
  const desc = s.hero.subhead;
  const host = s.official.replace(/^https?:\/\//, '').replace(/\/$/, '');

  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta name="robots" content="noindex"><meta name="theme-color" content="${t.deep}">
<style>${STYLE(t)}</style></head><body id="top"><div class="bgfx"></div>

<nav class="nav"><div class="wrap">
  <span class="present"><strong style="color:#fff;font-size:17px;letter-spacing:-.01em">${esc(PUBLISHER.name)}</strong></span>
  <a class="btn btn-primary" href="#start" style="padding:9px 16px;font-size:14px">More information</a>
</div></nav>

<header class="hero">${heroBg(heroImg, t)}<div class="wrap">
  <div class="wordmark reveal in">${esc(s.name)}</div>
  <span class="eyebrow reveal in">${esc(s.hero.eyebrow)}</span>
  <h1 class="reveal in">${esc(s.hero.headline)}</h1>
  <p class="sub reveal in">${esc(s.hero.subhead)}</p>
  <div class="row reveal in">
    <a class="btn btn-primary" href="#start">Send me more information</a>
    <a class="small" href="${esc(s.official)}" target="_blank" rel="noopener">Visit the official ${esc(s.name)} site</a>
  </div>
</div></header>

<section><div class="wrap">
  <h2 class="h2 reveal">Why you want ${esc(s.name)} in your stack</h2>
  <p class="lead reveal">${esc(s.category)}, packaged the way an MSP actually sells and delivers it.</p>
  <div class="grid">${s.why.map(w => `<div class="card reveal"><div class="ic">${w.icon}</div><h3>${esc(w.title)}</h3><p>${esc(w.body)}</p></div>`).join('')}</div>
</div></section>

<section class="does"><div class="wrap">
  <h2 class="h2 reveal">What ${esc(s.name)} does</h2>
  <div class="doeslist">${s.does.map(d => `<div class="reveal"><span class="ck">${ICON.check}</span>${esc(d)}</div>`).join('')}</div>
</div></section>

<section><div class="wrap"><div class="case reveal">
  <div class="ic">${ICON.layers}</div>
  <div><h3>${esc(s.caseTitle)}</h3><p>${esc(s.caseBody)}</p></div>
</div></div></section>

<section><div class="wrap"><div class="ctaband reveal" id="cta-box">
  <h2 class="h2">${esc(s.cta.headline)}</h2>
  <p>${esc(s.cta.sub)}</p>
  <form class="lead-form" id="start" method="post" action="${esc(formAction)}">
    <input type="email" name="email" required autocomplete="email" placeholder="Your work email">
    <input type="tel" name="phone" autocomplete="tel" placeholder="Phone (optional)">
    <button type="submit">Send me more information</button>
  </form>
</div></div></section>

<footer><div class="wrap"><p class="disc">
  <strong>${esc(PUBLISHER.name)}</strong> &middot; ${esc(s.name)} and related names and logos are trademarks of their respective owner. ${esc(PUBLISHER.name)} is not affiliated with or endorsed by ${esc(s.name)}.
  Official product information: <a href="${esc(s.official)}" target="_blank" rel="noopener">${esc(host)}</a>.
</p></div>
<script>(function(){var r=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;var e=document.querySelectorAll('.reveal:not(.in)');if(r||!('IntersectionObserver'in window)){e.forEach(function(x){x.classList.add('in')});return}var io=new IntersectionObserver(function(en){en.forEach(function(x){if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}})},{threshold:.12});e.forEach(function(x){io.observe(x)})})();</script>
</footer>
</body></html>`;
}

module.exports = { renderSolution, SOLUTIONS };
