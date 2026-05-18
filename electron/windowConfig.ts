import { BrowserWindow, Tray, Menu, nativeImage, app } from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface WindowConfig {
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  transparent?: boolean;
  frame?: boolean;
  resizable?: boolean;
}

export function createWindow(config: WindowConfig): BrowserWindow {
  const window = new BrowserWindow({
    width: config.width,
    height: config.height,
    minWidth: config.minWidth,
    minHeight: config.minHeight,
    transparent: config.transparent ?? false,
    frame: config.frame ?? true,
    resizable: config.resizable ?? true,
    show: false,
    backgroundColor: '#050508',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: 'transparent',
      symbolColor: 'white',
      height: 0,
    },
  });

  window.once('ready-to-show', () => {
    window.show();
  });

  window.on('maximize', () => {
    window.webContents.send('window-maximized-change', true);
  });

  window.on('unmaximize', () => {
    window.webContents.send('window-maximized-change', false);
  });

  return window;
}

export function setupTray(mainWindow: BrowserWindow | null): Tray {
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'icon.png')
    : path.join(__dirname, '../../assets/icon.png');

  let trayIcon: Electron.NativeImage;
  try {
    trayIcon = nativeImage.createFromPath(iconPath);
    if (trayIcon.isEmpty()) {
      trayIcon = nativeImage.createEmpty();
    }
  } catch {
    trayIcon = nativeImage.createEmpty();
  }

  const tray = new Tray(trayIcon.isEmpty() ? nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAB4SURBVFhH7c0xDQAgCARA+t3/VR0BIiIlZ5hJM3POzPoDDAwMjJmZB4DHzMxb4BkR94cQfouIu0MIT0T8iIh3EfEYEZd7AO5dBOBjRJxHxHlE3B0Bh4h4ioj7iDgMgYMIuIiI6xBYRsTdIQTjAJiZ+QAMzKz/h4GBgYF/5QeU6wKxq4x7mgAAAABJRU5ErkJggg==') : trayIcon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open AURA',
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
      },
    },
    {
      label: 'Hide',
      click: () => {
        mainWindow?.hide();
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setToolTip('AURA - Emotional AI Companion');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow?.show();
      mainWindow?.focus();
    }
  });

  return tray;
}

export function setupIPC(mainWindow: BrowserWindow | null) {
  // Additional IPC handlers can be added here
}
