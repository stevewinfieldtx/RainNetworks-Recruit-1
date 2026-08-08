// Page-content generation.
//
// generatePageContent() returns the structured page object that render.js maps
// to sections. It uses OpenRouter when OPENROUTER_API_KEY + OPENROUTER_MODEL_ID
// are set, and falls back to deterministic static copy (buildStaticContent)
// otherwise, or on any API/parse failure. The OpenRouter call mirrors the
// source repo: Bearer auth, reasoning:{exclude:true}, temp 0.2, regex JSON
// extraction, one-shot retry.

const DEFAULT_CTA_URL = () => process.env.DEFAULT_CTA_URL || 'https://rainnetworks.com/';

// Deterministic, no-network copy. Personalizes hero + why + product angles with
// whatever enrichment we have, and stays generic when we know little.
function buildStaticContent(company, enrichment = {}) {
  const e = enrichment || {};
  const loc = e.location ? ` in ${e.location}` : '';

  return {
    company,
    hero: {
      headline: `${company}, turn security into your next recurring revenue line`,
      subhead: `You run an MSP${loc}. Rain Networks helps you add an enterprise-grade security stack, Guardz, Macrium, and NINJIO, without standing up a security team.`
    },
    why_rain: {
      para: `Rain Networks is a value-added distributor, not just a license reseller. For ${company} that means a curated stack plus a partner who handles product selection, enablement, training, and flexible licensing, so you can go to market fast. Today your clients expect stronger security, and you need services you can actually bill for.`,
      bullets: [
        'New recurring revenue lines you can turn on quickly',
        'Higher margins with a bundled offer competitors do not have',
        'One distributor relationship instead of juggling many vendors',
        'Hands-on enablement and training, not just a license desk'
      ]
    },
    defense_in_depth: {
      intro: `Prevent at the human layer, detect and respond in real time, and recover when it counts. They work well together, and each stands on its own, so keep what you already run and add just the layer you need.`,
      products: [
        { name: 'NINJIO', layer: 'Prevent / human layer',
          for_you: `Security awareness training that stops the phishing and social engineering that hit ${company}'s clients first. Recurring subscription revenue, white-label or co-brand it as your own.` },
        { name: 'Guardz', layer: 'Detect and respond',
          for_you: `AI-powered, MSP-native security that unifies endpoints, identity, email, and cloud in one multi-tenant console, with ROI reports you hand clients and a strong commission structure.` },
        { name: 'Macrium', layer: 'Recover',
          for_you: `Ransomware-resistant backup and imaging with rapid recovery, restore to dissimilar hardware, and MultiSite monitoring across every client ${company} manages.` }
      ]
    },
    roi: {
      headline: 'The business case',
      para: `Each layer is a billable, recurring service you can mark up. Together they make ${company}'s clients stickier and give you a differentiated pitch on every renewal and new-logo opportunity.`,
      stats: [
        { value: '3', label: 'New recurring services from one distributor' },
        { value: 'Recurring', label: 'Billable, markable-up services under your brand' },
        { value: '1 pane', label: 'Multi-tenant management across all clients' }
      ]
    },
    social_proof: {
      para: `Rain Networks is a Seattle-area value-added distributor trusted by MSPs to identify, deploy, and scale best-in-class security solutions.`,
      logos: []
    },
    cta: {
      headline: 'Want more information?',
      subhead: 'Leave your work email and I will send it over.',
      url: (e.cta_url || DEFAULT_CTA_URL()),
      label: 'Send me more information'
    }
  };
}

