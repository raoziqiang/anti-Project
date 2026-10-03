const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  setIgnoreMouseEvents: (ignore, options) => {
    ipcRenderer.send('set-ignore-mouse-events', ignore, options);
  },
  openStudio: (tab) => {
    ipcRenderer.send('open-studio', tab);
  },
  toggleAlwaysOnTop: (val) => {
    ipcRenderer.send('set-always-on-top', val);
  },
  setPetWindowSize: (size) => {
    ipcRenderer.send('set-pet-window-size', size);
  },
  closeApp: () => {
    ipcRenderer.send('close-app');
  },
  onStudioOpened: (callback) => {
    ipcRenderer.on('show-studio', () => callback());
  },
  onSwitchTab: (callback) => {
    const handler = (event, tab) => callback(tab);
    ipcRenderer.on('switch-tab', handler);
    return () => ipcRenderer.removeListener('switch-tab', handler);
  },
  loadConfig: () => ipcRenderer.invoke('load-config'),
  saveConfig: (patch) => ipcRenderer.invoke('save-config', patch),
  onConfigUpdated: (callback) => {
    const handler = (event, val) => callback(val);
    ipcRenderer.on('config-updated', handler);
    return () => ipcRenderer.removeListener('config-updated', handler);
  }
});
