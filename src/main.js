const { app, BrowserWindow, Tray, Menu, screen, nativeImage, systemPreferences, ipcMain, desktopCapturer, shell, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const { LiveSession } = require('./live/session');
const memory = require('./memory');

(function loadEnv() {
  try {
    const p = path.join(__dirname, '..', '.env');
    if (!fs.existsSync(p)) return;
    for (const raw of fs.readFileSync(p, 'utf8').split('\n')) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq < 0) continue;
      const k = line.slice(0, eq).trim();
      let v = line.slice(eq + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (!(k in process.env)) process.env[k] = v;
    }
  } catch (e) { console.error('[env]', e); }
})();

if (!process.env.HYPERSPELL_API_KEY || !process.env.HYPERSPELL_BASE || !process.env.HYPERSPELL_USER_ID) {
  process.env.HYPERSPELL_API_KEY ||= 'sk-test-mock';
  process.env.HYPERSPELL_BASE ||= 'mock://local';
  process.env.HYPERSPELL_USER_ID ||= 'hardik';
  console.warn('[env] using mock Hyperspell for local demo');
}

// ─── Memory layer (Hyperspell-backed) ─────────────────────────────────
// Defer requires until we know HYPERSPELL_API_KEY is set — config.js exits
// the process otherwise, which would kill the HUD on every dev run without
// real keys. So treat memory as opt-in: if Hyperspell isn't configured the
// HUD still boots and Gemini-Live captions still work, just nothing is
// persisted to memory.
let memoryEnabled = false;
let MemoryRepo = null;
let bus = null;
if (process.env.HYPERSPELL_API_KEY && process.env.HYPERSPELL_BASE && process.env.HYPERSPELL_USER_ID) {
  try {
    bus = require('./bus');
    MemoryRepo = require('./repos/memory');
    memoryEnabled = true;
    // The HUD's writes feed is driven by main's local memory module above.
    // We only forward suggestions + artifacts — the things the local memory
    // module doesn't compute. Hyperspell-backed memory writes themselves are
    // a silent mirror to the firm vault, not a duplicate UI feed.
    bus.on('suggestions', (list) => send('signal:suggestions', list));
    bus.on('artifact',    (a)    => send('signal:artifact', a));
    bus.on('thought',     (t)    => send('signal:thought', t));
    console.log('[memory] online — hyperspell-backed firm brain');
  } catch (e) {
    console.error('[memory] init failed', e && e.message);
    memoryEnabled = false;
  }
} else {
  console.log('[memory] disabled — set HYPERSPELL_API_KEY/BASE/USER_ID to enable');
}

let win = null;
let tray = null;
let inFlight = false;
let userFocus = '';
let live = null;
let liveLastFrameAt = 0;
let liveLastContextAt = 0;
let paused = false;
let demoNozomioStage = 0;
const demoThoughtLastAt = new Map();
let liveFailureCount = 0;
const LIVE_FRAME_INTERVAL_MS = 5000;
const LIVE_CONTEXT_INTERVAL_MS = 12000;

const HUD_WIDTH = 380;
const HUD_HEIGHT = 680;
const MARGIN = 16;

const VISION_MODEL = 'gemini-flash-latest';
const BASE_PROMPT = [
  "You are watching a venture capital partner's screen. Describe WHAT THEY ARE READING / DOING — not the application.",
  'Do NOT lead with the browser or app name (we already know it is Chrome / VS Code / etc). The app is the LEAST interesting thing.',
  'Read the actual on-screen text. Pull out names, numbers, headings, companies, people, metrics.',
  '',
  'Output ONE line. Format:  Document/Context · Specific thing in view',
  '',
  'Good examples:',
  '  YC W24 batch directory · scrolling, currently on "Acme Inc" card · B2B infra · $8M ask',
  '  IC Memo draft for Acme Inc · "Recommendation" section · cursor on empty paragraph',
  '  Acme Inc pitch deck · slide 4 "Team" · reading CTO James Chen bio (ex-Stripe, 4y eng lead)',
  '',
  'BAD outputs — never produce these:',
  '  "Chrome"   "browser"   "a website"   "PDF document"   "VS Code"   "an editor"',
  '',
  'No prose. No preamble. No quotes around the line. No emojis.',
  '',
  'After that line, output a SECOND line with structured fields the system parses:',
  '  SIGNAL: doc_type=<one of pitch_deck, spreadsheet, email, doc, code, browser, chat, calendar, other> | entity=<company/person/topic on screen, or —> | intents=<1-3 from evaluate, source, research, write, communicate, decide, browse, comma-separated>',
  'Example second line: SIGNAL: doc_type=pitch_deck | entity=Acme Inc | intents=evaluate,research',
  'TWO lines total. No extra lines.',
].join('\n');

