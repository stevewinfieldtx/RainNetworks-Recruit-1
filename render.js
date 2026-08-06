// Server-side HTML rendering: one self-contained HTML document per partner, no
// build step, opens from an email link. Dark cinematic security-tech design.
// Sora typeface (self-hosted), full-bleed hero, layered depth, real motion.
// Brand blue #1470AF, single accent family. Zero em/en dashes.

function escapeHtml(v) {
  if (v === null || v === undefined) return '';
  return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const BRAND = {
  name: 'Rain Networks', tagline: 'Value-added distribution for MSPs',
  logo: '/rain-logo.png', heroImg: '/hero-threat.webp', boardImg: '/backup-board.webp',
  catalog: [
    { name: 'Bitdefender', cat: 'Endpoint protection' }, { name: 'ESET', cat: 'Endpoint security' },
    { name: 'Heimdal', cat: 'Threat prevention' }, { name: 'Proofpoint', cat: 'Email security' },
    { name: 'Pulseway', cat: 'Remote monitoring' }, { name: 'Redstor', cat: 'Cloud backup' },
    { name: 'Trustifi', cat: 'Email encryption' }, { name: 'VIPRE', cat: 'Endpoint and email' },
  ],
};

const ICON = {
  prevent: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5c0 4.6-3 7.7-7 9-4-1.3-7-4.4-7-9V6z"/><path d="M9 12l2 2 4-4"/></svg>',
  detect: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M11 8v3l2 2"/><path d="M20.5 20.5L17 17"/></svg>',
  recover: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4v6h6"/><path d="M4 10a8 8 0 1 1 2 6"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 3L5 13h6l-1 8 8-10h-6z"/></svg>',
  layers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/></svg>',
  handshake: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 12l3 3 5-5"/><path d="M2 12a10 10 0 0 1 20 0 10 10 0 0 1-20 0z"/></svg>',
  spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18"/></svg>',
};

function fontCss(meta) {
  const f = meta.fontData || {};
  const src = w => f[w] || `/rain-font-${w}.woff2`;
  return [400, 600, 800].map(w => `@font-face{font-family:'Sora';font-style:normal;font-weight:${w};font-display:swap;src:url('${src(w)}') format('woff2')}`).join('');
}

const STYLE = `
:root{--bg:#070b16;--bg2:#0a1122;--ink:#eef4fd;--muted:#9db0cc;--faint:#66799a;
--brand:#1f8fd6;--brand2:#5cc8ff;--deep:#0c3a5c;--line:rgba(255,255,255,.10);--glass:rgba(255,255,255,.045);--r:18px}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--ink);overflow-x:hidden;
font-family:'Sora',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.6;-webkit-font-smoothing:antialiased}
.bgfx{position:fixed;inset:0;z-index:-2;background:
radial-gradient(50% 40% at 85% 8%,rgba(31,143,214,.20),transparent 60%),
radial-gradient(45% 45% at 6% 30%,rgba(92,200,255,.10),transparent 60%),
radial-gradient(60% 50% at 50% 108%,rgba(31,143,214,.14),transparent 60%),
linear-gradient(180deg,#070b16,#0a1122 45%,#070b16)}
.grain{position:fixed;inset:0;z-index:-1;pointer-events:none;opacity:.05;
background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.wrap{max-width:1140px;margin:0 auto;padding:0 24px}
h1,h2,h3{margin:0;letter-spacing:-.025em;line-height:1.06;font-weight:800}
p{margin:0}
a{color:var(--brand2);text-decoration:none}
.eyebrow{display:inline-flex;align-items:center;gap:9px;font-size:12px;font-weight:700;letter-spacing:.18em;
text-transform:uppercase;color:#a9d6f4;background:rgba(31,143,214,.12);border:1px solid rgba(92,200,255,.22);
padding:7px 13px;border-radius:999px}
.eyebrow .dot{width:6px;height:6px;border-radius:50%;background:var(--brand2);box-shadow:0 0 10px var(--brand2)}

/* nav */
.nav{position:sticky;top:0;z-index:60;backdrop-filter:blur(12px);background:rgba(7,11,22,.55);border-bottom:1px solid var(--line)}
.nav .wrap{display:flex;align-items:center;justify-content:space-between;height:72px}
.logochip{background:#fff;border-radius:12px;padding:8px 13px;line-height:0;box-shadow:0 8px 26px rgba(0,0,0,.4)}
.logochip img{height:26px;display:block}

/* buttons */
.btn{display:inline-flex;align-items:center;gap:10px;font-family:inherit;font-weight:700;font-size:15px;
padding:15px 26px;border-radius:13px;border:0;cursor:pointer;transition:transform .18s,box-shadow .18s,filter .18s}
.btn-primary{color:#04121f;background:linear-gradient(180deg,#7ad3ff,var(--brand));background-size:100% 200%;
box-shadow:0 12px 34px rgba(31,143,214,.5)}
.btn-primary:hover{transform:translateY(-2px);background-position:0 100%;box-shadow:0 16px 42px rgba(31,143,214,.6)}
.btn-primary:active{transform:translateY(0)}
.btn-ghost{color:var(--ink);background:rgba(255,255,255,.06);border:1px solid var(--line);backdrop-filter:blur(6px)}
.btn-ghost:hover{background:rgba(255,255,255,.11);transform:translateY(-2px)}

/* hero */
.hero{position:relative;min-height:94vh;display:flex;align-items:center;overflow:hidden}
.hero-bg{position:absolute;inset:0;z-index:0}
.hero-bg img{width:100%;height:100%;object-fit:cover;object-position:70% 40%;filter:saturate(1.1) contrast(1.02)}
.hero-bg::after{content:"";position:absolute;inset:0;background:
linear-gradient(96deg,#070b16 4%,rgba(7,11,22,.92) 34%,rgba(7,11,22,.6) 60%,rgba(7,11,22,.25) 100%),
radial-gradient(70% 90% at 18% 42%,rgba(31,143,214,.22),transparent 62%)}
.hero .wrap{position:relative;z-index:2;padding-top:40px;padding-bottom:60px}
.hero h1{font-size:clamp(34px,5.4vw,66px);margin:22px 0 20px;max-width:15ch}
.hero .sub{font-size:clamp(17px,2vw,21px);color:#cfe0f4;max-width:600px;margin-bottom:32px;font-weight:400}
.cta-row{display:flex;flex-wrap:wrap;gap:13px}
.pills{display:flex;gap:10px;flex-wrap:wrap;margin-top:34px}
.pills span{font-size:12.5px;font-weight:600;letter-spacing:.02em;color:#dbeafe;background:rgba(9,17,34,.55);
border:1px solid var(--line);backdrop-filter:blur(6px);padding:8px 14px;border-radius:999px}
.pills span b{color:var(--brand2)}

/* section shells */
section{padding:88px 0;position:relative}
.h2{font-size:clamp(26px,3.6vw,42px);margin:16px 0 14px;max-width:20ch}
.lead{color:var(--muted);font-size:19px;max-width:640px;font-weight:400}

/* impact strip */
.impact{border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:linear-gradient(180deg,rgba(31,143,214,.05),transparent);padding:34px 0}
.impact .row{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
@media(max-width:760px){.impact .row{grid-template-columns:1fr;gap:18px}}
.impact .cell b{display:block;font-size:clamp(20px,2.4vw,26px);font-weight:800;color:#fff}
.impact .cell span{color:var(--muted);font-size:14.5px}

/* why bento */
.bento{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-top:36px}
@media(max-width:760px){.bento{grid-template-columns:1fr}}
.tile{position:relative;background:var(--glass);border:1px solid var(--line);border-radius:var(--r);padding:26px;overflow:hidden;transition:transform .2s,border-color .2s}
.tile:hover{transform:translateY(-4px);border-color:rgba(92,200,255,.4)}
.tile::before{content:"";position:absolute;inset:0 0 auto 0;height:3px;background:linear-gradient(90deg,var(--brand2),transparent)}
.tile .ic{width:40px;height:40px;color:var(--brand2);margin-bottom:14px}
.tile p{color:var(--muted);font-size:15.5px}

/* three layers */
.layers{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:40px}
@media(max-width:900px){.layers{grid-template-columns:1fr}}
.layer{position:relative;background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02));
border:1px solid var(--line);border-radius:20px;padding:30px 26px 28px;overflow:hidden;transition:transform .22s,box-shadow .22s,border-color .22s}
.layer:hover{transform:translateY(-6px);border-color:rgba(92,200,255,.45);box-shadow:0 26px 60px rgba(0,0,0,.5),0 0 0 1px rgba(92,200,255,.15)}
.layer::before{content:"";position:absolute;inset:0 0 auto 0;height:4px;background:linear-gradient(90deg,var(--brand2),var(--brand))}
@media(min-width:900px){.layer:nth-child(2){transform:translateY(18px)}.layer:nth-child(2):hover{transform:translateY(12px)}}
.layer .num{position:absolute;top:14px;right:20px;font-size:64px;font-weight:800;color:rgba(255,255,255,.06);line-height:1}
.layer .lic{width:46px;height:46px;color:var(--brand2);margin-bottom:16px}
.layer .ltag{font-size:11.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#a9d6f4}
.layer h3{font-size:25px;margin:7px 0 11px}
.layer p{color:var(--muted);font-size:15px}
.flexnote{display:flex;gap:16px;align-items:flex-start;margin-top:26px;background:var(--glass);
border:1px solid var(--line);border-left:3px solid var(--brand2);border-radius:14px;padding:22px 24px}
.flexnote .fic{width:26px;height:26px;color:var(--brand2);flex:0 0 auto;margin-top:2px}
.flexnote .ft{color:var(--muted);font-size:15.5px}.flexnote .ft b{color:var(--ink)}

/* try one opportunity */
.tryband{position:relative;border-radius:26px;padding:52px 40px;overflow:hidden;
background:linear-gradient(120deg,#0b2c46,#124a74 55%,#1f8fd6);border:1px solid rgba(92,200,255,.3)}
.tryband::after{content:"";position:absolute;inset:0;background:radial-gradient(50% 120% at 88% 10%,rgba(255,255,255,.22),transparent 55%);pointer-events:none}
.tryband .in{position:relative;display:grid;grid-template-columns:auto 1fr;gap:28px;align-items:center}
@media(max-width:760px){.tryband .in{grid-template-columns:1fr;gap:16px}}
.tryband .big{font-size:clamp(58px,9vw,104px);font-weight:800;line-height:.9;color:rgba(255,255,255,.9);
text-shadow:0 8px 40px rgba(0,0,0,.35)}
.tryband h2{color:#fff;font-size:clamp(24px,3.2vw,36px)}
.tryband p{color:#e4f2ff;font-size:18px;margin-top:10px;max-width:640px}

/* business case */
.case{display:grid;grid-template-columns:1.05fr .95fr;gap:44px;align-items:center}
@media(max-width:900px){.case{grid-template-columns:1fr}}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:26px}
@media(max-width:560px){.stats{grid-template-columns:1fr}}
.stat{background:var(--glass);border:1px solid var(--line);border-radius:14px;padding:20px}
.stat .v{font-size:24px;font-weight:800;color:#fff}.stat .l{font-size:12.5px;color:var(--faint);margin-top:6px}
.caseimg{position:relative;border-radius:20px;overflow:hidden;border:1px solid var(--line);box-shadow:0 30px 70px rgba(0,0,0,.5);aspect-ratio:16/11}
.caseimg img{width:100%;height:100%;object-fit:cover}
.caseimg::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 40%,rgba(7,11,22,.5))}

/* arsenal */
.arsenal{display:grid;grid-template-columns:repeat(4,1fr);gap:13px;margin-top:34px}
@media(max-width:820px){.arsenal{grid-template-columns:repeat(2,1fr)}}
.chip{background:var(--glass);border:1px solid var(--line);border-radius:14px;padding:18px 18px;transition:transform .18s,background .18s,border-color .18s}
.chip:hover{transform:translateY(-4px);background:rgba(255,255,255,.08);border-color:rgba(92,200,255,.35)}
.chip b{font-size:16px;display:block}.chip span{font-size:12.5px;color:var(--faint)}
.chip.feat{border-color:rgba(92,200,255,.45);background:linear-gradient(180deg,rgba(31,143,214,.2),var(--glass))}
.chip.feat span{color:#a9d6f4}

/* proof */
.proof{background:var(--glass);border:1px solid var(--line);border-left:3px solid var(--brand2);border-radius:18px;
padding:34px 36px;font-size:21px;color:#dbe8f7;font-weight:400;max-width:900px}
.proof b{color:#fff;font-weight:700}

/* cta */
.ctaband{position:relative;overflow:hidden;border-radius:28px;padding:60px 34px;text-align:center;
background:linear-gradient(125deg,#0c3a5c,#1f8fd6 62%,#5cc8ff);border:1px solid rgba(255,255,255,.16)}
.ctaband::before{content:"";position:absolute;inset:0;background:radial-gradient(45% 80% at 80% 0,rgba(255,255,255,.28),transparent 55%);pointer-events:none}
.ctaband h2{position:relative;color:#fff;font-size:clamp(28px,4vw,44px)}
.ctaband p{position:relative;color:#eaf6ff;max-width:560px;margin:14px auto 28px;font-size:18px}
.lead-form{position:relative;display:flex;flex-wrap:wrap;gap:11px;justify-content:center;max-width:620px;margin:0 auto}
.lead-form input{flex:1 1 240px;min-width:0;padding:16px 17px;border-radius:13px;font-size:16px;font-family:inherit;
border:1px solid rgba(255,255,255,.6);background:rgba(255,255,255,.96);color:#08243b}
.lead-form input::placeholder{color:#5c728c}
.lead-form input:focus{outline:2px solid #bfe6ff;outline-offset:1px}
.lead-form button{flex:1 1 100%;background:#061c30;color:#fff;font-weight:800;border:0;padding:16px;border-radius:13px;font-size:16px;font-family:inherit;cursor:pointer;transition:transform .18s,background .18s}
.lead-form button:hover{background:#020f1c;transform:translateY(-2px)}
@media(min-width:560px){.lead-form button{flex:0 0 auto}}
.formnote{position:relative;color:#d6ecff;font-size:13px;margin:15px auto 0;max-width:480px}

footer{border-top:1px solid var(--line);padding:40px 0 60px;color:var(--faint);font-size:13px;margin-top:30px}
footer .wrap{display:flex;flex-wrap:wrap;gap:12px;justify-content:space-between}

/* motion */
.reveal{opacity:0;transform:translateY(26px);transition:opacity .8s cubic-bezier(.16,1,.3,1),transform .8s cubic-bezier(.16,1,.3,1)}
.reveal.in{opacity:1;transform:none}
@keyframes floaty{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
.orb{position:absolute;z-index:1;width:180px;height:180px;border-radius:50%;top:22%;right:8%;pointer-events:none;
background:radial-gradient(circle,rgba(92,200,255,.5),transparent 68%);filter:blur(6px);animation:floaty 7s ease-in-out infinite}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.reveal{opacity:1;transform:none;transition:none}.orb{animation:none}.btn,.tile,.layer,.chip{transition:none}}
`;

function stats(list) { return list.map(s => `<div class="stat"><div class="v">${escapeHtml(s.value)}</div><div class="l">${escapeHtml(s.label)}</div></div>`).join(''); }

function renderPage(content, meta = {}) {
  const c = content || {}, hero = c.hero || {}, why = c.why_rain || {}, did = c.defense_in_depth || {}, roi = c.roi || {}, proof = c.social_proof || {}, cta = c.cta || {};
  const company = c.company || 'your MSP';
  const prefix = (meta.prefix || '').replace(/\/$/, '');
  const logo = meta.logo || BRAND.logo, heroImg = meta.heroImg || BRAND.heroImg, boardImg = meta.boardImg || BRAND.boardImg;
  const heroHref = meta.slug ? '#start' : (cta.url || '#start');
  const formAction = meta.slug ? `${prefix}/l/${encodeURIComponent(meta.slug)}` : '';
  const ctaLabel = cta.label || 'Send me the partner details';

  const products = (did.products && did.products.length) ? did.products : [
    { name: 'NINJIO', layer: 'Prevent / human layer', for_you: 'Security awareness training that stops phishing and social engineering. Recurring revenue, white-label or co-brand as your own.' },
    { name: 'Guardz', layer: 'Detect and respond', for_you: 'AI-powered protection across endpoints, identity, email, and cloud in one multi-tenant console, with client-ready ROI reports.' },
    { name: 'Macrium', layer: 'Recover', for_you: 'Ransomware-resistant backup and imaging with rapid recovery and single-pane monitoring across every client you manage.' },
  ];
  const licons = [ICON.prevent, ICON.detect, ICON.recover];
  const bullets = (why.bullets && why.bullets.length) ? why.bullets : [
    'New recurring revenue lines you can turn on quickly',
    'A strong commission structure and healthy reseller margins',
    'One distributor relationship instead of vendor sprawl',
    'Enablement and training from Rain, not just a license desk',
  ];
  const roiStats = (roi.stats && roi.stats.length) ? roi.stats : [
    { value: '3 layers', label: 'One distributor, one managed-security offer' },
    { value: 'Recurring', label: 'Billable, markable-up services under your brand' },
    { value: 'One console', label: 'Multi-tenant management across clients' },
  ];
  const feat = [{ name: 'Guardz', tag: 'Detect and respond' }, { name: 'Macrium', tag: 'Backup and recovery' }, { name: 'NINJIO', tag: 'Awareness training' }];
  const title = `${company} + ${BRAND.name} Partnership`;
  const desc = hero.subhead || `Why partnering with ${BRAND.name} fits ${company}.`;
  const bicons = [ICON.bolt, ICON.handshake, ICON.layers, ICON.prevent];

  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(desc)}">
<meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(desc)}">
<meta property="og:type" content="website"><meta name="theme-color" content="#070b16"><meta name="robots" content="noindex">
<style>${fontCss(meta)}${STYLE}</style></head>
<body id="top"><div class="bgfx"></div><div class="grain"></div>

