// Slack client — exposes the read APIs the artifact actions need.
// Fixture-backed for the demo; swap implementations behind these names
// to talk to real Slack.

const path = require('path');
const fs = require('fs');
const oauth = require('./oauth');

const FIXTURES = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures.json'), 'utf8'));

function searchThreads({ query, since } = {}) {
  if (!oauth.isConnected()) return { connected: false, threads: [] };
  const q = (query || '').toLowerCase();
  const matches = FIXTURES.threads.filter((t) => {
    if (since && new Date(t.ts).getTime() < new Date(since).getTime()) return false;
    if (!q) return true;
    const blob = [t.text, t.channel, t.author, ...(t.replies || []).map((r) => r.text)]
      .join(' ').toLowerCase();
    return blob.includes(q);
  });
  return { connected: true, threads: matches };
}

function getThread(id) {
  if (!oauth.isConnected()) return null;
  return FIXTURES.threads.find((t) => t.id === id) || null;
}

module.exports = { searchThreads, getThread };
