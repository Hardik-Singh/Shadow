const { ipcMain, BrowserWindow } = require('electron');
const bus = require('./bus');
const voice = require('./capture/voice');
const files = require('./capture/files');
const suggest = require('./suggest/engine');
const registry = require('./actions/registry');
const queue = require('./ingest/queue');

function broadcast(channel, payload) {
  for (const w of BrowserWindow.getAllWindows()) {
    if (!w.isDestroyed()) w.webContents.send(channel, payload);
  }
}

function wire() {
  bus.on('signal', (env) => broadcast('signal', { type: env.type, content: env.content, ts: env.ts, meta: env.meta }));
  bus.on('suggestions', (s) => broadcast('suggestions', s));
  bus.on('profile', (p) => broadcast('profile', p));
  bus.on('artifact', (a) => broadcast('artifact', a));
  bus.on('signal_lost', (e) => broadcast('signal_lost', e));
  bus.on('queue:depth', (d) => broadcast('queue:depth', d));

  ipcMain.handle('voice/utterance', (_e, { text, confidence }) => {
    voice.ingestUtterance(text, confidence);
    return { ok: true };
  });

  ipcMain.handle('file/drop', async (_e, paths) => {
    const out = [];
    for (const p of paths || []) {
      try {
        out.push(await files.ingestFile(p));
      } catch (err) {
        console.warn('[ipc] file/drop failed', p, err && err.message);
      }
    }
    return out;
  });

  ipcMain.handle('suggestion/click', async (_e, { id }) => {
    const s = suggest.clickSuggestion(id);
    if (!s) return { error: 'unknown suggestion' };
    try {
      const result = await registry.run(s.action_id, { company: s.company_hint });
      bus.emit('artifact', result);
      return { ok: true, kind: result.kind };
    } catch (err) {
      console.warn('[ipc] action failed', err && err.message);
      return { error: err.message };
    }
  });

  ipcMain.handle('queue/stats', () => queue.stats());
}

module.exports = { wire };
