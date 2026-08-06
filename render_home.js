// render_home.js — the WhatsCoolAbout.com home page. Light editorial identity,
// deliberately distinct from the dark campaign pages. The one page on the site
// that is INDEXABLE (no robots noindex). Zero em/en dashes anywhere.
//
// Centerpiece: the self-serve generator. Pick a covered solution, enter your
// company URL, and we build a custom page about why that product is cool for
// YOUR business (grounded in research), served at /<product>/1/<slug>.

const { SOLUTIONS } = require('./render_solution');

function esc(v) {
  if (v === null || v === undefined) return '';
  return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const SITE = {
  name: 'WhatsCoolAbout.com',
  publisher: 'NYN Impact',
  parent: 'WinTech Partners',
};

const STYLE = `
:root{--bg:#FAF9F6;--ink:#131316;--muted:#5a5f6b;--line:#e7e4dd;--card:#ffffff;
--accent:#4338CA;--accent2:#6D5EF3;--r:18px}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--ink);line-height:1.65;overflow-x:hidden;
font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
h1,h2,h3{margin:0;line-height:1.05;letter-spacing:-.03em;font-weight:800}
p{margin:0}
a{color:var(--accent);text-decoration:none}
.wrap{max-width:1140px;margin:0 auto;padding:0 26px}
.nav{position:sticky;top:0;z-index:50;background:rgba(250,249,246,.85);backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}
.nav .wrap{display:flex;align-items:center;justify-content:space-between;height:70px}
.wordmark{font-size:20px;font-weight:800;letter-spacing:-.02em;color:var(--ink)}
.wordmark .dot{color:var(--accent)}
.byline{font-size:12.5px;color:var(--muted)}
.byline b{color:var(--ink)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:9px;font-weight:700;font-size:15.5px;
padding:15px 26px;border-radius:12px;border:0;cursor:pointer;font-family:inherit;transition:transform .15s,box-shadow .15s,filter .15s}
.btn-primary{background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;box-shadow:0 10px 26px rgba(67,56,202,.32)}
.btn-primary:hover{transform:translateY(-2px);filter:brightness(1.06)}
.btn-primary:disabled{opacity:.6;cursor:default;transform:none}

/* hero */
.hero{padding:84px 0 70px;position:relative;overflow:hidden}
.hero::before{content:"";position:absolute;top:-320px;right:-260px;width:720px;height:720px;border-radius:50%;
background:radial-gradient(circle,rgba(109,94,243,.14),transparent 65%);pointer-events:none}
.kicker{display:inline-flex;align-items:center;gap:9px;font-size:12px;font-weight:800;letter-spacing:.16em;
text-transform:uppercase;color:var(--accent);margin-bottom:22px}
.kicker::before{content:"";width:26px;height:2px;background:var(--accent)}
.hero h1{font-size:clamp(38px,6.4vw,76px);max-width:17ch;margin-bottom:22px}
.hero h1 em{font-style:normal;background:linear-gradient(120deg,var(--accent),var(--accent2));
-webkit-background-clip:text;background-clip:text;color:transparent}
.hero .sub{font-size:clamp(17px,2vw,21px);color:var(--muted);max-width:640px;margin-bottom:40px}

/* generator card */
.gen{background:var(--card);border:1px solid var(--line);border-radius:22px;padding:30px;max-width:760px;
box-shadow:0 24px 60px rgba(19,19,22,.07)}
.gen .lbl{font-size:13px;font-weight:700;letter-spacing:.04em;color:var(--muted);text-transform:uppercase;margin-bottom:14px}
.gen .row{display:flex;flex-wrap:wrap;gap:12px}
.gen select,.gen input{flex:1 1 220px;min-width:0;padding:15px 16px;border-radius:12px;border:1.5px solid var(--line);
font-size:16px;font-family:inherit;background:#fff;color:var(--ink)}
.gen select:focus,.gen input:focus{outline:2px solid var(--accent2);outline-offset:1px;border-color:var(--accent2)}
.gen .note{font-size:13.5px;color:var(--muted);margin-top:14px}
.gen .err{display:none;font-size:14px;color:#b42318;margin-top:12px;font-weight:600}

/* progress */
.prog{display:none;margin-top:8px}
.prog .stage{display:flex;align-items:center;gap:14px;font-size:17px;font-weight:700}
.prog .orb{width:20px;height:20px;border-radius:50%;border:3px solid var(--accent2);border-top-color:transparent;
animation:spin 1s linear infinite;flex:0 0 auto}
@keyframes spin{to{transform:rotate(360deg)}}
.prog .bar{height:6px;background:#eeece6;border-radius:99px;margin:18px 0 10px;overflow:hidden}
.prog .fill{height:100%;width:22%;border-radius:99px;background:linear-gradient(90deg,var(--accent),var(--accent2));
transition:width 1.2s ease}
.prog .hint{font-size:14px;color:var(--muted)}
.prog .mail{margin-top:22px;padding-top:20px;border-top:1px solid var(--line)}
.prog .mail .row{display:flex;flex-wrap:wrap;gap:10px}
.prog .mail input{flex:1 1 220px;min-width:0;padding:13px 15px;border-radius:11px;border:1.5px solid var(--line);font-size:15px;font-family:inherit}
.prog .mail button{background:var(--ink);color:#fff;border:0;border-radius:11px;padding:13px 20px;font-weight:700;font-size:15px;cursor:pointer;font-family:inherit}
.prog .mail .lbl2{font-size:14px;color:var(--muted);margin-bottom:10px}
.prog .mail .ok{display:none;font-size:14.5px;font-weight:700;color:#067647;margin-top:10px}

/* solutions grid */
section{padding:80px 0}
.h2{font-size:clamp(28px,4vw,46px);margin-bottom:12px}
.lead{color:var(--muted);font-size:18.5px;max-width:640px}
.grouplbl{font-size:12.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin:44px 0 18px}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
@media(max-width:920px){.grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:600px){.grid{grid-template-columns:1fr}}
.card{position:relative;background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:24px;
overflow:hidden;transition:transform .18s,box-shadow .18s;display:flex;flex-direction:column;gap:8px}
.card:hover{transform:translateY(-5px);box-shadow:0 20px 44px rgba(19,19,22,.09)}
.card::before{content:"";position:absolute;inset:0 0 auto 0;height:4px;background:var(--pc,#888)}
.card .chip{width:44px;height:44px;border-radius:12px;background:var(--pt,#eee);display:flex;align-items:center;justify-content:center;
font-weight:800;font-size:18px;color:var(--pc,#333);margin-bottom:6px}
.card h3{font-size:20px}
.card p{font-size:14.5px;color:var(--muted);flex:1}
.card .acts{display:flex;gap:14px;margin-top:12px;align-items:center}
.card .mk{font-size:14.5px;font-weight:700;color:var(--pc,var(--accent));cursor:pointer;background:none;border:0;padding:0;font-family:inherit}
.card .mk::after{content:" \\2192"}
.card .rd{font-size:13.5px;color:var(--muted)}
.card.teaser{border-style:dashed;background:transparent;justify-content:center;align-items:flex-start}
.card.teaser h3{color:var(--muted)}

/* about band */
.about{background:#131316;color:#f4f3ef;border-radius:26px;padding:56px 40px}
.about h2{color:#fff;font-size:clamp(24px,3.2vw,36px);margin-bottom:14px;max-width:22ch}
.about p{color:#b9b7ae;font-size:17px;max-width:760px}
.about .fine{font-size:13px;color:#8b897f;margin-top:26px}
@media(max-width:640px){.about{padding:40px 24px}}

footer{border-top:1px solid var(--line);padding:36px 0 56px;color:var(--muted);font-size:14px}
footer .wrap{display:flex;flex-wrap:wrap;gap:10px;justify-content:space-between}
.reveal{opacity:0;transform:translateY(22px);transition:opacity .7s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1)}
.reveal.in{opacity:1;transform:none}
@media(prefers-reduced-motion:reduce){.reveal{opacity:1;transform:none;transition:none}.prog .orb{animation:none}html{scroll-behavior:auto}}
`;

const PHASES = {
  research: { pct: 30, text: 'Researching your company', hint: 'We are reading what your business puts out into the world. If we have seen you before this is quick; if not, give us a few minutes to do it properly.' },
  writing: { pct: 65, text: 'Writing your page', hint: 'Connecting what this product actually does to what your business actually is.' },
  building: { pct: 88, text: 'Building and publishing', hint: 'Rendering your page. Seconds away.' },
};

function renderHome() {
  const products = Object.entries(SOLUTIONS);
  const options = products.map(([k, s]) =>
    `<option value="${esc(k)}">${esc(s.name)} (${esc(s.category)})</option>`).join('');
  const cards = products.map(([k, s]) => `
    <div class="card reveal" style="--pc:${esc(s.theme.primary)};--pt:${esc(s.theme.primary)}1a">
      <div class="chip">${esc(s.name[0])}</div>
      <h3>${esc(s.name)}</h3>
      <p>${esc(s.category)}. ${esc(s.tagline)}</p>
      <div class="acts">
        <button class="mk" data-product="${esc(k)}" type="button">Make it about us</button>
        <a class="rd" href="/1/s/${esc(k)}">Read our take</a>
      </div>
    </div>`).join('');

  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(SITE.name)} | Cool technology, explained for your business</title>
<meta name="description" content="${esc(SITE.publisher)} surfaces cool technology that is not getting the attention it deserves, and shows you why it matters for your business specifically.">
<meta property="og:title" content="${esc(SITE.name)}">
<meta property="og:description" content="Pick a technology, tell us your website, and we will build a page about why it is cool for your business.">
<meta name="theme-color" content="#FAF9F6">
<style>${STYLE}</style></head><body id="top">

<nav class="nav"><div class="wrap">
  <span class="wordmark">WhatsCoolAbout<span class="dot">.com</span></span>
  <span class="byline">brought to you by <b>${esc(SITE.publisher)}</b></span>
</div></nav>

<header class="hero"><div class="wrap">
  <span class="kicker">Independent. Curious. On your side.</span>
  <h1>There is a lot of <em>cool technology</em> nobody is telling you about.</h1>
  <p class="sub">We find the tools that deserve more attention, explain what makes them cool, and help businesses and channel partners get introduced to the right vendors. No vendor wrote any of this.</p>

  <div class="gen" id="gen">
    <div id="genform">
      <div class="lbl">See why it is cool for YOUR business</div>
      <form id="wcaform">
        <div class="row">
          <select id="product" required>${options}</select>
          <input id="domain" type="text" placeholder="yourcompany.com" autocomplete="url" required>
          <button class="btn btn-primary" type="submit">Show me</button>
        </div>
      </form>
      <p class="note">If we already know your company this takes seconds. If we have to research you fresh, it can take a few minutes, and it is worth it.</p>
      <p class="err" id="generr"></p>
    </div>

    <div class="prog" id="prog">
      <div class="stage"><span class="orb"></span><span id="stagetext">Starting</span></div>
      <div class="bar"><div class="fill" id="fill"></div></div>
      <p class="hint" id="stagehint">Kicking things off.</p>
      <div class="mail" id="mailbox">
        <div class="lbl2">Do not feel like waiting? We will send you the link.</div>
        <div class="row">
          <input id="notifyemail" type="email" placeholder="you@yourcompany.com" autocomplete="email">
          <button type="button" id="notifybtn">Email me the link</button>
        </div>
        <div class="ok" id="notifyok">Got it. We will send your page over.</div>
      </div>
    </div>
  </div>
</div></header>

<section id="solutions"><div class="wrap">
  <h2 class="h2 reveal">What we are covering right now</h2>
  <p class="lead reveal">Every one of these earned its spot. Read our take, or better: make it about your business.</p>
  <div class="grouplbl reveal">Security and IT</div>
  <div class="grid">
    ${cards}
    <div class="card teaser reveal"><h3>More topics on the way</h3><p>AI tooling and more. We keep digging.</p></div>
  </div>
</div></section>

<section><div class="wrap"><div class="about reveal">
  <h2>Why this site exists</h2>
  <p>Great technology loses to loud technology all the time. ${esc(SITE.publisher)}, a division of ${esc(SITE.parent)}, is an independent publisher: we pick technologies we think deserve attention, explain them in plain language, and when a business wants to go further we make the introduction to the right vendor or distributor. If you leave your email anywhere on this site, it comes to us and nobody else.</p>
  <p class="fine">Product names and logos are trademarks of their respective owners. ${esc(SITE.publisher)} is independent and is not affiliated with or endorsed by any vendor listed.</p>
</div></div></section>

<footer><div class="wrap">
  <span><b>${esc(SITE.name)}</b>, brought to you by ${esc(SITE.publisher)}, a division of ${esc(SITE.parent)}.</span>
  <span><a href="#solutions">Covered solutions</a></span>
</div></footer>

<script>
(function(){
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var els=document.querySelectorAll('.reveal:not(.in)');
  if(reduce||!('IntersectionObserver'in window)){els.forEach(function(e){e.classList.add('in')})}
  else{var io=new IntersectionObserver(function(en){en.forEach(function(x){if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}})},{threshold:.12});els.forEach(function(e){io.observe(e)})}

  var PHASES=${JSON.stringify(PHASES)};
  var form=document.getElementById('wcaform'), prog=document.getElementById('prog'),
      genform=document.getElementById('genform'), err=document.getElementById('generr'),
      stagetext=document.getElementById('stagetext'), stagehint=document.getElementById('stagehint'),
      fill=document.getElementById('fill');
  var jobId=null, retried=false, timer=null, deadline=0;

  document.querySelectorAll('.mk').forEach(function(b){
    b.addEventListener('click',function(){
      document.getElementById('product').value=b.getAttribute('data-product');
      document.getElementById('gen').scrollIntoView({behavior:reduce?'auto':'smooth'});
      setTimeout(function(){document.getElementById('domain').focus()},reduce?0:450);
    });
  });

  function showErr(msg){err.textContent=msg;err.style.display='block';}
  function setPhase(p){var ph=PHASES[p]||PHASES.research;stagetext.textContent=ph.text;stagehint.textContent=ph.hint;fill.style.width=ph.pct+'%';}
  function fail(msg){clearInterval(timer);stagetext.textContent='That did not work';document.querySelector('.prog .orb').style.display='none';
    fill.style.width='100%';fill.style.background='#b42318';
    stagehint.textContent=msg||'Something went wrong on our side. Leave your email above and we will build it and send it over, or try again in a few minutes.';}

  function poll(){
    fetch('/wca/status?jobId='+encodeURIComponent(jobId)).then(function(r){return r.json()}).then(function(d){
      if(d.status==='done'&&d.url){clearInterval(timer);fill.style.width='100%';stagetext.textContent='Done. Taking you there.';
        setTimeout(function(){location.href=d.url},600);return;}
      if(d.status==='error'){fail();return;}
      if(d.status==='unknown'){ if(!retried){retried=true;clearInterval(timer);start();} else {fail();} return;}
      if(d.phase)setPhase(d.phase);
      if(Date.now()>deadline)fail('This is taking longer than expected. Leave your email above and we will send the link when it is ready.');
    }).catch(function(){/* transient; next tick */});
  }

  function start(){
    var product=document.getElementById('product').value;
    var domain=document.getElementById('domain').value;
    fetch('/wca/generate',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({product:product,domain:domain})})
    .then(function(r){return r.json().then(function(d){return{ok:r.ok,status:r.status,d:d}})})
    .then(function(x){
      if(x.ok&&x.d.url){location.href=x.d.url;return;}
      if(x.ok&&x.d.jobId){jobId=x.d.jobId;genform.style.display='none';prog.style.display='block';
        setPhase('research');deadline=Date.now()+360000;timer=setInterval(poll,3000);return;}
      if(x.status===429){showErr('We are a little busy right now. Give it a few minutes and try again.');return;}
      showErr((x.d&&x.d.error)||'That did not look like a website address. Try something like yourcompany.com.');
    })
    .catch(function(){showErr('Could not reach the server. Try again in a moment.');});
  }

  form.addEventListener('submit',function(e){e.preventDefault();err.style.display='none';start();});

  document.getElementById('notifybtn').addEventListener('click',function(){
    var email=document.getElementById('notifyemail').value.trim();
    if(!email)return;
    fetch('/wca/notify',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({jobId:jobId,email:email})})
    .then(function(r){if(r.ok){document.getElementById('notifyok').style.display='block';}})
    .catch(function(){});
  });
})();
</script>
</body></html>`;
}

module.exports = { renderHome };
