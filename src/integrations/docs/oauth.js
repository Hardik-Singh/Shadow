// Docs OAuth scaffold — covers both Notion and Google Docs under one fake
// consent flow. Each provider would have its own OAuth in production; for
// the demo, "Connect Docs" toggles a single state file.

const path = require('path');
const fs = require('fs');

const STATE_PATH = path.join(__dirname, '.connected.json');

function isConnected() {
  try { return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8')).connected === true; }
  catch { return false; }
}

function authorizeUrl({ provider = 'notion', redirectUri }) {
  const scopes = provider === 'notion'
    ? 'workspace.read,page.read'
    : 'https://www.googleapis.com/auth/documents.readonly';
  return `shadow://fake-consent/${provider}?scopes=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri || '')}`;
}

async function completeFakeConsent(provider = 'docs') {
  fs.writeFileSync(STATE_PATH, JSON.stringify({ connected: true, ts: Date.now(), provider }));
  return { ok: true };
}

function disconnect() {
  try { fs.unlinkSync(STATE_PATH); } catch {}
  return { ok: true };
}

module.exports = { isConnected, authorizeUrl, completeFakeConsent, disconnect };
