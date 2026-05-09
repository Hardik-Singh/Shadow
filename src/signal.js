const { randomUUID } = require('crypto');

let sessionId = randomUUID();

function makeEnvelope({ type, content, meta = {}, valence = 0, userId }) {
  return {
    id: randomUUID(),
    ts: Date.now(),
    user_id: userId,
    session_id: sessionId,
    type,
    content,
    meta,
    valence,
  };
}

function getSessionId() {
  return sessionId;
}

function resetSession() {
  sessionId = randomUUID();
  return sessionId;
}

module.exports = { makeEnvelope, getSessionId, resetSession };
