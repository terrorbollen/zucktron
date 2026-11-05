import { app, BrowserWindow, shell } from 'electron';

const MESSENGER_URL = 'https://www.facebook.com/messages';
const WEB_PREFERENCES = {
  partition: 'persist:messenger',
  contextIsolation: true,
  nodeIntegration: false,
};

function isAllowedHost(hostname) {
  return (
    hostname === 'facebook.com' ||
    hostname.endsWith('.facebook.com') ||
    hostname === 'messenger.com' ||
    hostname.endsWith('.messenger.com')
  );
}

// Messenger opens the call window as about:blank, then navigates it.
function isCallPopup(url) {
  if (url.startsWith('about:blank')) return true;
  const { hostname, pathname } = new URL(url);
  return isAllowedHost(hostname) && /^\/(groupcall|videocall)\//.test(pathname);
}

function guardNavigation(contents) {
  contents.setWindowOpenHandler(({ url }) => {
    if (isCallPopup(url)) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: { webPreferences: WEB_PREFERENCES },
      };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  contents.on('did-create-window', (window) => guardNavigation(window.webContents));

  contents.on('will-navigate', (event, url) => {
    if (!isAllowedHost(new URL(url).hostname)) {
      event.preventDefault();
      shell.openExternal(url);
      // A blank popup that turned out to be an external link would stay empty.
      if (contents.getURL().startsWith('about:blank')) contents.close();
    }
  });
}

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({ webPreferences: WEB_PREFERENCES });

  guardNavigation(mainWindow.webContents);

  mainWindow.loadURL(MESSENGER_URL);
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
