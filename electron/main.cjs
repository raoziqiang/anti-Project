const { app, BrowserWindow, ipcMain, Tray, Menu, screen, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { startServer, PORT, getStoredConfig, saveStoredConfig } = require('./server.cjs');

// Performance optimization switches for smooth transparent window & low latency
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('enable-gpu-rasterization');

// Explicitly define application name so userData folder is unified in dev & prod
app.name = 'AI-Desktop-Pet';

// Enforce single instance lock to avoid port collisions and duplicate desktop pets
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  console.log('[Electron] Another instance is already running. Quitting secondary instance.');
  app.quit();
  process.exit(0);
}

let petWindow = null;
let studioWindow = null;
let tray = null;
let isDevServerAlive = false;

app.on('second-instance', () => {
  if (petWindow && !petWindow.isDestroyed()) {
    if (petWindow.isMinimized()) petWindow.restore();
    if (!petWindow.isVisible()) petWindow.show();
    petWindow.focus();
  }
});

const DEV_URL = 'http://localhost:5173';

function checkDevServer() {
  return new Promise((resolve) => {
    const req = http.get(DEV_URL, () => {
      resolve(true);
    });
    req.on('error', () => {
      resolve(false);
    });
    req.setTimeout(250, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function loadAppUrl(win, viewName) {
  const distHtml = path.join(__dirname, '../dist/index.html');
  if (isDevServerAlive) {
    win.loadURL(`${DEV_URL}?view=${viewName}`).catch(() => {
      win.loadFile(distHtml, { search: `?view=${viewName}` });
    });
  } else {
    win.loadFile(distHtml, { search: `?view=${viewName}` });
  }
}

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged || process.env.ELECTRON_IS_DEV === '1';

function setupDevShortcuts(win) {
  if (!win || win.isDestroyed()) return;

  win.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;

    // F12 or Ctrl+Shift+I: Open Chrome DevTools
    if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
      win.webContents.toggleDevTools();
      event.preventDefault();
    }

    // F5 or Ctrl+R: Refresh page
    if (input.key === 'F5' || (input.control && !input.shift && input.key.toLowerCase() === 'r')) {
      win.webContents.reload();
      event.preventDefault();
    }

    // Ctrl+Shift+R: Hard reload ignoring cache
    if (input.control && input.shift && input.key.toLowerCase() === 'r') {
      win.webContents.reloadIgnoringCache();
      event.preventDefault();
    }
  });
}

function createPetWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  const winWidth = 400;
  const winHeight = 540;

  const appIconPath = path.join(__dirname, 'icon.png');

  petWindow = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    x: screenWidth - winWidth - 30,
    y: screenHeight - winHeight - 20,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    hasShadow: false,
    skipTaskbar: false,
    icon: appIconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // allow local blob/media
      backgroundThrottling: false, // Prevents 1fps throttle when unfocused
      spellcheck: false
    }
  });

  loadAppUrl(petWindow, 'pet');

  if (isDev) {
    setupDevShortcuts(petWindow);
  }

  petWindow.on('closed', () => {
    petWindow = null;
  });

  // Mouse ignore handling for transparent desktop click-through
  ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) {
      win.setIgnoreMouseEvents(ignore, { forward: true, ...options });
    }
  });

  ipcMain.on('set-always-on-top', (event, val) => {
    if (petWindow && !petWindow.isDestroyed()) {
      petWindow.setAlwaysOnTop(val);
    }
  });

  ipcMain.on('set-pet-window-size', (event, size) => {
    if (petWindow && !petWindow.isDestroyed() && size) {
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
      const targetWidth = Math.max(280, Math.min(650, Math.round(size.width || 380)));
      const targetHeight = Math.max(380, Math.min(800, Math.round(size.height || 500)));
      
      const bounds = petWindow.getBounds();
      const newX = bounds.x + bounds.width - targetWidth;
      const newY = bounds.y + bounds.height - targetHeight;

      petWindow.setBounds({
        x: Math.max(0, Math.min(screenWidth - targetWidth, newX)),
        y: Math.max(0, Math.min(screenHeight - targetHeight, newY)),
        width: targetWidth,
        height: targetHeight
      });
    }
  });
}

