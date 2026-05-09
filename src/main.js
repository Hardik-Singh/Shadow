const { app, BrowserWindow, Tray, Menu, screen, nativeImage, systemPreferences } = require('electron');
const path = require('path');

const config = require('./config');
const ipc = require('./ipc');
const screenCapture = require('./capture/screen');
const profile = require('./model/profile');
const suggest = require('./suggest/engine');
const registry = require('./actions/registry');

registry.register(require('./actions/ic-memo'));
registry.register(require('./actions/sourcing-sheet'));
registry.register(require('./actions/founder-lookup'));
registry.register(require('./actions/market-check'));
registry.register(require('./actions/flag-deal'));

let win = null;
let tray = null;

const HUD_WIDTH = 360;
const HUD_HEIGHT = 520;
const MARGIN = 16;

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
    resizable: false,
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

app.whenReady().then(async () => {
  if (process.platform === 'darwin' && app.dock) app.dock.hide();
  if (process.platform === 'darwin') {
    try { await systemPreferences.askForMediaAccess('microphone'); } catch (_) {}
  }

  createWindow();
  createTray();
  ipc.wire();
  screenCapture.start();
  profile.start();
  suggest.start();

  const hsMode = require('./ingest/hyperspell').isMock ? 'MOCK' : 'real';
  console.log(`[shadow] online — hyperspell=${hsMode} nia=${config.nia.enabled} vision=${config.anthropic.enabled}`);
});

app.on('window-all-closed', (e) => {
  e.preventDefault?.();
});
