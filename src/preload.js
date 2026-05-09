const { contextBridge, ipcRenderer, webUtils } = require('electron');

const subs = {
  signal: new Set(),
  suggestions: new Set(),
  profile: new Set(),
  artifact: new Set(),
  signal_lost: new Set(),
};

for (const ch of Object.keys(subs)) {
  ipcRenderer.on(ch, (_e, payload) => {
    for (const fn of subs[ch]) {
      try { fn(payload); } catch (err) { console.error(err); }
    }
  });
}

function on(channel, fn) {
  if (!subs[channel]) return () => {};
  subs[channel].add(fn);
  return () => subs[channel].delete(fn);
}

contextBridge.exposeInMainWorld('shadow', {
  onSignal: (fn) => on('signal', fn),
  onSuggestions: (fn) => on('suggestions', fn),
  onProfile: (fn) => on('profile', fn),
  onArtifact: (fn) => on('artifact', fn),
  onSignalLost: (fn) => on('signal_lost', fn),
  voiceUtterance: (text, confidence) => ipcRenderer.invoke('voice/utterance', { text, confidence }),
  dropFiles: (paths) => ipcRenderer.invoke('file/drop', paths),
  clickSuggestion: (id) => ipcRenderer.invoke('suggestion/click', { id }),
  getQueueStats: () => ipcRenderer.invoke('queue/stats'),
  pathForFile: (file) => {
    try { return webUtils.getPathForFile(file); } catch { return null; }
  },
});