function systemPrompt() {
  return `You write a short, high-converting landing page that persuades a specific Managed Service Provider (MSP) to become a reseller partner of Rain Networks, a Seattle-area value-added distributor. Lead with three products in Rain's portfolio, framed as one defense-in-depth service the MSP can sell:
- NINJIO: security awareness training (prevent, human layer). Recurring subscription revenue, white-label or co-brand.
- Guardz: AI-powered unified cybersecurity for MSPs across endpoints, identity, email, cloud (detect and respond). Multi-tenant, ROI reports, and a strong commission structure for partners. Never state a specific commission dollar amount.
- Macrium: Windows backup and imaging, ransomware-resistant, rapid recovery, MultiSite monitoring (recover).

The audience is the MSP owner. Sell the business case: new recurring revenue, higher margins, stickier clients, less vendor sprawl, and that Rain provides enablement and training, not just licenses.

You will be given the company's own website text. Treat it as the primary source of truth. From it, identify: the exact services they offer, the industries and client size they serve, their specific geography and any local nickname they use (for example a metro or region), and any named tools or vendors they rely on. Infer their two or three most likely security pain points and argue Rain from THOSE specifics. The reader must feel you understand their business: reference their vertical, their region, and their current stack naturally in the hero and in each product's "for_you". Do NOT write generic copy that could apply to any MSP. Do NOT invent facts (client names, certifications, tools) that are not supported by the provided website text; when a detail is unknown, stay at the level of what the text supports.

IMPORTANT positioning: the three products are INDEPENDENT and do not have to be adopted together. The partner can keep the tools they already run and add just one, or two (for example keep their existing endpoint security and add only Macrium and NINJIO). They work well together but each stands on its own. Never imply an all-or-nothing bundle. The defense_in_depth.intro must say they layer well together AND that the partner can start with a single product or add to their current stack.

The call to action is a low-friction EMAIL CAPTURE, not a booking or a phone call. The page shows an email field (required) and an optional phone field. Keep the CTA SHORT and plain: cta.headline should be "Want more information?" and cta.subhead a single short line like "Leave your work email and I will send it over." Do NOT mention booking a call, calendars, or scheduling, and do NOT say the distributor or vendor will contact them. cta.label is a short button phrase such as "Send me more information".

VOICE: the page is written by an independent advisor to MSPs who is recommending Rain Networks to the reader. Write about Rain Networks in the third person ("Rain Networks is a distributor that...", "you would get..."). Never write as if you ARE Rain Networks, and never use "we" to mean Rain.

HARD RULES:
- Use ONLY facts provided about the company. If a fact is unknown, stay generic. NEVER invent the company's client names, size, revenue, or specifics.
- Do not use em dashes or en dashes anywhere. Use commas, colons, periods, or parentheses.
- Return ONLY valid JSON (no markdown fences), matching exactly this shape:
{"company":"...","hero":{"headline":"...","subhead":"..."},"why_rain":{"para":"...","bullets":["...","...","...","..."]},"defense_in_depth":{"intro":"...","products":[{"name":"NINJIO","layer":"Prevent / human layer","for_you":"..."},{"name":"Guardz","layer":"Detect and respond","for_you":"..."},{"name":"Macrium","layer":"Recover","for_you":"..."}]},"roi":{"headline":"The business case","para":"...","stats":[{"value":"...","label":"..."},{"value":"...","label":"..."},{"value":"...","label":"..."}]},"social_proof":{"para":"...","logos":[]},"cta":{"headline":"...","subhead":"leave your email and I will send the details","url":"CTA_URL","label":"Send me the partner details"}}`;
}

async function callOpenRouter(apiKey, modelId, sys, user, withReasoning) {
  const body = {
    model: modelId,
    messages: [{ role: 'system', content: sys }, { role: 'user', content: user }],
    temperature: 0.3,
    max_tokens: 4000
  };
  if (withReasoning) body.reasoning = { exclude: true };
  const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://rainnetworks.com'
    },
    body: JSON.stringify(body)
  });
  if (!resp.ok) throw new Error(`OpenRouter ${resp.status}: ${await resp.text()}`);
  const data = await resp.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  const msg = data.choices?.[0]?.message;
  const content = msg?.content || msg?.reasoning;
  if (!content) throw new Error(`empty content (finish_reason: ${data.choices?.[0]?.finish_reason || 'unknown'})`);
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('no JSON object in response');
  return JSON.parse(match[0]);
}