<nav class="nav"><div class="wrap">
  <a class="logochip" href="#top"><img src="${escapeHtml(logo)}" alt="${escapeHtml(BRAND.name)}"></a>
  <a class="btn btn-primary" href="#start" style="padding:11px 18px;font-size:14px">Get the details</a>
</div></nav>

<header class="hero">
  <div class="hero-bg"><img src="${escapeHtml(heroImg)}" alt="The ransomware threat MSPs protect their clients from" loading="eager"></div>
  <div class="orb"></div>
  <div class="wrap">
    <div class="reveal in"><span class="eyebrow"><span class="dot"></span>${escapeHtml(BRAND.name)} Partner Invitation</span></div>
    <h1 class="reveal in">${escapeHtml(hero.headline || `${company}, turn security into your next recurring revenue line`)}</h1>
    <p class="sub reveal in">${escapeHtml(hero.subhead || `${BRAND.name} helps MSPs stand up new managed-security revenue fast, resold under your own brand.`)}</p>
    <div class="cta-row reveal in"><a class="btn btn-primary" href="${escapeHtml(heroHref)}">${escapeHtml(ctaLabel)}</a><a class="btn btn-ghost" href="#stack">See the stack</a></div>
    <div class="pills reveal in"><span><b>Prevent</b></span><span><b>Detect</b></span><span><b>Recover</b></span></div>
  </div>
