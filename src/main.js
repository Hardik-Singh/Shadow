const { app, BrowserWindow, Tray, Menu, screen, nativeImage, systemPreferences, ipcMain, desktopCapturer, shell } = require('electron');
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

let win = null;
let tray = null;
let inFlight = false;
let userFocus = '';
let live = null;
let liveLastFrameAt = 0;
const LIVE_FRAME_INTERVAL_MS = 5000;

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
  'No prose. No preamble. No quotes around the line. No emojis. ONE line only.',
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

async function captionFrame(b64Jpeg) {
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
      .map((p) => p.text || '').join('').replace(/\s+/g, ' ').trim();
    if (text) {
      send('signal:seeing', text);
      send('signal:status', 'connected');
      memory.noteScreen(text);
    }
  } catch (e) {
    console.error('[vision] fetch', e && e.message);
    send('signal:status', 'offline');
  }
}

function startLive() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return;
  if (live) { try { live.close(); } catch {} }
  live = new LiveSession(key);
  live.on('ready', () => {
    send('signal:status', 'live');
  });
  live.on('transcript', (text) => {
    send('signal:hearing', text);
    memory.noteTranscript(text);
  });
  live.on('model_response', (text) => {
    send('signal:thought', text);
  });
  live.on('error', (e) => {
    console.error('[live] error', e && e.message);
  });
  live.on('closed', ({ code, reason }) => {
    console.warn('[live] closed', code, reason);
    send('signal:status', 'live offline');
    // simple reconnect after 3s if app still running
    if (!app.isReady()) return;
    setTimeout(() => { if (live === null || live.closed) startLive(); }, 3000);
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
  if (!b64Jpeg) return;

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
  if (!b64Pcm || !live || !live.ready) return;
  live.sendAudio(b64Pcm);
});

ipcMain.on('shadow:set-focus', (_e, text) => {
  userFocus = (text || '').toString().slice(0, 500);
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
  const search = typeof qs === 'string' && qs.length ? (qs.startsWith('?') ? qs : '?' + qs) : '';
  await shell.openExternal(DASHBOARD_BASE + '/' + search);
});

app.whenReady().then(async () => {
  if (process.platform === 'darwin' && app.dock) app.dock.hide();
  if (process.platform === 'darwin') {
    try { await systemPreferences.askForMediaAccess('microphone'); } catch (_) {}
  }
  createWindow();
  createTray();

  // Memory: route every saved row to the HUD writes feed.
  memory.onSaved((row) => {
    send('signal:write', { verb: row.verb, text: row.text, ts: row.ts });
  });
  try { memory.start(); } catch (e) { console.error('[memory] start', e && e.message); }

  startLive();

  win.webContents.once('did-finish-load', () => {
    if (process.platform === 'darwin') {
      const status = systemPreferences.getMediaAccessStatus('screen');
      if (status !== 'granted') send('signal:status', 'grant Screen Recording in System Settings → Privacy');
    }
    // Hydrate HUD with the most recent durable signals from prior sessions.
    try {
      const recent = memory.recent(8).reverse();
      for (const r of recent) send('signal:write', { verb: r.verb, text: r.text, ts: r.ts, historical: true });
    } catch {}
  });
});

app.on('before-quit', () => {
  try { memory.stop(); } catch {}
  if (live) { try { live.close(); } catch {} }
});

app.on('window-all-closed', (e) => { e.preventDefault?.(); });