async function generatePageContent(company, enrichment = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const modelId = process.env.OPENROUTER_MODEL_ID;
  const ctaUrl = enrichment.cta_url || DEFAULT_CTA_URL();

  if (!apiKey || !modelId) {
    return buildStaticContent(company, enrichment);
  }

  const sys = systemPrompt();
  const { homepage_text, ...facts } = enrichment || {};
  let user = `Company: ${company}\n`;
  user += `Known firmographic facts (from a data provider):\n${JSON.stringify(facts, null, 2)}\n\n`;
  if (homepage_text) {
    user += `The company's own website text (PRIMARY source, ground the copy in this):\n"""\n${homepage_text}\n"""\n\n`;
  } else {
    user += `No website text was available; write a strong but honest page from the firmographic facts only.\n\n`;
  }
  user += `Use this exact CTA url: ${ctaUrl}`;

  try {
    let parsed;
    try {
      parsed = await callOpenRouter(apiKey, modelId, sys, user, true);
    } catch (firstErr) {
      parsed = await callOpenRouter(apiKey, modelId, sys, user, false); // one-shot retry
    }
    // Normalize a few fields to guarantee render.js has what it needs.
    parsed.company = parsed.company || company;
    if (!parsed.cta) parsed.cta = {};
    parsed.cta.url = parsed.cta.url && /^https?:\/\//.test(parsed.cta.url) ? parsed.cta.url : ctaUrl;
    return parsed;
  } catch (err) {
    console.error(`LLM: falling back to static copy for "${company}": ${err.message}`);
    return buildStaticContent(company, enrichment);
  }
}

// --- WhatsCoolAbout product pitch (visitor-personalized product pages) ------

// Deterministic fallback: base product copy with the company name woven in.
// Used when no API keys, when TDE research is thin, or when the LLM fails.
function buildStaticPitch(companyName, solution) {
  return {
    company: companyName,
    headline: `Why ${solution.name} is worth ${companyName}'s attention`,
    sub: solution.sub,
    tagline: solution.tagline,
    why: solution.why.map(w => ({ t: w.t, b: w.b })),
  };
}

function pitchSystemPrompt(solution) {
  return `You are a technology curator at Rain Networks, a value-added distributor that surfaces cool technology for channel partners and IT-minded businesses. You are writing a short personalized page for ONE specific company about why ${solution.name} is genuinely cool FOR THEM.

VOICE:
- Independent reviewer. Second person ("you", "your clients") to the reader. Third person about ${solution.name} and its vendor. You are NOT the vendor and never write as the vendor.
- Concrete, direct, no marketing fluff words like "elevate", "unleash", "seamless".

SOURCES (strict):
- The PRODUCT FACT SHEET below is the ONLY permitted source of product claims. Do not invent features, statistics, certifications, or pricing.
- The COMPANY RESEARCH below is the ONLY permitted source of facts about the company. Identify their industry, size signals, geography, services, and stack from it. If an axis is unknown, stay generic on that axis. NEVER invent company facts (client names, revenue, headcount).
- Every "why" item must connect a real product capability from the fact sheet to something real about this company's situation.

HARD RULES:
- Do not use em dashes or en dashes anywhere. Use commas, colons, periods, or parentheses.
- No pricing claims of any kind.
- Return ONLY valid JSON, no markdown fences, exactly this shape:
{"company":"proper company name from the research, else a clean version of their domain","headline":"max 70 chars, names the company or their situation","sub":"160 to 280 chars","tagline":"max 90 chars","why":[{"t":"max 42 chars","b":"120 to 190 chars"},{"t":"...","b":"..."},{"t":"...","b":"..."},{"t":"...","b":"..."}]}
The "why" array must contain exactly 4 items.`;
}

