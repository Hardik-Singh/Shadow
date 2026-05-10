// Slack OAuth scaffold.
//
// In production this would walk users through the standard `oauth.v2.access`
// flow and persist a workspace-scoped bot token. For the demo we short-circuit
// to a fixture state so artifacts can cite slack threads without a live
// workspace.

const path = require('path');
const fs = require('fs');

const STATE_PATH = path.join(__dirname, '.connected.json');

function isConnected() {
  try { return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8')).connected === true; }
  catch { return false; }
}

function authorizeUrl({ redirectUri }) {
  // Real implementation would build a slack.com/oauth/v2/authorize URL with
  // scopes (channels:history, search:read, users:read) + state nonce. We
  // return a stub that the client treats as a fake consent screen.
  const scopes = ['channels:history', 'channels:read', 'search:read', 'users:read'].join(',');
  return `shadow://fake-consent/slack?scopes=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri || '')}`;
}

async function completeFakeConsent() {
  fs.writeFileSync(STATE_PATH, JSON.stringify({ connected: true, ts: Date.now(), provider: 'slack' }));
  return { ok: true };
}

function disconnect() {
  try { fs.unlinkSync(STATE_PATH); } catch {}
  return { ok: true };
}

module.exports = { isConnected, authorizeUrl, completeFakeConsent, disconnect };