function buildPrompt() {
  if (!userFocus) return BASE_PROMPT;
  return BASE_PROMPT
    + `\n\nThe user is specifically watching for: "${userFocus}"`
    + '\nWeight your description toward that — if you see anything related, call it out by name.';
}

function send(ch, payload) {
  if (!win || win.isDestroyed()) return;
  win.webContents.send(ch, payload);
}

function triggerNozomioDemo(source, signal) {
  if (process.env.SHADOW_DEMO_NOZOMIO === '0') return;
  const stage = demoNozomioStage === 0 ? 1 : demoNozomioStage === 1 ? 2 : null;
  if (!stage) return;
  if (stage === 2 && source === 'vision') {
    const keyword = signal && signal.keyword;
    if (!['deck', '.pdf', 'slide'].includes(keyword)) return;
  }
  demoNozomioStage = stage;
  send('demo:nozomio', {
    stage,
    source,
    keyword: signal && signal.keyword,
    raw: signal && signal.raw,
  });
}

function maybeSendDemoThought(text) {
  if (process.env.SHADOW_DEMO_NOZOMIO === '0') return;
  try {
    const { detectDemoThoughtSignal } = require('./suggest/vision-signal');
    const thought = detectDemoThoughtSignal(text);
    if (!thought) return;
    const now = Date.now();
    const last = demoThoughtLastAt.get(thought.id) || 0;
    if (now - last < 8000) return;
    demoThoughtLastAt.set(thought.id, now);
    send('signal:thought', {
      proactive: true,
      source: 'vision',
      text: thought.text,
      sources: { label: thought.label },
    });
  } catch {}
}

