const path = require('path');
const fs = require('fs');
const oauth = require('./oauth');

const FIXTURES = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures.json'), 'utf8'));

function priorMeetings({ founder, company, since } = {}) {
  if (!oauth.isConnected()) return { connected: false, events: [] };
  const q = (founder || company || '').toLowerCase();
  const matches = FIXTURES.events.filter((e) => {
    if (since && new Date(e.start).getTime() < new Date(since).getTime()) return false;
    if (!q) return true;
    return [e.title, ...(e.attendees || [])].join(' ').toLowerCase().includes(q);
  });
  return { connected: true, events: matches };
}

function getEvent(id) {
  if (!oauth.isConnected()) return null;
  return FIXTURES.events.find((e) => e.id === id) || null;
}

module.exports = { priorMeetings, getEvent };
