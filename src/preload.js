const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('shadow', {});
