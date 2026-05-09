const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('shadow', {
  getSources: () => ipcRenderer.invoke('shadow:get-sources'),
  sendFrame: (b64) => ipcRenderer.send('shadow:frame', b64),
  sendAudio: (b64) => ipcRenderer.send('shadow:audio', b64),
  onSeeing: (cb) => ipcRenderer.on('signal:seeing', (_e, t) => cb(t)),
  onHearing: (cb) => ipcRenderer.on('signal:hearing', (_e, t) => cb(t)),
  onStatus: (cb) => ipcRenderer.on('signal:status', (_e, t) => cb(t)),
  onWrite: (cb) => ipcRenderer.on('signal:write', (_e, row) => cb(row)),
  onThought: (cb) => ipcRenderer.on('signal:thought', (_e, t) => cb(t)),
  openInDashboard: (qs) => ipcRenderer.invoke('shadow:open-dashboard', qs),
  setFocus: (text) => ipcRenderer.send('shadow:set-focus', text),
  ask: (text) => ipcRenderer.send('shadow:ask', text),
  recentMemory: (n) => ipcRenderer.invoke('shadow:recent-memory', n),
});
