// Minimal zero-dependency .env loader. Reads KEY=VALUE lines from ./.env into
// process.env (without overwriting values already set in the environment).
// Keeps the dependency list to express + pg only.
const fs = require('fs');
const path = require('path');

module.exports = function loadEnv() {
  const file = path.join(__dirname, '.env');
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { return; }
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
};
