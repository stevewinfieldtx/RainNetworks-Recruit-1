// Generic PRODUCT landing pages, published by Rain Networks.
//
// Purpose: tell an MSP "you need this product, here is why it is great." If
// they want more, they leave an email and it comes to us. Nothing routes the
// reader to a vendor or distributor.
//
// Each product gets its OWN vendor-flavored palette AND its own structural
// layout (six archetypes), so Macrium and ESET do not read as the same template
// in different colors. Zero em/en dashes.

function esc(v) {
  if (v === null || v === undefined) return '';
  return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const PUBLISHER = { name: 'Rain Networks' };

const I = {
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5c0 4.6-3 7.7-7 9-4-1.3-7-4.4-7-9V6z"/><path d="M9 12l2 2 4-4"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M13 3L5 13h6l-1 8 8-10h-6z"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>',
  restore: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4v6h6"/><path d="M4 10a8 8 0 1 1 2 6"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M17 11a3 3 0 1 0-1.5-5.6M18 20a6 6 0 0 0-3-5.2"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
  cloud: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 18a4 4 0 0 1 0-8 5.5 5.5 0 0 1 10.5 1.5A3.5 3.5 0 0 1 17 18z"/></svg>',
  monitor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>',
  dollar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
  layers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
  patch: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v6M12 15v6M3 12h6M15 12h6"/><circle cx="12" cy="12" r="3"/></svg>',
};

// theme.mode drives light vs dark. layout picks the structural archetype.
const SOLUTIONS = {
  guardz: {
    name: 'Guardz', category: 'AI-native security built for MSPs', official: 'https://guardz.com/',
    layout: 'bento', theme: { mode: 'dark', primary: '#6D28D9', accent: '#A78BFA', deep: '#150B2E', tint: '#241247' },
    heroPrompt: 'Abstract AI cybersecurity visualization, neural threat detection mesh protecting endpoints identities email and cloud, glowing violet and lavender energy nodes on deep purple black background, futuristic premium enterprise tech, volumetric light, high detail, no text, no words, no logos',
    tagline: 'One console. Endpoints, identity, email, and cloud.',
    headline: 'The security platform that was actually built for MSPs',
    sub: 'Most security tools were built for one enterprise and bolted onto multi-tenant later. Guardz starts from the MSP reality: many clients, small teams, and no room for noise.',
    why: [
      { icon: I.layers, t: 'Four attack surfaces, one pane', b: 'Endpoints, identity, email, and cloud data in a single multi-tenant console instead of four dashboards and four bills.' },
      { icon: I.bolt, t: 'AI that filters the noise', b: 'Detection and prioritized response so a two-person team is not drowning in alerts that do not matter.' },
      { icon: I.eye, t: 'Reports clients actually read', b: 'Client-ready risk and ROI reporting that shows the value you deliver, which is how renewals get easy.' },
      { icon: I.dollar, t: 'Priced to resell', b: 'Per-seat economics that leave real margin when you package it as your own managed security service.' },
    ],
    does: ['Multi-tenant MSP console', 'Endpoint detection and response', 'Identity and account protection', 'Email and phishing defense', 'Cloud data posture', 'Client-facing risk reports'],
    cta: { h: 'Want more information?', s: 'Leave your work email and I will send it over.' },
  },
  macrium: {
    name: 'Macrium', category: 'Backup, imaging and rapid recovery', official: 'https://www.macrium.com/',
    layout: 'split', theme: { mode: 'dark', primary: '#003B71', accent: '#009FE3', deep: '#001B36', tint: '#00294F' },
    heroPrompt: 'Cinematic abstract enterprise backup and disaster recovery, streams of glowing data converging into a resilient shield, server and storage forms being restored, deep navy blue with bright cyan highlights, subtle grid and particles, premium corporate tech, dramatic lighting, high detail, no text, no words, no logos',
    tagline: 'When prevention fails, recovery is the whole business.',
    headline: 'The backup your clients will judge you on',
    sub: 'Nobody thanks you for a backup that ran. They judge you on the restore. Macrium is built around getting a client back fast, on any hardware, even after ransomware.',
    why: [
      { icon: I.restore, t: 'Recovery measured in minutes', b: 'Rapid image recovery and instant virtualization mean a downed client is billable again before the day is lost.' },
      { icon: I.shield, t: 'Ransomware-resistant images', b: 'Protected, encrypted images so an attacker who encrypts production does not take your last line of defense with it.' },
      { icon: I.layers, t: 'Restore to different hardware', b: 'The server died and the replacement is nothing like it. Restore anyway, without rebuilding from scratch.' },
      { icon: I.monitor, t: 'Every client, one dashboard', b: 'MultiSite pulls all your clients into one view, so one tech can confirm the whole book is protected.' },
    ],
    does: ['Windows server and workstation imaging', 'Rapid clone and image recovery', 'Instant virtualization of a backup', 'Restore to dissimilar hardware', 'MultiSite central monitoring', 'Encryption and ransomware protection'],
    cta: { h: 'Want more information?', s: 'Leave your work email and I will send it over.' },
  },
  ninjio: {
    name: 'NINJIO', category: 'Security awareness training people actually watch', official: 'https://ninjio.com/',
    layout: 'editorial', theme: { mode: 'dark', primary: '#F26522', accent: '#FFB347', deep: '#171310', tint: '#2A1E15' },
    heroPrompt: 'Bold cinematic illustration of the human layer of cybersecurity, a person at a laptop with a deceptive phishing email materializing as shadow, warm orange and amber light against deep charcoal, dramatic graphic novel lighting, premium editorial style, high detail, no text, no words, no logos',
    tagline: 'The attack starts with a person, not a firewall.',
    headline: 'Training your clients will not sleep through',
    sub: 'Annual compliance training does not change behavior. Short, story-driven episodes based on real breaches do, because people remember a story and forget a slide deck.',
    why: [
      { icon: I.users, t: 'Three to four minutes, once a month', b: 'Short episodes built on real incidents. High completion rates because it does not feel like punishment.' },
      { icon: I.shield, t: 'Behavior change, not checkbox', b: 'The point is that the receptionist hesitates on the wire transfer email. That is what actually stops the loss.' },
      { icon: I.dollar, t: 'Recurring seats, clean margin', b: 'Per-seat subscription across every client you support, which is exactly the kind of revenue an MSP wants.' },
      { icon: I.mail, t: 'Phishing simulation included', b: 'Simulate, measure, and show a client their risk trend over time in a report that justifies the spend.' },
    ],
    does: ['Story-based micro training', 'Monthly episode cadence', 'Phishing simulation', 'Completion and risk reporting', 'Compliance-friendly records', 'White-label or co-brand'],
    cta: { h: 'Want more information?', s: 'Leave your work email and I will send it over.' },
  },
  bitdefender: {
    name: 'Bitdefender', category: 'Endpoint protection with the detection engine to back it up', official: 'https://www.bitdefender.com/business/',
    layout: 'immersive', theme: { mode: 'dark', primary: '#C1121F', accent: '#FF4D5A', deep: '#120607', tint: '#2A0C0F' },
    heroPrompt: 'Dramatic abstract cybersecurity defense visualization, layered protective barriers intercepting incoming attack vectors, crimson red energy against near black background, sharp geometric shields, cinematic volumetric lighting, premium enterprise security aesthetic, high detail, no text, no words, no logos',
    tagline: 'The engine that keeps winning the independent tests.',
    headline: 'Stop explaining why something got through',
    sub: 'Detection rate is not a marketing stat when it is your client and your reputation. Bitdefender consistently sits at the top of independent testing, and that is the entire argument.',
    why: [
      { icon: I.shield, t: 'Prevention that actually prevents', b: 'Layered machine learning and behavioral analysis that stops threats before you are writing an incident report.' },
      { icon: I.eye, t: 'EDR without a SOC team', b: 'Visibility and guided response so a lean team can investigate without hiring analysts you cannot bill for.' },
      { icon: I.monitor, t: 'Multi-tenant by design', b: 'Manage every client from one console with policies you set once and roll out everywhere.' },
      { icon: I.bolt, t: 'Light on the endpoint', b: 'Protection your clients do not notice, which means fewer calls telling you the computer got slow.' },
    ],
    does: ['Layered endpoint prevention', 'Endpoint detection and response', 'Ransomware mitigation', 'Multi-tenant management', 'Risk and patch visibility', 'Server and workstation coverage'],
    cta: { h: 'Want more information?', s: 'Leave your work email and I will send it over.' },
  },
  eset: {
    name: 'ESET', category: 'Endpoint security with a famously light footprint', official: 'https://www.eset.com/us/business/',
    layout: 'panel', theme: { mode: 'light', primary: '#0B7EC8', accent: '#00A5A5', deep: '#063A5C', tint: '#EAF4FB' },
    heroPrompt: 'Clean modern abstract technology visualization of efficient lightweight security, precise geometric layers and flowing data currents, bright azure blue and teal on clean light background, minimal elegant corporate design, soft studio lighting, high detail, no text, no words, no logos',
    tagline: 'Protection that does not tax the machine.',
    headline: 'Security your clients never complain about',
    sub: 'Half the endpoint complaints an MSP fields are performance, not infection. ESET has built its reputation on a small footprint and a low false-positive rate, which quietly saves you tickets.',
    why: [
      { icon: I.bolt, t: 'Small footprint, older hardware', b: 'Runs well on the aging machines your SMB clients are still using, so protection does not force a refresh.' },
      { icon: I.shield, t: 'Low false positives', b: 'Fewer bogus detections means fewer interruptions to your clients and fewer support calls for you.' },
      { icon: I.monitor, t: 'One console, every tenant', b: 'ESET PROTECT gives you central management and reporting across all the clients you support.' },
      { icon: I.lock, t: 'Layers you can grow into', b: 'Add encryption, mail security, and cloud sandboxing as a client matures, without changing platforms.' },
    ],
    does: ['Endpoint antivirus and antimalware', 'Central multi-tenant console', 'Ransomware shield', 'Full disk encryption option', 'Cloud sandbox analysis', 'Server and mobile coverage'],
    cta: { h: 'Want more information?', s: 'Leave your work email and I will send it over.' },
  },
  heimdal: {
    name: 'Heimdal', category: 'Threat prevention and patching in one platform', official: 'https://heimdalsecurity.com/',
    layout: 'techdark', theme: { mode: 'dark', primary: '#2D3FE7', accent: '#7C8CFF', deep: '#0A0D26', tint: '#151A45' },
    heroPrompt: 'Abstract network defense visualization, DNS traffic filtering and automated patching represented as flowing indigo blue data streams intercepted by geometric gates, deep midnight blue background with electric blue accents, technical premium enterprise aesthetic, high detail, no text, no words, no logos',
    tagline: 'Most breaches walk through a door you forgot to close.',
    headline: 'Patch the holes before anyone tests them',
    sub: 'Unpatched software and bad DNS traffic account for an enormous share of real incidents. Heimdal automates both, which removes the most boring and most dangerous part of your job.',
    why: [
      { icon: I.patch, t: 'Automated patch management', b: 'Third-party and OS patching handled automatically, closing the vulnerability window without a maintenance weekend.' },
      { icon: I.shield, t: 'DNS traffic filtering', b: 'Blocks malicious domains and command-and-control traffic before anything lands on the endpoint.' },
      { icon: I.lock, t: 'Privilege access control', b: 'Grant and revoke admin rights on demand, so standing local admin stops being your biggest liability.' },
      { icon: I.layers, t: 'One vendor, many modules', b: 'Prevention, patching, and privilege in a single platform instead of three consoles and three renewals.' },
    ],
    does: ['Automated OS and third-party patching', 'DNS and traffic filtering', 'Privileged access management', 'Ransomware encryption protection', 'Email fraud prevention', 'Unified multi-tenant dashboard'],
    cta: { h: 'Want more information?', s: 'Leave your work email and I will send it over.' },
  },
  proofpoint: {
    name: 'Proofpoint', category: 'Email security for the attacks that actually cost money', official: 'https://www.proofpoint.com/us',
    layout: 'editorial', theme: { mode: 'light', primary: '#0B4EA2', accent: '#00A0DF', deep: '#062A57', tint: '#EAF2FB' },
    heroPrompt: 'Sophisticated abstract email security visualization, a stream of messages passing through an intelligent filtering barrier, deceptive messages isolated and neutralized, deep blue and cyan on clean light gradient, elegant corporate enterprise design, precise geometry, high detail, no text, no words, no logos',
    tagline: 'Ninety percent of attacks still start in the inbox.',
    headline: 'The wire transfer that never should have happened',
    sub: 'Business email compromise does not trip antivirus. It is a convincing message to a person with payment authority, and it is the single most expensive thing that happens to small businesses.',
    why: [
      { icon: I.mail, t: 'Stops BEC and impersonation', b: 'Catches the executive-impersonation and vendor-fraud messages that get past standard filtering.' },
      { icon: I.users, t: 'Shows you who is targeted', b: 'Identifies which people at a client are actually being attacked, so you can put controls where the risk is.' },
      { icon: I.shield, t: 'URL and attachment defense', b: 'Rewrites and detonates links and files, including the ones that turn malicious after delivery.' },
      { icon: I.eye, t: 'Evidence for the client', b: 'Reporting that shows exactly what was blocked, which makes the renewal conversation short.' },
    ],
    does: ['Advanced email filtering', 'Business email compromise defense', 'URL rewriting and sandboxing', 'Impersonation protection', 'Targeted attack visibility', 'Data loss prevention options'],
    cta: { h: 'Want more information?', s: 'Leave your work email and I will send it over.' },
  },
  pulseway: {
    name: 'Pulseway', category: 'Remote monitoring and management from your phone', official: 'https://www.pulseway.com/',
    layout: 'bento', theme: { mode: 'dark', primary: '#E8721C', accent: '#FFA24C', deep: '#161009', tint: '#2B1D0E' },
    heroPrompt: 'Dynamic abstract visualization of mobile remote IT management, server infrastructure monitored and controlled from a handheld device, glowing amber and orange signal paths across dark slate background, energetic modern tech aesthetic, dramatic lighting, high detail, no text, no words, no logos',
    tagline: 'Fix it from the parking lot.',
    headline: 'The server went down while you were at dinner',
    sub: 'Pulseway was built mobile first, which sounds like a gimmick until a client server alerts at 8pm and you resolve it from your phone before anyone notices.',
    why: [
      { icon: I.bolt, t: 'Genuinely mobile first', b: 'Full remote control and remediation from a phone, not a stripped-down companion app that only shows alerts.' },
      { icon: I.monitor, t: 'Monitoring that acts', b: 'Automated responses to common conditions so routine problems fix themselves before a ticket exists.' },
      { icon: I.patch, t: 'Patching and automation', b: 'Policy-driven patching and scripted workflows across every endpoint you manage.' },
      { icon: I.dollar, t: 'Priced for smaller shops', b: 'Serious RMM capability without the enterprise contract, which matters when you are still growing.' },
    ],
    does: ['Mobile remote monitoring and control', 'Automated remediation', 'Patch management', 'Custom scripting and automation', 'Server and workstation monitoring', 'Alerting and reporting'],
    cta: { h: 'Want more information?', s: 'Leave your work email and I will send it over.' },
  },
  redstor: {
    name: 'Redstor', category: 'Cloud backup with instant data access', official: 'https://www.redstor.com/',
    layout: 'immersive', theme: { mode: 'dark', primary: '#C4007A', accent: '#FF5FB8', deep: '#1A0416', tint: '#320B29',
      },
    heroPrompt: 'Abstract cloud data protection visualization, data streaming instantly from cloud storage back to devices, magenta and pink luminous flows against deep plum black background, elegant modern SaaS aesthetic, soft glow and depth, high detail, no text, no words, no logos',
    tagline: 'Access the data before the restore finishes.',
    headline: 'Backup for everything your clients actually use',
    sub: 'Servers are the easy part. The hard part is Microsoft 365, Google Workspace, and the SaaS data your clients assume somebody is protecting. Usually nobody is.',
    why: [
      { icon: I.cloud, t: 'Covers SaaS, not just servers', b: 'Microsoft 365, Google Workspace, and endpoints alongside traditional infrastructure, from one place.' },
      { icon: I.bolt, t: 'Stream data instantly', b: 'Get to critical files immediately while the full restore runs in the background, so the client keeps working.' },
      { icon: I.layers, t: 'One console, all clients', b: 'A single multi-tenant view of every backup you are responsible for, with no appliance to babysit.' },
      { icon: I.dollar, t: 'No hardware to sell first', b: 'Cloud-native means you can start protecting a client this week without a capital purchase.' },
    ],
    does: ['Microsoft 365 backup', 'Google Workspace backup', 'Server and endpoint backup', 'Instant data streaming', 'Multi-tenant management', 'Ransomware-aware recovery'],
    cta: { h: 'Want more information?', s: 'Leave your work email and I will send it over.' },
  },
  trustifi: {
    name: 'Trustifi', category: 'Email encryption people will actually use', official: 'https://trustifi.com/',
    layout: 'panel', theme: { mode: 'dark', primary: '#0E9C8B', accent: '#4FE0CB', deep: '#04211E', tint: '#0A3833' },
    heroPrompt: 'Abstract secure email encryption visualization, a message transforming into protected encrypted form and traveling safely, luminous teal and aquamarine cryptographic patterns on deep teal black background, refined modern security aesthetic, elegant depth, high detail, no text, no words, no logos',
    tagline: 'Encryption fails when it is inconvenient.',
    headline: 'Compliance that does not need a training class',
    sub: 'Your healthcare and finance clients are required to encrypt. Most encryption products are so awkward that people route around them, which leaves you holding the compliance risk.',
    why: [
      { icon: I.lock, t: 'One click to encrypt', b: 'Sends encrypted from the tools people already use, so nobody invents a workaround that breaks compliance.' },
      { icon: I.mail, t: 'Inbound protection too', b: 'Phishing and malware filtering on the way in, not just encryption on the way out.' },
      { icon: I.shield, t: 'Built for regulated clients', b: 'HIPAA, FINRA, and similar obligations handled with the audit trail to prove it happened.' },
      { icon: I.eye, t: 'Track what you sent', b: 'See when a message was opened, recall it, and set expiry, which clients find genuinely useful.' },
    ],
    does: ['One-click outbound encryption', 'Inbound phishing and malware defense', 'Data loss prevention', 'HIPAA and FINRA support', 'Message tracking and recall', 'Microsoft 365 and Gmail integration'],
    cta: { h: 'Want more information?', s: 'Leave your work email and I will send it over.' },
  },
  vipre: {
    name: 'VIPRE', category: 'Endpoint and email security without the enterprise tax', official: 'https://vipre.com/',
    layout: 'techdark', theme: { mode: 'light', primary: '#5B9E1F', accent: '#8DC63F', deep: '#2E5410', tint: '#F0F7E8' },
    heroPrompt: 'Clean abstract layered security visualization, endpoint and email protection working together as interlocking protective planes, vivid green and lime accents on bright clean background, modern approachable enterprise design, crisp studio lighting, high detail, no text, no words, no logos',
    tagline: 'Good security that a small business will pay for.',
    headline: 'The stack that fits an actual SMB budget',
    sub: 'Not every client will fund a premium security stack. VIPRE covers endpoint and email properly at a price a fifteen-person company will approve, which means they get protected instead of deferring.',
    why: [
      { icon: I.dollar, t: 'Priced for the real client', b: 'Solid protection at a number your smaller clients will actually sign, so coverage stops being a maybe.' },
      { icon: I.layers, t: 'Endpoint and email together', b: 'The two surfaces that matter most for an SMB, from one vendor and one renewal.' },
      { icon: I.monitor, t: 'Simple to run', b: 'A console that does not need a specialist, which keeps your delivery cost per client low.' },
      { icon: I.shield, t: 'Straightforward protection', b: 'Antivirus, antimalware, and email filtering that does the job without a deployment project.' },
    ],
    does: ['Endpoint antivirus and antimalware', 'Email security and filtering', 'Ransomware protection', 'Central management console', 'Server protection', 'Reporting for clients'],
    cta: { h: 'Want more information?', s: 'Leave your work email and I will send it over.' },
  },
};

// ── shared CSS core, adapts to light/dark ───────────────────────────────────
const CORE = t => {
  const dark = t.mode === 'dark';
  const bg = dark ? t.deep : '#ffffff';
  const ink = dark ? '#f2f6fb' : '#101828';
  const muted = dark ? 'rgba(233,240,250,.68)' : '#51607a';
  const line = dark ? 'rgba(255,255,255,.12)' : '#e3e8ef';
  const panel = dark ? 'rgba(255,255,255,.05)' : '#f7f9fc';
  return `
:root{--primary:${t.primary};--accent:${t.accent};--deep:${t.deep};--tint:${t.tint};
--bg:${bg};--ink:${ink};--muted:${muted};--line:${line};--panel:${panel}}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--ink);overflow-x:hidden;line-height:1.6;
font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
h1,h2,h3{margin:0;line-height:1.06;letter-spacing:-.025em;font-weight:800}
p{margin:0}
a{color:var(--accent);text-decoration:none}
img{max-width:100%;display:block}
.wrap{max-width:1160px;margin:0 auto;padding:0 26px}
.nav{position:sticky;top:0;z-index:50;backdrop-filter:blur(12px);background:${dark ? 'rgba(0,0,0,.35)' : 'rgba(255,255,255,.8)'};border-bottom:1px solid var(--line)}
.nav .wrap{display:flex;align-items:center;justify-content:space-between;height:68px}
.brandmark{font-size:19px;font-weight:800;letter-spacing:-.02em;color:var(--ink)}
.btn{display:inline-flex;align-items:center;gap:9px;font-weight:700;font-size:15px;padding:14px 24px;border-radius:12px;border:0;cursor:pointer;font-family:inherit;
transition:transform .16s,filter .16s,box-shadow .16s}
.btn-primary{background:linear-gradient(180deg,var(--accent),var(--primary));color:#fff;box-shadow:0 12px 30px ${t.primary}55}
.btn-primary:hover{transform:translateY(-2px);filter:brightness(1.07)}
.btn-ghost{background:${dark ? 'rgba(255,255,255,.07)' : '#fff'};color:var(--ink);border:1px solid var(--line)}
.btn-ghost:hover{transform:translateY(-2px)}
.eyebrow{display:inline-flex;align-items:center;gap:9px;font-size:11.5px;font-weight:800;letter-spacing:.17em;text-transform:uppercase;
color:var(--accent);background:${t.primary}1c;border:1px solid ${t.accent}44;padding:7px 14px;border-radius:999px}
section{padding:92px 0;position:relative}
.h2{font-size:clamp(27px,3.7vw,44px);margin-bottom:16px}
.lead{color:var(--muted);font-size:19px;max-width:660px}
.wordmark{font-size:15px;font-weight:800;letter-spacing:.02em;color:var(--accent);text-transform:uppercase}
.icbox{width:44px;height:44px;color:var(--accent);margin-bottom:14px}
.icbox svg{width:100%;height:100%}
.reveal{opacity:0;transform:translateY(24px);transition:opacity .75s cubic-bezier(.16,1,.3,1),transform .75s cubic-bezier(.16,1,.3,1)}
.reveal.in{opacity:1;transform:none}
.ctaband{position:relative;overflow:hidden;border-radius:28px;padding:62px 34px;text-align:center;
background:linear-gradient(125deg,var(--primary),var(--accent));border:1px solid rgba(255,255,255,.18)}
.ctaband::before{content:"";position:absolute;inset:0;background:radial-gradient(45% 80% at 82% 0,rgba(255,255,255,.28),transparent 55%)}
.ctaband h2,.ctaband p{position:relative;color:#fff}
.ctaband p{max-width:560px;margin:14px auto 28px;font-size:18px;opacity:.93}
.lead-form{position:relative;display:flex;flex-wrap:wrap;gap:11px;justify-content:center;max-width:620px;margin:0 auto}
.lead-form input{flex:1 1 240px;min-width:0;padding:16px 17px;border-radius:12px;border:0;font-size:16px;font-family:inherit;background:#fff;color:#101828}
.lead-form button{flex:1 1 100%;background:${t.deep};color:#fff;font-weight:800;border:0;padding:16px;border-radius:12px;font-size:16px;font-family:inherit;cursor:pointer;transition:transform .16s}
.lead-form button:hover{transform:translateY(-2px)}
@media(min-width:560px){.lead-form button{flex:0 0 auto}}
footer{border-top:1px solid var(--line);padding:38px 0 58px;color:var(--muted);font-size:13px}
footer .disc{max-width:880px;line-height:1.65}
@media(prefers-reduced-motion:reduce){.reveal{opacity:1;transform:none;transition:none}html{scroll-behavior:auto}}
`;
};

// ── layout-specific CSS ──────────────────────────────────────────────────────
const LAYOUT_CSS = {
  bento: t => `
.hero-b{padding:70px 0 40px;position:relative}
.hero-b h1{font-size:clamp(36px,6vw,74px);max-width:14ch;margin:22px 0 20px}
.hero-b .sub{font-size:clamp(17px,2vw,21px);color:var(--muted);max-width:620px;margin-bottom:30px}
.bento{display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:190px;gap:16px;margin-top:14px}
.bento .cell{background:var(--panel);border:1px solid var(--line);border-radius:20px;padding:26px;overflow:hidden;position:relative;transition:transform .2s,border-color .2s}
.bento .cell:hover{transform:translateY(-5px);border-color:${t.accent}70}
.bento .img{grid-column:span 2;grid-row:span 2;padding:0}
.bento .img img{width:100%;height:100%;object-fit:cover}
.bento .wide{grid-column:span 2}
.bento .cell h3{font-size:19px;margin-bottom:8px}
.bento .cell p{color:var(--muted);font-size:14.5px}
.bento .stat{background:linear-gradient(150deg,${t.primary},${t.accent});color:#fff;border:0;display:flex;flex-direction:column;justify-content:center}
.bento .stat b{font-size:30px;font-weight:800;line-height:1.1}
.bento .stat span{font-size:14px;opacity:.9;margin-top:6px}
@media(max-width:900px){.bento{grid-template-columns:repeat(2,1fr)}.bento .img{grid-column:span 2}}
@media(max-width:560px){.bento{grid-template-columns:1fr;grid-auto-rows:auto}.bento .cell{min-height:150px}.bento .img{grid-column:span 1;grid-row:span 1;height:220px}.bento .wide{grid-column:span 1}}
.striplist{display:flex;flex-wrap:wrap;gap:10px;margin-top:30px}
.striplist span{background:var(--panel);border:1px solid var(--line);border-radius:999px;padding:11px 18px;font-size:14.5px}
`,
  split: t => `
.hero-s{min-height:88vh;display:grid;grid-template-columns:1.02fr .98fr;align-items:center;gap:0}
.hero-s .copy{padding:70px 0 70px 26px;max-width:640px;margin-left:auto;padding-right:52px}
.hero-s .art{position:relative;height:100%;min-height:520px}
.hero-s .art img{width:100%;height:100%;object-fit:cover}
.hero-s .art::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,var(--bg) 0%,transparent 32%)}
.hero-s h1{font-size:clamp(34px,4.7vw,60px);margin:22px 0 20px}
.hero-s .sub{color:var(--muted);font-size:clamp(17px,1.9vw,20px);margin-bottom:30px}
@media(max-width:940px){.hero-s{grid-template-columns:1fr;min-height:auto}.hero-s .copy{padding:56px 26px;margin:0;max-width:none}.hero-s .art{min-height:300px}.hero-s .art::after{background:linear-gradient(180deg,var(--bg),transparent 40%)}}
.rowgrid{display:grid;grid-template-columns:repeat(2,1fr);gap:20px;margin-top:40px}
@media(max-width:760px){.rowgrid{grid-template-columns:1fr}}
.rcard{border-left:3px solid var(--accent);padding:6px 0 6px 22px}
.rcard h3{font-size:20px;margin-bottom:8px}
.rcard p{color:var(--muted);font-size:15.5px}
.checkband{background:var(--panel);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.checkcols{columns:2;column-gap:34px;margin-top:8px}
@media(max-width:640px){.checkcols{columns:1}}
.checkcols div{break-inside:avoid;display:flex;gap:12px;align-items:flex-start;padding:11px 0;font-size:15.5px}
.checkcols .ck{width:19px;height:19px;color:var(--accent);flex:0 0 auto;margin-top:3px}
`,
  editorial: t => `
.hero-e{padding:78px 0 0;position:relative}
.hero-e .kicker{font-size:clamp(15px,1.8vw,19px);color:var(--accent);font-weight:700;margin-bottom:18px}
.hero-e h1{font-size:clamp(38px,7.4vw,92px);letter-spacing:-.035em;max-width:13ch;margin-bottom:26px}
.hero-e .sub{color:var(--muted);font-size:clamp(17px,2vw,21px);max-width:640px;margin-bottom:34px}
.hero-e .band{margin-top:52px;height:clamp(260px,42vw,460px);position:relative;overflow:hidden;border-radius:0}
.hero-e .band img{width:100%;height:100%;object-fit:cover}
.hero-e .band::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 55%,var(--bg))}
.numlist{margin-top:40px}
.numrow{display:grid;grid-template-columns:78px 1fr;gap:26px;padding:30px 0;border-top:1px solid var(--line);align-items:start}
.numrow:last-child{border-bottom:1px solid var(--line)}
.numrow .n{font-size:44px;font-weight:800;color:${t.accent}44;line-height:.9}
.numrow h3{font-size:23px;margin-bottom:9px}
.numrow p{color:var(--muted);font-size:16px;max-width:640px}
@media(max-width:640px){.numrow{grid-template-columns:1fr;gap:8px}.numrow .n{font-size:32px}}
.pillrow{display:flex;flex-wrap:wrap;gap:11px;margin-top:26px}
.pillrow span{border:1px solid var(--line);background:var(--panel);border-radius:10px;padding:12px 18px;font-size:15px}
`,
  immersive: t => `
.hero-i{position:relative;min-height:96vh;display:flex;align-items:flex-end;overflow:hidden}
.hero-i .bg{position:absolute;inset:0}
.hero-i .bg img{width:100%;height:100%;object-fit:cover}
.hero-i .bg::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,${t.deep}cc 0%,${t.deep}44 32%,${t.deep}ee 82%,var(--bg) 100%)}
.hero-i .wrap{position:relative;z-index:2;padding-bottom:76px;text-align:center}
.hero-i h1{font-size:clamp(38px,7vw,86px);max-width:16ch;margin:24px auto 22px}
.hero-i .sub{color:rgba(255,255,255,.86);font-size:clamp(17px,2vw,21px);max-width:660px;margin:0 auto 32px}
.hero-i .row{display:flex;gap:13px;justify-content:center;flex-wrap:wrap}
.statband{display:grid;grid-template-columns:repeat(3,1fr);gap:0;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.statband div{padding:34px 26px;border-right:1px solid var(--line)}
.statband div:last-child{border-right:0}
.statband b{display:block;font-size:20px;margin-bottom:6px}
.statband span{color:var(--muted);font-size:14.5px}
@media(max-width:760px){.statband{grid-template-columns:1fr}.statband div{border-right:0;border-bottom:1px solid var(--line)}}
.altrow{display:grid;grid-template-columns:1fr 1fr;gap:44px;align-items:center;margin-bottom:26px}
.altrow:nth-child(even) .txt{order:2}
@media(max-width:820px){.altrow{grid-template-columns:1fr;gap:20px}.altrow:nth-child(even) .txt{order:0}}
.altrow h3{font-size:26px;margin-bottom:10px}
.altrow p{color:var(--muted);font-size:16.5px}
.altrow .visual{border-radius:20px;min-height:200px;background:linear-gradient(140deg,${t.primary}dd,${t.accent}aa);position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center}
.altrow .visual svg{width:74px;height:74px;color:#fff;opacity:.9}
.altrow .visual::after{content:"";position:absolute;inset:0;background:radial-gradient(60% 80% at 30% 20%,rgba(255,255,255,.3),transparent 60%)}
`,
  panel: t => `
.shell{display:grid;grid-template-columns:300px 1fr;gap:0;min-height:100vh}
@media(max-width:960px){.shell{grid-template-columns:1fr}}
.side{background:linear-gradient(170deg,${t.primary},${t.deep});color:#fff;padding:52px 34px;position:sticky;top:0;height:100vh;display:flex;flex-direction:column;justify-content:space-between}
@media(max-width:960px){.side{position:relative;height:auto;padding:40px 26px}}
.side .pname{font-size:34px;font-weight:800;letter-spacing:-.03em}
.side .ptag{margin-top:14px;font-size:16px;color:rgba(255,255,255,.85)}
.side .sidecta{margin-top:26px}
.side .foot{font-size:12px;color:rgba(255,255,255,.6);margin-top:40px}
.main{padding:0}
.phero{position:relative;height:clamp(300px,44vh,480px);overflow:hidden}
.phero img{width:100%;height:100%;object-fit:cover}
.phero::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 45%,var(--bg))}
.pbody{padding:0 44px}
@media(max-width:960px){.pbody{padding:0 26px}}
.pbody h1{font-size:clamp(30px,4vw,50px);margin:-40px 0 20px;position:relative;z-index:2;max-width:17ch}
.pbody .sub{color:var(--muted);font-size:19px;max-width:640px;margin-bottom:14px}
.stack{margin-top:44px;display:grid;gap:14px}
.stackrow{display:grid;grid-template-columns:56px 1fr;gap:20px;background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:24px;align-items:start;transition:transform .18s,border-color .18s}
.stackrow:hover{transform:translateX(5px);border-color:${t.accent}66}
.stackrow .ic{width:40px;height:40px;color:var(--accent)}
.stackrow h3{font-size:19px;margin-bottom:7px}
.stackrow p{color:var(--muted);font-size:15.5px}
.taglist{display:flex;flex-wrap:wrap;gap:9px;margin-top:26px}
.taglist span{font-size:14px;border:1px solid var(--line);border-radius:8px;padding:10px 15px;background:var(--panel)}
`,
  techdark: t => `
.hero-t{padding:72px 0 56px;border-bottom:1px solid var(--line)}
.hero-t .grid{display:grid;grid-template-columns:1.15fr .85fr;gap:48px;align-items:center}
@media(max-width:900px){.hero-t .grid{grid-template-columns:1fr;gap:28px}}
.hero-t h1{font-size:clamp(34px,5vw,64px);margin:20px 0 20px}
.hero-t .sub{color:var(--muted);font-size:clamp(17px,1.9vw,20px);margin-bottom:28px}
.hero-t .art{border-radius:22px;overflow:hidden;border:1px solid var(--line);aspect-ratio:4/3;box-shadow:0 30px 70px rgba(0,0,0,.28)}
.hero-t .art img{width:100%;height:100%;object-fit:cover}
.mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--accent)}
.bigrows{margin-top:20px}
.bigrow{padding:38px 0;border-bottom:1px solid var(--line);display:grid;grid-template-columns:1fr 1.35fr;gap:36px;align-items:start}
@media(max-width:820px){.bigrow{grid-template-columns:1fr;gap:12px}}
.bigrow h3{font-size:clamp(22px,2.6vw,31px)}
.bigrow p{color:var(--muted);font-size:16.5px}
.bigrow .ic{width:34px;height:34px;color:var(--accent);margin-bottom:12px}
.specgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--line);border:1px solid var(--line);border-radius:16px;overflow:hidden;margin-top:34px}
@media(max-width:760px){.specgrid{grid-template-columns:1fr}}
.specgrid div{background:var(--bg);padding:24px 22px;font-size:15.5px}
.specgrid div .mono{display:block;margin-bottom:7px}
`,
};

const REVEAL_JS = `<script>(function(){var r=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;var e=document.querySelectorAll('.reveal:not(.in)');if(r||!('IntersectionObserver'in window)){e.forEach(function(x){x.classList.add('in')});return}var io=new IntersectionObserver(function(en){en.forEach(function(x){if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}})},{threshold:.12});e.forEach(function(x){io.observe(x)})})();</script>`;

function ctaSection(s, formAction) {
  return `<section><div class="wrap"><div class="ctaband reveal" id="cta-box">
  <h2 class="h2">${esc(s.cta.h)}</h2>
  <p>${esc(s.cta.s)}</p>
  <form class="lead-form" id="start" method="post" action="${esc(formAction)}">
    <input type="email" name="email" required autocomplete="email" placeholder="Your work email">
    <input type="tel" name="phone" autocomplete="tel" placeholder="Phone (optional)">
    <button type="submit">Send me more information</button>
  </form>
</div></div></section>`;
}

function footerFor(s) {
  const host = s.official.replace(/^https?:\/\//, '').replace(/\/$/, '');
  return `<footer><div class="wrap"><p class="disc">
  <strong>${esc(PUBLISHER.name)}</strong> &middot; ${esc(s.name)} and related names and logos are trademarks of their respective owner.
  ${esc(PUBLISHER.name)} is independent and is not affiliated with or endorsed by ${esc(s.name)}.
  Official product information: <a href="${esc(s.official)}" target="_blank" rel="noopener">${esc(host)}</a>.
</p></div></footer>`;
}

function navFor() {
  return `<nav class="nav"><div class="wrap">
  <a href="#top" style="text-decoration:none"><span class="brandmark">${esc(PUBLISHER.name)}</span></a>
  <a class="btn btn-primary" href="#start" style="padding:10px 18px;font-size:14px">More information</a>
</div></nav>`;
}

// ── layout renderers ────────────────────────────────────────────────────────
const LAYOUTS = {
  bento(s, img) {
    const w = s.why;
    return `<header class="hero-b"><div class="wrap">
      <span class="eyebrow reveal in">${esc(s.category)}</span>
      <h1 class="reveal in">${esc(s.headline)}</h1>
      <p class="sub reveal in">${esc(s.sub)}</p>
      <div class="bento">
        <div class="cell img reveal">${img ? `<img src="${esc(img)}" alt="">` : ''}</div>
        <div class="cell wide stat reveal"><b>${esc(s.name)}</b><span>${esc(s.tagline)}</span></div>
        <div class="cell reveal"><div class="icbox">${w[0].icon}</div><h3>${esc(w[0].t)}</h3></div>
        <div class="cell reveal"><div class="icbox">${w[1].icon}</div><h3>${esc(w[1].t)}</h3></div>
        <div class="cell wide reveal"><h3>${esc(w[2].t)}</h3><p>${esc(w[2].b)}</p></div>
        <div class="cell wide reveal"><h3>${esc(w[3].t)}</h3><p>${esc(w[3].b)}</p></div>
      </div>
    </div></header>
    <section><div class="wrap">
      <h2 class="h2 reveal">Why it earns a place in your stack</h2>
      <p class="lead reveal">${esc(w[0].b)}</p>
      <div class="striplist">${s.does.map(d => `<span class="reveal">${esc(d)}</span>`).join('')}</div>
    </div></section>`;
  },

  split(s, img) {
    return `<header class="hero-s">
      <div class="copy">
        <span class="eyebrow reveal in">${esc(s.category)}</span>
        <h1 class="reveal in">${esc(s.headline)}</h1>
        <p class="sub reveal in">${esc(s.sub)}</p>
        <a class="btn btn-primary reveal in" href="#start">Send me more information</a>
      </div>
      <div class="art">${img ? `<img src="${esc(img)}" alt="">` : ''}</div>
    </header>
    <section><div class="wrap">
      <span class="wordmark reveal">${esc(s.tagline)}</span>
      <h2 class="h2 reveal" style="margin-top:14px">Why MSPs run ${esc(s.name)}</h2>
      <div class="rowgrid">${s.why.map(x => `<div class="rcard reveal"><h3>${esc(x.t)}</h3><p>${esc(x.b)}</p></div>`).join('')}</div>
    </div></section>
    <section class="checkband"><div class="wrap">
      <h2 class="h2 reveal">What you get</h2>
      <div class="checkcols">${s.does.map(d => `<div class="reveal"><span class="ck">${I.check}</span>${esc(d)}</div>`).join('')}</div>
    </div></section>`;
  },

  editorial(s, img) {
    return `<header class="hero-e"><div class="wrap">
      <div class="kicker reveal in">${esc(s.tagline)}</div>
      <h1 class="reveal in">${esc(s.headline)}</h1>
      <p class="sub reveal in">${esc(s.sub)}</p>
      <a class="btn btn-primary reveal in" href="#start">Send me more information</a>
    </div>
    <div class="band reveal in">${img ? `<img src="${esc(img)}" alt="">` : ''}</div>
    </header>
    <section><div class="wrap">
      <span class="eyebrow reveal">${esc(s.category)}</span>
      <h2 class="h2 reveal" style="margin-top:16px">Four reasons it belongs in your stack</h2>
      <div class="numlist">${s.why.map((x, i) => `<div class="numrow reveal"><div class="n">0${i + 1}</div><div><h3>${esc(x.t)}</h3><p>${esc(x.b)}</p></div></div>`).join('')}</div>
      <div class="pillrow">${s.does.map(d => `<span class="reveal">${esc(d)}</span>`).join('')}</div>
    </div></section>`;
  },

  immersive(s, img) {
    return `<header class="hero-i">
      <div class="bg">${img ? `<img src="${esc(img)}" alt="">` : ''}</div>
      <div class="wrap">
        <span class="eyebrow reveal in">${esc(s.category)}</span>
        <h1 class="reveal in" style="color:#fff">${esc(s.headline)}</h1>
        <p class="sub reveal in">${esc(s.sub)}</p>
        <div class="row reveal in"><a class="btn btn-primary" href="#start">Send me more information</a></div>
      </div>
    </header>
    <div class="statband">
      <div class="reveal"><b>${esc(s.name)}</b><span>${esc(s.tagline)}</span></div>
      <div class="reveal"><b>${esc(s.why[0].t)}</b><span>${esc(s.why[0].b)}</span></div>
      <div class="reveal"><b>${esc(s.why[1].t)}</b><span>${esc(s.why[1].b)}</span></div>
    </div>
    <section><div class="wrap">
      ${s.why.slice(2).map(x => `<div class="altrow reveal"><div class="txt"><h3>${esc(x.t)}</h3><p>${esc(x.b)}</p></div><div class="visual">${x.icon}</div></div>`).join('')}
      <h2 class="h2 reveal" style="margin-top:56px">What you get</h2>
      <div class="statband" style="border-radius:18px;overflow:hidden;margin-top:22px;grid-template-columns:repeat(3,1fr)">
        ${s.does.map(d => `<div class="reveal"><b style="font-size:15.5px">${esc(d)}</b></div>`).join('')}
      </div>
    </div></section>`;
  },

  panel(s, img) {
    return `<div class="shell">
      <aside class="side">
        <div>
          <div class="pname">${esc(s.name)}</div>
          <div class="ptag">${esc(s.tagline)}</div>
          <div class="sidecta"><a class="btn btn-ghost" href="#start" style="color:${s.theme.deep}">More information</a></div>
        </div>
        <div class="foot">Reviewed by ${esc(PUBLISHER.name)}</div>
      </aside>
      <main class="main">
        <div class="phero">${img ? `<img src="${esc(img)}" alt="">` : ''}</div>
        <div class="pbody">
          <h1 class="reveal in">${esc(s.headline)}</h1>
          <p class="sub reveal in">${esc(s.sub)}</p>
          <span class="eyebrow reveal">${esc(s.category)}</span>
          <div class="stack">${s.why.map(x => `<div class="stackrow reveal"><div class="ic">${x.icon}</div><div><h3>${esc(x.t)}</h3><p>${esc(x.b)}</p></div></div>`).join('')}</div>
          <div class="taglist">${s.does.map(d => `<span class="reveal">${esc(d)}</span>`).join('')}</div>
        </div>
      </main>
    </div>`;
  },

  techdark(s, img) {
    return `<header class="hero-t"><div class="wrap"><div class="grid">
      <div>
        <span class="mono reveal in">${esc(s.category)}</span>
        <h1 class="reveal in">${esc(s.headline)}</h1>
        <p class="sub reveal in">${esc(s.sub)}</p>
        <a class="btn btn-primary reveal in" href="#start">Send me more information</a>
      </div>
      <div class="art reveal in">${img ? `<img src="${esc(img)}" alt="">` : ''}</div>
    </div></div></header>
    <section><div class="wrap">
      <span class="mono reveal">${esc(s.tagline)}</span>
      <div class="bigrows">${s.why.map(x => `<div class="bigrow reveal"><div><div class="ic">${x.icon}</div><h3>${esc(x.t)}</h3></div><p>${esc(x.b)}</p></div>`).join('')}</div>
      <div class="specgrid">${s.does.map((d, i) => `<div class="reveal"><span class="mono">0${i + 1}</span>${esc(d)}</div>`).join('')}</div>
    </div></section>`;
  },
};

function renderSolution(product, meta = {}) {
  const base = SOLUTIONS[product];
  if (!base) return null;
  // meta.custom personalizes COPY only (headline/sub/tagline/why texts). Theme,
  // layout, icons, the factual `does` list, cta and footer always stay base, so
  // the model can never invent vendor capabilities.
  const c = meta.custom || null;
  const s = !c ? base : {
    ...base,
    headline: c.headline || base.headline,
    sub: c.sub || base.sub,
    tagline: c.tagline || base.tagline,
    why: base.why.map((w, i) => (c.why && c.why[i])
      ? { icon: w.icon, t: c.why[i].t || w.t, b: c.why[i].b || w.b } : w),
  };
  const t = s.theme;
  const prefix = (meta.prefix || '').replace(/\/$/, '');
  const img = meta.heroImg || null;
  const formAction = `${prefix}/l/${encodeURIComponent(meta.leadSlug || ('sol_' + product))}`;
  const title = meta.pageTitle || `Why MSPs choose ${s.name} | ${PUBLISHER.name}`;
  const layout = LAYOUTS[s.layout] ? s.layout : 'split';
  const css = CORE(t) + (LAYOUT_CSS[layout] ? LAYOUT_CSS[layout](t) : '');

  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(s.sub)}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(s.sub)}">
<meta name="robots" content="noindex"><meta name="theme-color" content="${t.deep}">
<style>${css}</style></head><body id="top">
${layout === 'panel' ? '' : navFor()}
${LAYOUTS[layout](s, img)}
${ctaSection(s, formAction)}
${footerFor(s)}
${REVEAL_JS}
</body></html>`;
}

module.exports = { renderSolution, SOLUTIONS, PUBLISHER };
