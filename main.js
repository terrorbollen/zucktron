import { app, BrowserWindow, session, shell } from 'electron';

const MESSENGER_URL = 'https://www.facebook.com/messages';
const PARTITION = 'persist:messenger';
const WEB_PREFERENCES = {
  partition: PARTITION,
  contextIsolation: true,
  nodeIntegration: false,
};
const ALLOWED_PERMISSIONS = new Set([
  'clipboard-sanitized-write',
  'fullscreen',
  'media',
  'notifications',
  'screen-wake-lock',
  'speaker-selection',
]);

function isAllowedHost(hostname) {
  return (
    hostname === 'facebook.com' ||
    hostname.endsWith('.facebook.com') ||
    hostname === 'messenger.com' ||
    hostname.endsWith('.messenger.com')
  );
}

function isPermissionAllowed(permission, url) {
  const parsed = URL.parse(url);
  return (
    ALLOWED_PERMISSIONS.has(permission) &&
    parsed?.protocol === 'https:' &&
    isAllowedHost(parsed.hostname)
  );
}

function restrictPermissions() {
  const messengerSession = session.fromPartition(PARTITION);
  // A blank call popup's URL is about:blank; its securityOrigin is the page that opened it.
  messengerSession.setPermissionRequestHandler((_contents, permission, callback, details) => {
    callback(isPermissionAllowed(permission, details.securityOrigin ?? details.requestingUrl));
  });
  messengerSession.setPermissionCheckHandler((_contents, permission, requestingOrigin) =>
    isPermissionAllowed(permission, requestingOrigin),
  );
}

// file: and custom schemes would let a page launch things on this machine.
function openInBrowser(url) {
  if (/^https?:/.test(url)) shell.openExternal(url);
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
    openInBrowser(url);
    return { action: 'deny' };
  });

  contents.on('did-create-window', (window) => guardNavigation(window.webContents));

  const keepOnFacebook = (event, url) => {
    if (!isAllowedHost(new URL(url).hostname)) {
      event.preventDefault();
      openInBrowser(url);
      // A blank popup that turned out to be an external link would stay empty.
      if (contents.getURL().startsWith('about:blank')) contents.close();
    }
  };

  contents.on('will-navigate', keepOnFacebook);
  // Embedded frames redirect across sites all the time; only the page itself matters.
  contents.on('will-redirect', (event, url) => {
    if (event.isMainFrame) keepOnFacebook(event, url);
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

  app.whenReady().then(() => {
    restrictPermissions();
    createWindow();
  });

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
