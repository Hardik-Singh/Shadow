const { app, BrowserWindow, Tray, Menu, screen, nativeImage, systemPreferences } = require('electron');
const path = require('path');

let win = null;
let tray = null;

const HUD_WIDTH = 300;
const HUD_HEIGHT = 72;
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
  // Empty 16x16 template image — macOS shows a faint dot; replace with a real icon later.
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setToolTip('Shadow');

  const menu = Menu.buildFromTemplate([
    {
      label: 'Show HUD',
      click: () => win && win.show(),
    },
    {
      label: 'Hide HUD',
      click: () => win && win.hide(),
    },
    { type: 'separator' },
    { label: 'Quit Shadow', role: 'quit' },
  ]);
  tray.setContextMenu(menu);
  tray.setTitle('●'); // visible label in menu bar since icon is empty
}

app.whenReady().then(async () => {
  if (process.platform === 'darwin' && app.dock) {
    app.dock.hide();
  }
  if (process.platform === 'darwin') {
    try {
      await systemPreferences.askForMediaAccess('microphone');
    } catch (_) {}
  }
  createWindow();
  createTray();
});

// Keep running when all windows are closed — this is an always-on overlay.
app.on('window-all-closed', (e) => {
  e.preventDefault?.();
});