// Scrub em/en dashes and clamp lengths; enforce the exact shape LAYOUTS need.
function validatePitch(parsed, companyName, solution) {
  const clean = (v, max) => String(v || '').replace(/[—–]/g, ', ').trim().slice(0, max);
  if (!parsed || typeof parsed !== 'object') return null;
  if (!Array.isArray(parsed.why) || parsed.why.length !== 4) return null;
  const why = parsed.why.map((w, i) => ({
    t: clean(w && w.t, 42) || solution.why[i].t,
    b: clean(w && w.b, 190) || solution.why[i].b,
  }));
  if (why.some(w => !w.t || !w.b)) return null;
  const headline = clean(parsed.headline, 70);
  const sub = clean(parsed.sub, 280);
  if (!headline || !sub) return null;
  return {
    company: clean(parsed.company, 80) || companyName,
    headline, sub,
    tagline: clean(parsed.tagline, 90) || solution.tagline,
    why,
  };
}

// Personalized "why <product> for <company>" content, grounded in TDE research.
// solution = the SOLUTIONS[product] entry; enrichment = { homepage_text } block.
async function generateProductPitch(companyName, solution, enrichment = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const modelId = process.env.OPENROUTER_MODEL_ID;
  if (!apiKey || !modelId) return buildStaticPitch(companyName, solution);

  const factSheet = {
    name: solution.name, category: solution.category, tagline: solution.tagline,
    headline: solution.headline, sub: solution.sub,
    why: solution.why.map(w => ({ t: w.t, b: w.b })), does: solution.does,
  };
  const sys = pitchSystemPrompt(solution);
  let user = `Company: ${companyName}\n\nPRODUCT FACT SHEET (the ONLY permitted source of product claims):\n${JSON.stringify(factSheet, null, 2)}\n\n`;
  user += enrichment.homepage_text
    ? `COMPANY RESEARCH (the ONLY permitted source of company facts):\n"""\n${enrichment.homepage_text}\n"""`
    : `No company research is available. Write an honest page that personalizes only by company name; keep all other claims generic.`;

  try {
    let parsed;
    try { parsed = await callOpenRouter(apiKey, modelId, sys, user, true); }
    catch { parsed = await callOpenRouter(apiKey, modelId, sys, user, false); }
    return validatePitch(parsed, companyName, solution) || buildStaticPitch(companyName, solution);
  } catch (err) {
    console.error(`LLM: pitch fallback for "${companyName}" x ${solution.name}: ${err.message}`);
    return buildStaticPitch(companyName, solution);
  }
}

// --- Outreach email (pairs with the personalized landing page) -------------
//
// The email is the thing that actually lands in an inbox; the landing page is
// what it links to. Guardz leads (it is the strongest hook: detection is the
// gap MSPs feel first), but the email must also name Macrium and NINJIO so the
// reader is not surprised to find three offerings when they click through.

function findProduct(content, name) {
  const list = (content && content.defense_in_depth && content.defense_in_depth.products) || [];
  return list.find(p => p.name === name);
}

// Deterministic, no-network fallback. Reuses the already-personalized Guardz
// "for_you" line from the page content as the hook, so the email and the page
// never disagree about why Guardz fits this MSP.
function buildStaticEmail(companyName, content, opts = {}) {
  const url = opts.url || DEFAULT_CTA_URL();
  const first = (opts.contactFirstName || '').trim();
  const guardz = findProduct(content, 'Guardz');
  const hook = (guardz && guardz.for_you) ||
    `Guardz adds AI-driven detection across endpoints, identity, email, and cloud in one multi-tenant console, with a strong reseller margin.`;

  const lines = [
    first ? `Hi ${first},` : `Hi there,`,
    '',
    hook,
    '',
    `That is the lead, but Rain Networks backs it with two more billable layers: Macrium for ransomware-resistant backup and fast recovery, and NINJIO for security-awareness training your clients will actually finish. All three stand on their own, so ${companyName} can start with Guardz alone or add whichever layer you are missing.`
      .replace('${companyName}', companyName),
    '',
    `I put together a short page with specifics on all three, and what each looks like resold under your brand: ${url}`,
    '',
    `Worth five minutes?`,
  ];
  return { subject: `${companyName}: Guardz, plus backup and training behind it`, body: lines.join('\n') };
}