</header>

<div class="impact"><div class="wrap"><div class="row">
  <div class="cell reveal"><b>Prevent. Detect. Recover.</b><span>Three layers, one distributor, one offer you can sell</span></div>
  <div class="cell reveal"><b>Recurring revenue</b><span>Billable managed-security services under your brand</span></div>
  <div class="cell reveal"><b>You keep the client</b><span>Rain handles distribution and enablement behind you</span></div>
</div></div></div>

<section><div class="wrap">
  <span class="eyebrow"><span class="dot"></span>Why partner with Rain</span>
  <h2 class="h2 reveal">${escapeHtml(why.headline || `${BRAND.name} is a partner, not a license desk`)}</h2>
  <p class="lead reveal">${escapeHtml(why.para || `${BRAND.name} is a value-added distributor. You get a curated security stack plus product selection, enablement, training, and flexible licensing, so you go to market fast.`)}</p>
  <div class="bento">${bullets.slice(0, 4).map((b, i) => `<div class="tile reveal"><div class="ic">${bicons[i % bicons.length]}</div><p>${escapeHtml(b)}</p></div>`).join('')}</div>
</div></section>

<section id="stack"><div class="wrap">
  <span class="eyebrow"><span class="dot"></span>The stack</span>
  <h2 class="h2 reveal">One stack, three layers of defense</h2>
  <p class="lead reveal">${escapeHtml(did.intro || 'This is how attacks unfold: trick a person, land on a device, then go after the backups. Adopt all three, or start with the one gap you have.')}</p>
  <div class="layers">${products.map((p, i) => `<div class="layer reveal"><div class="num">0${i + 1}</div><div class="lic">${licons[i] || ICON.prevent}</div><div class="ltag">${escapeHtml(p.layer)}</div><h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.for_you)}</p></div>`).join('')}</div>
  <div class="flexnote reveal"><span class="fic">${ICON.layers}</span><div class="ft"><b>Not all or nothing.</b> Each of these stands on its own. Keep the tools your clients already rely on and add just one, or swap a single layer. Plenty of partners keep their current endpoint security and start with Macrium and NINJIO.</div></div>
