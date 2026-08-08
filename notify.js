// notify.js — fire-and-forget lead notification email via Resend's HTTP API.
// No SDK dependency, matches the rest of this repo's raw-fetch style (see
// llm.js's OpenRouter calls). Silently no-ops if Resend isn't configured, so
// the lead is always saved regardless of whether notification is set up.

async function notifyLead({ company, email, phone, slug }) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_NOTIFY_EMAIL;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !to || !from) return;

  const base = (process.env.PUBLIC_BASE_URL || process.env.BASE_URL || '').replace(/\/$/, '');
  const prefix = (process.env.PAGE_PREFIX || '/p').replace(/\/$/, '');
  const pageUrl = base ? `${base}${prefix}/${slug}` : null;

  const lines = [
    `New partner lead: ${company || 'Unknown company'}`,
    `Email: ${email}`,
    phone ? `Phone: ${phone}` : null,
    pageUrl ? `Page: ${pageUrl}` : null,
  ].filter(Boolean);

  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to,
      subject: `New lead: ${company || email}`,
      text: lines.join('\n'),
    }),
  });
  if (!resp.ok) throw new Error(`Resend ${resp.status}: ${await resp.text()}`);
}

module.exports = { notifyLead };