function emailSystemPrompt() {
  return `You write a short, personal cold outreach EMAIL (not a landing page) that gets an MSP owner to click through to a personalized partner page about Rain Networks, a Seattle-area value-added distributor.

You will be given the JSON content of that landing page, already personalized to this MSP. Use it as your ONLY source of facts about the company and the products. Do not invent anything beyond what is there.

STRUCTURE:
- Open with 1 to 2 sentences that hook on Guardz (detect and respond) specifically, using the company-specific angle already written in defense_in_depth.products for the "Guardz" entry.
- Then 1 to 2 sentences that explicitly name and briefly describe the other two products, Macrium (recover) and NINJIO (prevent / human layer), so the reader is not surprised to see three offerings when they click through. Say plainly that the three are independent and they can start with just one.
- Close with one line pointing to the personalized page (use the exact URL given, verbatim) and a short, low-pressure sign-off question.

HARD RULES:
- The body MUST mention "Guardz", "Macrium", and "NINJIO" by name, each at least once.
- Plain text email, not HTML. No subject-line header inside the body.
- Under 140 words total in the body.
- Do not use em dashes or en dashes anywhere. Use commas, colons, periods, or parentheses.
- Do not mention booking a call, calendars, or scheduling. The only ask is to click the link or reply.
- Return ONLY valid JSON, no markdown fences, exactly this shape:
{"subject":"max 70 chars, names the company or the hook","body":"the full email body as plain text, paragraphs separated by a single blank line"}`;
}

// Enforce the hard rule that all three products are named, strip dashes, and
// make sure the link survived. Falls back to the static email on any miss.
function validateEmail(parsed, url) {
  const clean = (v, max) => String(v || '').replace(/[—–]/g, ', ').trim().slice(0, max);
  if (!parsed || typeof parsed !== 'object') return null;
  const subject = clean(parsed.subject, 78);
  let body = clean(parsed.body, 2000);
  if (!subject || !body) return null;
  const lower = body.toLowerCase();
  if (!lower.includes('guardz') || !lower.includes('macrium') || !lower.includes('ninjio')) return null;
  if (!body.includes(url)) body += `\n\n${url}`;
  return { subject, body };
}

// content = the page content already produced for this partner (so the email
// and the landing page it links to always tell the same story). url = the
// partner's personalized page link.
async function generateOutreachEmail(companyName, content, url, contactFirstName) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const modelId = process.env.OPENROUTER_MODEL_ID;
  const opts = { url, contactFirstName };
  if (!apiKey || !modelId) return buildStaticEmail(companyName, content, opts);

  const sys = emailSystemPrompt();
  const user = `Company: ${companyName}\nPersonalized landing page URL (use this exact URL): ${url}\n\n` +
    `LANDING PAGE CONTENT (already personalized, your only source of facts):\n${JSON.stringify(content, null, 2)}`;

  try {
    let parsed;
    try { parsed = await callOpenRouter(apiKey, modelId, sys, user, true); }
    catch { parsed = await callOpenRouter(apiKey, modelId, sys, user, false); }
    return validateEmail(parsed, url) || buildStaticEmail(companyName, content, opts);
  } catch (err) {
    console.error(`LLM: email fallback for "${companyName}": ${err.message}`);
    return buildStaticEmail(companyName, content, opts);
  }
}

module.exports = {
  generatePageContent, buildStaticContent, generateProductPitch, buildStaticPitch,
  generateOutreachEmail, buildStaticEmail,
};
