const path = require('path');
const fs = require('fs');
const oauth = require('./oauth');

const FIXTURES = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures.json'), 'utf8'));

function listDocs({ provider, query } = {}) {
  if (!oauth.isConnected()) return { connected: false, docs: [] };
  const q = (query || '').toLowerCase();
  const matches = FIXTURES.docs.filter((d) => {
    if (provider && d.provider !== provider) return false;
    if (!q) return true;
    return [d.title, d.snippet].join(' ').toLowerCase().includes(q);
  });
  return { connected: true, docs: matches };
}

function readDoc(id) {
  if (!oauth.isConnected()) return null;
  return FIXTURES.docs.find((d) => d.id === id) || null;
}

module.exports = { listDocs, readDoc };