</div></section>

<section><div class="wrap"><div class="tryband reveal"><div class="in">
  <div class="big">1</div>
  <div><h2>Experience Rain in action. Start with one opportunity.</h2>
  <p>You do not have to move your book of business to find out if this works. Pick a single client or deal, run the Rain stack on it, and see the results for yourself before you commit to anything.</p></div>
</div></div></div></section>

<section><div class="wrap"><div class="case">
  <div>
    <span class="eyebrow"><span class="dot"></span>The business case</span>
    <h2 class="h2 reveal">${escapeHtml(roi.headline || 'What it does for your book of business')}</h2>
    <p class="lead reveal">${escapeHtml(roi.para || 'Each layer is a billable, recurring service you can mark up. Together they make your clients stickier and set you apart on every renewal and new-logo pitch.')}</p>
    <div class="stats reveal">${stats(roiStats)}</div>
  </div>
  <div class="caseimg reveal"><img src="${escapeHtml(boardImg)}" alt="Backup and recovery strategy" loading="lazy"></div>
</div></div></section>

<section><div class="wrap">
  <span class="eyebrow"><span class="dot"></span>The full arsenal</span>
  <h2 class="h2 reveal">More than three when you are ready</h2>
  <p class="lead reveal">Start with the three that fit you today. Rain distributes a full security catalog you can grow into, all through one relationship.</p>
  <div class="arsenal">
    ${feat.map(f => `<div class="chip feat reveal"><b>${escapeHtml(f.name)}</b><span>${escapeHtml(f.tag)} &middot; featured</span></div>`).join('')}
    ${BRAND.catalog.map(x => `<div class="chip reveal"><b>${escapeHtml(x.name)}</b><span>${escapeHtml(x.cat)}</span></div>`).join('')}
  </div>
