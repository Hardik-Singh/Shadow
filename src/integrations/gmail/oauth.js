// Gmail OAuth scaffold — same fake-consent pattern as src/integrations/slack/oauth.js
// (real flow would round-trip through accounts.google.com with the gmail.readonly scope).

const path = require('path');
const fs = require('fs');

const STATE_PATH = path.join(__dirname, '.connected.json');

function isConnected() {
  try { return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8')).connected === true; }
  catch { return false; }
}

function authorizeUrl({ redirectUri }) {
  const scopes = ['https://www.googleapis.com/auth/gmail.readonly'].join(' ');
  return `shadow://fake-consent/gmail?scopes=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri || '')}`;
}

async function completeFakeConsent() {
  fs.writeFileSync(STATE_PATH, JSON.stringify({ connected: true, ts: Date.now(), provider: 'gmail' }));
  return { ok: true };
}

function disconnect() {
  try { fs.unlinkSync(STATE_PATH); } catch {}
  return { ok: true };
}

module.exports = { isConnected, authorizeUrl, completeFakeConsent, disconnect };
