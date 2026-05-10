// Tiny HTTP+SSE bridge so the web dashboard at :5173 can subscribe to the
// real artifact stream produced by the action handlers (Hyperspell + Nia +
// Anthropic). Localhost-only, no auth — dev tool.

const http = require('http');
const url = require('url');
const Artifacts = require('../repos/artifacts');
const FirmVerdicts = require('../repos/firm-verdicts');
const { chat } = require('./chat');
const { createDemoArtifact } = require('./demo-actions');
const ctx = require('../context');
let bus = null;
try { bus = require('../bus'); } catch {}

const DEFAULT_PORT = 4310;
const ALLOWED_ORIGIN = process.env.SHADOW_DASHBOARD_URL || 'http://localhost:5173';
const MAX_BODY_BYTES = 32 * 1024;

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY_BYTES) { reject(new Error('body too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); }
      catch (err) { reject(err); }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, body) {
  setCors(res);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

async function handleRequest(req, res) {
  const u = url.parse(req.url, true);
  if (req.method === 'OPTIONS') { setCors(res); res.writeHead(204); res.end(); return; }

  if (req.method === 'GET' && u.pathname === '/partners') {
    const partners = ctx.ALL_PARTNERS.map((p) => ({
      id: p.id, name: p.name, role: p.role, initials: p.initials, is_me: !!p.is_me,
    }));
    return sendJson(res, 200, partners);
  }

  if (req.method === 'POST' && u.pathname === '/chat') {
    let body;
    try { body = await readJsonBody(req); }
    catch (err) { return sendJson(res, 400, { error: `bad body: ${err.message}` }); }
    try {
      const out = await chat(body || {});
      return sendJson(res, 200, out);
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  if (req.method === 'GET' && u.pathname === '/profile/weights') {
    try {
      const ProfileWeights = require('../repos/profile-weights');
      return sendJson(res, 200, ProfileWeights.weights());
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  if (req.method === 'POST' && u.pathname === '/demo/actions') {
    let body;
    try { body = await readJsonBody(req); }
    catch (err) { return sendJson(res, 400, { error: `bad body: ${err.message}` }); }
    try {
      const artifact = createDemoArtifact(body || {});
      return sendJson(res, 201, artifact);
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  if (req.method === 'GET' && u.pathname === '/artifacts') {
    return sendJson(res, 200, Artifacts.list({ limit: Number(u.query.limit) || 100 }));
  }
  if (req.method === 'GET' && u.pathname === '/relations') {
    return sendJson(res, 200, Artifacts.relations({
      company: u.query.company,
      type: u.query.type,
      id: u.query.artifact,
    }));
  }
  if (req.method === 'GET' && /^\/artifacts\/[^/]+$/.test(u.pathname)) {
    const id = u.pathname.split('/')[2];
    const a = Artifacts.get(id);
    if (!a) return sendJson(res, 404, { error: 'not found' });
    return sendJson(res, 200, a);
  }
  if (req.method === 'GET' && u.pathname === '/diagnostics') {
    let nia = null;
    if (process.env.HYPERSPELL_API_KEY && process.env.NIA_API_KEY) {
      try { nia = require('../ingest/nia').diagnostics(); } catch {}
    }
    return sendJson(res, 200, { nia, artifactCount: Artifacts.list({ limit: 999 }).length });
  }
  if (req.method === 'GET' && u.pathname === '/events') {
    setCors(res);
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });
    res.write(`event: ping\ndata: connected\n\n`);
    const onArtifact = (a) => {
      try { res.write(`event: artifact\ndata: ${JSON.stringify(a)}\n\n`); } catch {}
    };
    const heartbeat = setInterval(() => { try { res.write(`event: ping\ndata: ${Date.now()}\n\n`); } catch {} }, 25000);
    if (bus) bus.on('artifacts:new', onArtifact);
    req.on('close', () => {
      clearInterval(heartbeat);
      if (bus) bus.off('artifacts:new', onArtifact);
    });
    return;
  }
  return sendJson(res, 404, { error: 'not found' });
}

function start({ port = DEFAULT_PORT } = {}) {
  const server = http.createServer(handleRequest);
  server.on('error', (err) => {
    console.warn('[dashboard-api] failed to bind:', err && err.message);
  });
  server.listen(port, '127.0.0.1', () => {
    console.log(`[dashboard-api] listening on http://127.0.0.1:${port}`);
  });
  return server;
}

module.exports = { start };
