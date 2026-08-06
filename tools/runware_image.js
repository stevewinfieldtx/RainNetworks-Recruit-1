#!/usr/bin/env node
// Generate an image via Runware (runware.com) and save it into public/.
// Reads RUNWARE_API_KEY from .env. Reusable for every vendor's hero/graphics.
//
// Usage: node tools/runware_image.js <outfile.webp> "<prompt>" [--wide|--square|--tall] [--model runware:100@1]
require('../env')();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const KEY = process.env.RUNWARE_API_KEY;
const OUT_DIR = path.join(__dirname, '..', 'public');
const arg = (f, d) => { const i = process.argv.indexOf(f); return i >= 0 ? process.argv[i + 1] : d; };

const SIZES = { wide: [1344, 768], square: [1024, 1024], tall: [768, 1344] };

(async () => {
  if (!KEY) { console.error('RUNWARE_API_KEY not set in .env'); process.exit(1); }
  const outfile = process.argv[2];
  const prompt = process.argv[3];
  if (!outfile || !prompt) { console.error('usage: node tools/runware_image.js <outfile> "<prompt>" [--wide|--square|--tall]'); process.exit(1); }
  const shape = process.argv.includes('--square') ? 'square' : process.argv.includes('--tall') ? 'tall' : 'wide';
  const [width, height] = SIZES[shape];
  const model = arg('--model', 'runware:100@1'); // FLUX.1 [dev]

  const task = {
    taskType: 'imageInference',
    taskUUID: crypto.randomUUID(),
    positivePrompt: prompt,
    model, width, height, numberResults: 1, outputFormat: 'WEBP',
  };

  const r = await fetch('https://api.runware.ai/v1', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + KEY },
    body: JSON.stringify([task]),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { console.error('HTTP', r.status, JSON.stringify(j).slice(0, 400)); process.exit(1); }
  const data = Array.isArray(j.data) ? j.data : [];
  const img = data.find(d => d.imageURL) || (j.errors ? null : data[0]);
  if (!img || !img.imageURL) { console.error('No image URL in response:', JSON.stringify(j).slice(0, 500)); process.exit(1); }

  const bin = Buffer.from(await (await fetch(img.imageURL)).arrayBuffer());
  const dest = path.join(OUT_DIR, outfile);
  fs.writeFileSync(dest, bin);
  console.log(`saved public/${outfile} (${bin.length} bytes, ${width}x${height}) from ${img.imageURL}`);
})().catch(e => { console.error('ERR:', e.message); process.exit(1); });
