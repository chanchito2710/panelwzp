const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const ensureDir = (p) => {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
};

let backendStarted = false;
let stopBackendFn = null;

const startBackend = async () => {
  const userData = app.getPath('userData');
  const dbRoot = path.join(userData, 'db');
  ensureDir(dbRoot);
  ensureDir(path.join(dbRoot, 'auth'));
  ensureDir(path.join(dbRoot, 'storage'));
  ensureDir(path.join(dbRoot, 'exports'));

  process.env.DB_ROOT = dbRoot;

  const backend = require('backend');
  if (typeof backend.startBackend !== 'function') {
    throw new Error('backend.startBackend no disponible');
  }
  stopBackendFn = typeof backend.stopBackend === 'function' ? backend.stopBackend : null;

  try {
    await backend.startBackend(5000);
    backendStarted = true;
  } catch (e) {
    const msg = String(e && e.message ? e.message : e);
    if (msg.includes('EADDRINUSE') || msg.includes('address already in use')) {
      backendStarted = false;
      return;
    }
    throw e;
  }
};

const createWindow = async () => {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  if (app.isPackaged) {
    await win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  } else {
    await win.loadURL('http://localhost:3000/');
  }
};

app.on('window-all-closed', async () => {
  if (process.platform !== 'darwin') {
    try {
      if (backendStarted && stopBackendFn) await stopBackendFn();
    } catch {}
    app.quit();
  }
});

app.whenReady().then(async () => {
  try {
    await startBackend();
  } catch (e) {
    dialog.showErrorBox('Error iniciando backend', String(e && e.message ? e.message : e));
  }

  await createWindow();

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) await createWindow();
  });
});
