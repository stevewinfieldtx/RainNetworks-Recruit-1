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

module.exports = { generatePageContent, buildStaticContent };
