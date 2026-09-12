import { app, BrowserWindow, shell } from 'electron';

const URL = 'https://www.facebook.com/messages';

function isAllowedHost(hostname) {
  return (
    hostname === 'facebook.com' ||
    hostname.endsWith('.facebook.com') ||
    hostname === 'messenger.com' ||
    hostname.endsWith('.messenger.com')
  );
}

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    webPreferences: {
      partition: 'persist:messenger',
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!isAllowedHost(new URL(url).hostname)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.loadURL(URL);
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(createWindow);

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}