async function captionFrame(b64Jpeg) {
  if (paused) return;
  const key = process.env.GEMINI_API_KEY;
  if (!key) { send('signal:status', 'GEMINI_API_KEY not set'); return; }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${VISION_MODEL}:generateContent?key=${encodeURIComponent(key)}`;
  const body = {
    contents: [{
      role: 'user',
      parts: [
        { text: buildPrompt() },
        { inlineData: { mimeType: 'image/jpeg', data: b64Jpeg } },
      ],
    }],
    generationConfig: { temperature: 0.15, maxOutputTokens: 400 },
  };
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const txt = await res.text();
      console.error('[vision] http', res.status, txt.slice(0, 200));
      send('signal:status', `vision err ${res.status}`);
      return;
    }
    const j = await res.json();
    const text = (j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts || [])
      .map((p) => p.text || '').join('')
      .split('\n').map((l) => l.replace(/[ \t]+/g, ' ').trim()).filter(Boolean).join('\n');
    if (text) {
      send('signal:seeing', text);
      send('signal:status', 'connected');
      maybeSendDemoThought(text);
      try {
        const { detectNozomioDemoSignal } = require('./suggest/vision-signal');
        const demoSignal = detectNozomioDemoSignal(text);
        if (demoSignal) triggerNozomioDemo('vision', demoSignal);
      } catch {}
      // Local fast-path memory (drives signal:write feed in HUD).
      memory.noteScreen(text);
      // Hyperspell mirror — partner vault + firm vault. Silent: the local
      // memory module already pushes to the renderer feed; this fans out to
      // the durable cross-session firm brain.
      if (memoryEnabled && MemoryRepo) {
        try { MemoryRepo.create({ kind: 'screen', text }); }
        catch (e) { console.warn('[memory] screen write failed', e && e.message); }
        // Re-rank suggestions immediately against the new caption, and feed
        // partner+firm vault context into the live model so its next thought
        // can reference cross-session history.
        try { require('./suggest/engine').bumpFromScreen(text); } catch {}
        injectHyperspellContextToLive(text).catch(() => {});
      }
    }
  } catch (e) {
    console.error('[vision] fetch', e && e.message);
    send('signal:status', 'offline');
  }
}

// Pull a small partner+firm Hyperspell summary related to what's on screen
// and feed it into the Live session as scene-setting (no model turn). Keeps
// `live thoughts` aware of cross-session history without extra LLM calls.
let lastInjectedScreen = '';
let lastContextSource = null;
async function injectHyperspellContextToLive(screenText) {
  if (paused) return;
  if (!live || !live.ready) return;
  const now = Date.now();
  if (now - liveLastContextAt < LIVE_CONTEXT_INTERVAL_MS) return;
  if (screenText === lastInjectedScreen) return;
  liveLastContextAt = now;
  lastInjectedScreen = screenText;
  try {
    const hs = require('./ingest/hyperspell');
    const ctx = require('./context');
    const hits = await hs.search({
      scope: 'partner', partner: ctx.ME, firm: ctx.FIRM,
      query: screenText, k: 6, halfLifeHours: 24 * 14,
      sources: ['vault'],
    });
    if (!hits || !hits.length) return;
    const lines = hits
      .map((h) => (h.text || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .slice(0, 6)
      .map((t) => '- ' + t.slice(0, 140));
    if (!lines.length) return;
    const block = `Partner + firm memory matching "${screenText.slice(0, 80)}":\n` + lines.join('\n');
    live.injectSystemContext(block);
    lastContextSource = { count: hits.length, label: `partner vault · ${hits.length} memories` };
  } catch (e) {
    // Hyperspell failure is non-fatal — live thoughts continue without context.
  }
}

function startLive() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return;
  if (live) { try { live.close(); } catch {} }
  live = new LiveSession(key);
  live.on('ready', () => {
    liveFailureCount = 0;
    send('signal:status', 'live');
  });
  live.on('transcript', (text) => {
    send('signal:hearing', text);
    memory.noteTranscript(text);
  });
  live.on('model_response', (text) => {
    if (process.env.SHADOW_LIVE_THOUGHTS !== '1') return;
    // Attach the most recent Hyperspell context source (if any was injected
    // within the last ~30s) so the HUD can show provenance chips.
    const fresh = Date.now() - liveLastContextAt < 30000;
    const sources = fresh && lastContextSource ? lastContextSource : null;
    send('signal:thought', sources ? { text, sources } : text);
  });
  live.on('error', (e) => {
    console.error('[live] error', e && e.message);
  });
  live.on('closed', ({ code, reason }) => {
    console.warn('[live] closed', code, reason);
    liveFailureCount++;
    if (!paused && liveFailureCount >= 3) send('signal:status', 'live unavailable — screen demo still running');
    // simple reconnect after 3s if app still running
    if (!app.isReady()) return;
    if (liveFailureCount >= 3) return;
    setTimeout(() => { if (!paused && (live === null || live.closed)) startLive(); }, 3000);
  });
  live.connect();
}

function createWindow() {
  const { workArea } = screen.getPrimaryDisplay();
  const x = workArea.x + workArea.width - HUD_WIDTH - MARGIN;
  const y = workArea.y + MARGIN;

  win = new BrowserWindow({
    width: HUD_WIDTH,
    height: HUD_HEIGHT,
    x,
    y,
    frame: false,
    transparent: true,
    resizable: true,
    minWidth: 320,
    minHeight: 360,
    movable: true,
    hasShadow: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    focusable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.setAlwaysOnTop(true, 'floating');
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

function createTray() {
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setToolTip('Shadow');
  const menu = Menu.buildFromTemplate([
    { label: 'Show HUD', click: () => win && win.show() },
    { label: 'Hide HUD', click: () => win && win.hide() },
    { type: 'separator' },
    { label: 'Quit Shadow', role: 'quit' },
  ]);
  tray.setContextMenu(menu);
  tray.setTitle('●');
}

ipcMain.handle('shadow:get-sources', async () => {
  const sources = await desktopCapturer.getSources({ types: ['screen'] });
  return sources.map((s) => ({ id: s.id, name: s.name }));
});

ipcMain.on('shadow:frame', async (_e, b64Jpeg) => {
  if (!b64Jpeg || paused) return;

  // Throttled frame to live session for in-context vision.
  const now = Date.now();
  if (live && live.ready && now - liveLastFrameAt >= LIVE_FRAME_INTERVAL_MS) {
    liveLastFrameAt = now;
    live.sendFrame(b64Jpeg);
  }

  // Caption frame for the HUD "seeing" row + memory buffer.
  if (inFlight) return;
  inFlight = true;
  try { await captionFrame(b64Jpeg); }
  finally { inFlight = false; }
});

ipcMain.on('shadow:audio', (_e, b64Pcm) => {
  if (paused || !b64Pcm || !live || !live.ready) return;
  live.sendAudio(b64Pcm);
});

ipcMain.on('shadow:set-paused', (_e, next) => {
  const wasPaused = paused;
  paused = !!next;
  if (paused === wasPaused) return;
  if (paused) {
    if (memoryEnabled) {
      try { require('./suggest/engine').pause(); } catch {}
      try { require('./model/profile').stop(); } catch {}
    }
    send('signal:status', 'paused — no LLM calls');
  } else {
    if (!live || live.closed) {
      startLive();
    }
    if (memoryEnabled) {
      try { require('./suggest/engine').resume(); } catch {}
      try { require('./model/profile').start(); } catch {}
    }
    send('signal:status', live && live.ready ? 'live' : 'connected');
  }
});

// Voice transcript from renderer-side webkitSpeechRecognition. Renderer sends
// finalized utterances; we store as a `voice` memory and the bus + suggest
// engine + dashboard pick it up from there.
ipcMain.on('shadow:voice-text', (_e, payload) => {
  if (paused || !memoryEnabled || !MemoryRepo || !payload) return;
  const text = (typeof payload === 'string' ? payload : payload.text || '').trim();
  if (!text) return;
  const confidence = payload && payload.confidence;
  try {
    MemoryRepo.create({ kind: 'voice', text: '"' + text + '"', meta: { confidence } });
    // Also surface in the "watching now / hearing" row so the HUD shows it live.
    send('signal:hearing', text);
  } catch (e) { console.warn('[memory] voice write failed', e && e.message); }
});

// Click on a HUD suggestion pill — runs the action handler, which reads from
// Hyperspell, calls the LLM, and emits an `artifact` event that the renderer
// renders as a card.
ipcMain.handle('shadow:click-suggestion', async (_e, { id }) => {
  if (!memoryEnabled) return { error: 'memory layer not enabled' };
  try {
    const suggest = require('./suggest/engine');
    const registry = require('./actions/registry');
    const s = suggest.clickSuggestion(id);
    if (!s) return { error: 'unknown suggestion' };
    const result = await registry.run(s.action_id, { company: s.company_hint });
    bus.emit('artifact', result);
    return { ok: true, kind: result.kind };
  } catch (err) {
    console.warn('[suggest] action failed', err && err.message);
    return { error: err.message };
  }
});

// Manual memory edit/delete from the dashboard — bus events propagate to HUD.
ipcMain.handle('shadow:memory-list', () => {
  if (!memoryEnabled) return [];
  return require('./repos/memory').list({ limit: 100 });
});
ipcMain.handle('shadow:memory-edit', (_e, { id, text }) => {
  if (!memoryEnabled) return { error: 'memory layer not enabled' };
  return require('./repos/memory').update(id, { text });
});
ipcMain.handle('shadow:memory-delete', (_e, { id }) => {
  if (!memoryEnabled) return { error: 'memory layer not enabled' };
  return require('./repos/memory').remove(id);
});

ipcMain.handle('shadow:ingest-file', async (_e, { path: filePath, name }) => {
  try {
    const files = require('./capture/files');
    bus.emit('artifact', {
      kind: 'file_ingest',
      title: `ingesting ${name || filePath}`,
      status: 'pending',
      ts: Date.now(),
    });
    const result = await files.ingestFile(filePath);
    send('signal:write', { verb: 'ingested', text: name || filePath, ts: Date.now() });
    bus.emit('artifact', {
      kind: 'file_ingest',
      title: `ingested ${name || filePath}`,
      status: 'done',
      chunks: result && result.chunks,
      ts: Date.now(),
    });
    return { ok: true, ...result };
  } catch (err) {
    console.warn('[ingest-file] failed', err && err.message);
    return { error: err.message };
  }
});

ipcMain.on('shadow:set-focus', (_e, text) => {
  userFocus = (text || '').toString().slice(0, 500);
});

// Renderer cycles mode label only — backend records it as a focus hint.
ipcMain.on('shadow:set-mode', (_e, mode) => {
  if (typeof mode !== 'string' || !mode) return;
  if (memoryEnabled && MemoryRepo) {
    try { MemoryRepo.create({ kind: 'mode', text: `mode: ${mode}` }); } catch {}
  }
});

ipcMain.on('shadow:ask', (_e, text) => {
  if (!text) return;
  if (live && live.ready) live.injectPrompt(text);
});

ipcMain.handle('shadow:recent-memory', (_e, n) => {
  try { return memory.recent(typeof n === 'number' ? n : 20); }
  catch (e) { console.error('[memory] recent', e && e.message); return []; }
});

const DASHBOARD_BASE = process.env.SHADOW_DASHBOARD_URL || 'http://localhost:5173';

ipcMain.handle('shadow:open-dashboard', async (_e, qs) => {
  const target = typeof qs === 'string' ? qs : '';
  if (target.startsWith('/')) {
    await shell.openExternal(DASHBOARD_BASE + target);
    return;
  }
  const search = target.length ? (target.startsWith('?') ? target : '?' + target) : '';
  await shell.openExternal(DASHBOARD_BASE + '/' + search);
});

app.whenReady().then(async () => {
  if (process.platform === 'darwin' && app.dock) app.dock.hide();
  if (process.platform === 'darwin') {
    try { await systemPreferences.askForMediaAccess('microphone'); } catch (_) {}
  }
  createWindow();
  createTray();
  try {
    globalShortcut.register('CommandOrControl+Shift+D', () => triggerNozomioDemo('hotkey'));
  } catch (e) {
    console.warn('[demo] hotkey registration failed', e && e.message);
  }

  // Local memory module: route every saved row to the HUD writes feed.
  memory.onSaved((row) => {
    send('signal:write', { verb: row.verb, text: row.text, ts: row.ts });
  });
  try { memory.start(); } catch (e) { console.error('[memory] start', e && e.message); }

  startLive();

  // Hyperspell-backed memory engines (suggest + actions). Boot only when
  // the env vars are set; harmless no-op otherwise.
  if (memoryEnabled) {
    try {
      const profile = require('./model/profile');
      const suggest = require('./suggest/engine');
      const registry = require('./actions/registry');
      registry.register(require('./actions/ic-memo'));
      registry.register(require('./actions/sourcing-sheet'));
      registry.register(require('./actions/founder-lookup'));
      registry.register(require('./actions/market-check'));
      registry.register(require('./actions/flag-deal'));
      profile.start();
      suggest.start();

      // Reasoning agents — register before scheduler boots so the first
      // tick has a non-empty registry.
      const reason = require('./reason');
      const { ScreenFocusAgent } = require('./reason/agents/screen-focus');
      const { ActionPreferenceAgent } = require('./reason/agents/action-preference');
      reason.registry.register(new ScreenFocusAgent({ extractCompany: suggest.extractCompany }));
      reason.registry.register(new ActionPreferenceAgent());

      try {
        const config = require('./config');
        require('./proactive/scheduler').start({
          suggest, bus, config, profile,
          MemoryRepo,
          extractCompany: suggest.extractCompany,
          reason,
        });
      } catch (e) { console.error('[proactive] start', e && e.message); }
    } catch (e) { console.error('[engines] failed to start', e && e.message); }
  }

  // Dashboard HTTP/SSE bridge. Always on (localhost-only); the web app falls
  // back to mock data when this isn't reachable, so it's safe to skip if it
  // can't bind.
  try {
    const dashboardApi = require('./server/dashboard-api');
    dashboardApi.start({ port: Number(process.env.SHADOW_API_PORT) || 4310 });
  } catch (e) { console.warn('[dashboard-api] start failed', e && e.message); }

  win.webContents.once('did-finish-load', () => {
    if (!win || win.isDestroyed()) return;
    if (process.platform === 'darwin') {
      const status = systemPreferences.getMediaAccessStatus('screen');
      if (status !== 'granted') send('signal:status', 'grant Screen Recording in System Settings > Privacy');
    }
    // Hydrate HUD with the most recent durable signals from prior sessions.
    try {
      const recent = memory.recent(8).reverse();
      for (const r of recent) send('signal:write', { verb: r.verb, text: r.text, ts: r.ts, historical: true });
    } catch {}
  });
});

app.on('before-quit', () => {
  try { globalShortcut.unregister('CommandOrControl+Shift+D'); } catch {}
  try { memory.stop(); } catch {}
  try { require('./proactive/scheduler').stop(); } catch {}
  if (live) { try { live.close(); } catch {} }
});

app.on('window-all-closed', (e) => { e.preventDefault?.(); });