</div></section>

<section><div class="wrap"><div class="proof reveal">${escapeHtml(proof.para || `${BRAND.name} is a Seattle-area value-added distributor trusted by MSPs to identify, deploy, and scale best-in-class security.`)}</div></div></section>

<section><div class="wrap"><div class="ctaband reveal" id="cta-box">
  <h2>${escapeHtml(cta.headline || `See the numbers for ${company}`)}</h2>
  <p>${escapeHtml(cta.subhead || 'Leave your email and I will send the stack, the margins, and how onboarding works. No calendars, no obligation.')}</p>
  ${formAction ? `<form class="lead-form" id="start" method="post" action="${escapeHtml(formAction)}">
    <input type="email" name="email" required autocomplete="email" inputmode="email" placeholder="Your work email">
    <input type="tel" name="phone" autocomplete="tel" placeholder="Phone (optional, if you would rather I call)">
    <button type="submit">${escapeHtml(ctaLabel)}</button></form>
    <p class="formnote">I follow up by email. Add a phone number only if you would prefer a call.</p>`
    : `<a class="btn btn-primary" href="${escapeHtml(cta.url || '#')}">${escapeHtml(ctaLabel)}</a>`}
</div></div></section>

<footer><div class="wrap"><span>${escapeHtml(BRAND.name)} &middot; ${escapeHtml(BRAND.tagline)}</span><span>Guardz &middot; Macrium &middot; NINJIO and the full Rain catalog</span></div></footer>
${SCRIPT(!!formAction)}
</body></html>`;
}

function SCRIPT(hasForm) {
  return `<script>(function(){
var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var els=document.querySelectorAll('.reveal:not(.in)');
if(reduce||!('IntersectionObserver'in window)){els.forEach(function(e){e.classList.add('in')})}
else{var io=new IntersectionObserver(function(en){en.forEach(function(x){if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}})},{threshold:.12});els.forEach(function(e){io.observe(e)})}
${hasForm ? `var f=document.getElementById('start');if(!f)return;
f.addEventListener('submit',function(e){e.preventDefault();var btn=f.querySelector('button'),email=f.email.value.trim(),phone=f.phone.value.trim();if(!email)return;btn.disabled=true;btn.textContent='Sending...';
fetch(f.action,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({email:email,phone:phone})}).then(function(r){return r.json()}).then(function(d){
if(!d||!d.ok){btn.disabled=false;btn.textContent=${JSON.stringify('Send me the partner details')};alert((d&&d.error)||'Something went wrong. Please try again.');return}
var box=document.getElementById('cta-box');box.innerHTML='';var h=document.createElement('h2');h.textContent='Thanks. You are on the list.';var p=document.createElement('p');p.textContent='I will send the details to your email shortly'+(phone?', and can call the number you shared':'')+'.';box.appendChild(h);box.appendChild(p)}).catch(function(){f.submit()})});` : ''}
})();</script>`;
}

function shell(meta, bodyInner, title) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title><meta name="theme-color" content="#070b16"><meta name="robots" content="noindex">
<style>${fontCss(meta)}${STYLE}</style></head><body id="top"><div class="bgfx"></div><div class="grain"></div>
<nav class="nav"><div class="wrap"><a class="logochip" href="#top"><img src="${escapeHtml(BRAND.logo)}" alt="${escapeHtml(BRAND.name)}"></a></div></nav>
${bodyInner}
<footer><div class="wrap"><span>${escapeHtml(BRAND.name)} &middot; ${escapeHtml(BRAND.tagline)}</span></div></footer></body></html>`;
}

