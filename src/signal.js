let sessionId = `sess_${Date.now().toString(36)}`;

function getSessionId() {
  return sessionId;
}

function resetSessionId() {
  sessionId = `sess_${Date.now().toString(36)}`;
  return sessionId;
}

module.exports = { getSessionId, resetSessionId };