function createStudioWindow(tab) {
  if (studioWindow && !studioWindow.isDestroyed()) {
    if (studioWindow.isMinimized()) studioWindow.restore();
    studioWindow.show();
    studioWindow.focus();
    if (tab) {
      studioWindow.webContents.send('switch-tab', tab);
    }
    return;
  }

  const appIconPath = path.join(__dirname, 'icon.png');

  studioWindow = new BrowserWindow({
    width: 1040,
    height: 740,
    minWidth: 800,
    minHeight: 600,
    frame: true,
    title: 'AI 桌面伴侣 - 控制与设置中心',
    backgroundColor: '#090d16',
    icon: appIconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      spellcheck: false
    }
  });

  const query = tab ? `studio&tab=${tab}` : 'studio';
  loadAppUrl(studioWindow, query);

  if (isDev) {
    setupDevShortcuts(studioWindow);
  }

  studioWindow.on('closed', () => {
    studioWindow = null;
  });
}

function setupTray() {
  const trayIconPath = (process.platform === 'win32' && fs.existsSync(path.join(__dirname, 'icon.ico')))
    ? path.join(__dirname, 'icon.ico')
    : path.join(__dirname, 'tray-icon.png');

  tray = new Tray(trayIconPath);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '🐾 AI 桌面伴侣 (运行中)',
      enabled: false
    },
    { type: 'separator' },
    {
      label: '🎨 形象工坊与媒体二次元化',
      click: () => createStudioWindow('stylize')
    },
    {
      label: '🎵 音频与声音控制中心',
      click: () => createStudioWindow('audio')
    },
    {
      label: '🤖 大模型与 Agent 协作中心',
      click: () => createStudioWindow('llm')
    },
    {
      label: '⚙️ 伴侣角色与全局偏好',
      click: () => createStudioWindow('pets')
    },
    { type: 'separator' },
    {
      label: '👁️ 显示 / 隐藏伴侣',
      click: () => {
        if (petWindow && !petWindow.isDestroyed()) {
          if (petWindow.isVisible()) {
            petWindow.hide();
          } else {
            petWindow.show();
            petWindow.focus();
          }
        }
      }
    },
    {
      label: '❌ 退出应用',
      click: () => app.quit()
    }
  ]);

  tray.setToolTip('AI 桌面宠物 & Agent 协作中心');
  tray.setContextMenu(contextMenu);

  // Explicit right-click listener guarantees context menu popup on Windows taskbar
  tray.on('right-click', () => {
    tray.popUpContextMenu(contextMenu);
  });

  // Left click restores and focuses pet window
  tray.on('click', () => {
    if (petWindow && !petWindow.isDestroyed()) {
      if (petWindow.isMinimized()) petWindow.restore();
      if (!petWindow.isVisible()) {
        petWindow.show();
      }
      petWindow.focus();
    }
  });

  tray.on('double-click', () => {
    createStudioWindow();
  });
}

// IPC Handlers
ipcMain.on('open-studio', (event, tab) => {
  createStudioWindow(tab);
});

ipcMain.on('close-app', () => {
  app.quit();
});

ipcMain.handle('load-config', () => {
  return getStoredConfig();
});

ipcMain.handle('save-config', (event, patch) => {
  const updated = saveStoredConfig(patch);
  // Broadcast to all open renderer windows
  const windows = BrowserWindow.getAllWindows();
  for (const win of windows) {
    if (!win.isDestroyed() && win.webContents !== event.sender) {
      win.webContents.send('config-updated', updated);
    }
  }
  return updated;
});

app.whenReady().then(async () => {
  // 1. Detect if Vite development server is online
  isDevServerAlive = await checkDevServer();
  if (isDevServerAlive) {
    console.log(`[Electron] Connected to Vite Dev Server at ${DEV_URL}`);
  } else {
    console.log('[Electron] Vite Dev Server offline. Loading local production bundle from dist/index.html');
  }

  // 2. Start background Express & WebSocket gateway
  try {
    await startServer(PORT);
  } catch (err) {
    console.error('Failed to start local pet gateway:', err);
  }

  createPetWindow();
  setupTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createPetWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Keep running in tray unless explicitly quit
    // But if studio closed and pet closed, quit
    if (!petWindow && !studioWindow) {
      app.quit();
    }
  }
});