function renderThanks(company, opts = {}, meta = {}) {
  const err = opts.error;
  const heading = err ? 'Let us try that again' : 'Thanks. You are on the list.';
  const body = err ? escapeHtml(err) : `I will send the partner details to ${escapeHtml(opts.email || 'your email')} shortly${opts.phone ? ', and can call the number you shared' : ''}.`;
  return shell(meta, `<header class="hero" style="min-height:70vh"><div class="wrap"><div style="max-width:680px">
    <span class="eyebrow"><span class="dot"></span>${escapeHtml(company ? company + ' + Rain Networks' : 'Rain Networks')}</span>
    <h1 style="font-size:clamp(30px,4.4vw,52px);margin:18px 0 14px">${escapeHtml(heading)}</h1>
    <p class="sub">${body}</p>${err ? '<a class="btn btn-ghost" href="javascript:history.back()">Go back</a>' : ''}
  </div></div></header>`, BRAND.name + ' Partner Program');
}

function renderNotFound(meta = {}) {
  return shell(meta, `<header class="hero" style="min-height:78vh">
    <div class="hero-bg"><img src="${escapeHtml(BRAND.heroImg)}" alt=""></div><div class="orb"></div>
    <div class="wrap"><div style="max-width:720px">
    <span class="eyebrow"><span class="dot"></span>Rain Networks Partner Program</span>
    <h1 style="font-size:clamp(32px,5vw,60px);margin:18px 0 16px">Grow your MSP with a curated security stack</h1>
    <p class="sub">This personalized link has expired or was not found. ${escapeHtml(BRAND.name)} helps MSPs add Guardz, Macrium, and NINJIO as billable, recurring services.</p>
    <a class="btn btn-primary" href="${escapeHtml(process.env.DEFAULT_CTA_URL || 'https://rainnetworks.com/')}">Talk to Rain Networks</a>
  </div></div></header>`, BRAND.name + ' Partner Program');
}

module.exports = { renderPage, renderNotFound, renderThanks, escapeHtml, BRAND };
