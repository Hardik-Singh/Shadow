const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('shadow', {
  // ─── Existing main HUD surface ─────────────────────────────────────
  getSources: () => ipcRenderer.invoke('shadow:get-sources'),
  sendFrame: (b64) => ipcRenderer.send('shadow:frame', b64),
  sendAudio: (b64) => ipcRenderer.send('shadow:audio', b64),
  onSeeing: (cb) => ipcRenderer.on('signal:seeing', (_e, t) => cb(t)),
  onHearing: (cb) => ipcRenderer.on('signal:hearing', (_e, t) => cb(t)),
  onStatus: (cb) => ipcRenderer.on('signal:status', (_e, t) => cb(t)),
  onWrite: (cb) => ipcRenderer.on('signal:write', (_e, row) => cb(row)),
  onThought: (cb) => ipcRenderer.on('signal:thought', (_e, t) => cb(t)),
  onNozomioDemo: (cb) => ipcRenderer.on('demo:nozomio', (_e, payload) => cb(payload)),
  openInDashboard: (qs) => ipcRenderer.invoke('shadow:open-dashboard', qs),
  setFocus: (text) => ipcRenderer.send('shadow:set-focus', text),
  ask: (text) => ipcRenderer.send('shadow:ask', text),
  setPaused: (paused) => ipcRenderer.send('shadow:set-paused', !!paused),
  setMode: (mode) => ipcRenderer.send('shadow:set-mode', mode),
  recentMemory: (n) => ipcRenderer.invoke('shadow:recent-memory', n),

  // ─── Memory layer (Hyperspell-backed firm brain) ──────────────────
  // The HUD's writes feed comes from main's local SQLite memory module
  // (above). These additional channels expose the Hyperspell-backed
  // suggest engine + action handlers on top.
  voiceUtterance: (text, confidence) =>
    ipcRenderer.send('shadow:voice-text', { text, confidence }),
  onSuggestions:  (cb)        => ipcRenderer.on('signal:suggestions',   (_e, l) => cb(l)),
  onArtifact:     (cb)        => ipcRenderer.on('signal:artifact',      (_e, a) => cb(a)),
  clickSuggestion: (id)       => ipcRenderer.invoke('shadow:click-suggestion', { id }),
  listMemories:    ()         => ipcRenderer.invoke('shadow:memory-list'),
  editMemory:      (id, text) => ipcRenderer.invoke('shadow:memory-edit',   { id, text }),
  deleteMemory:    (id)       => ipcRenderer.invoke('shadow:memory-delete', { id }),
  ingestFile:      (info)     => ipcRenderer.invoke('shadow:ingest-file',   info),
});
