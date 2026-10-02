const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  setIgnoreMouseEvents: (ignore, options) => {
    ipcRenderer.send('set-ignore-mouse-events', ignore, options);
  },
  openStudio: () => {
    ipcRenderer.send('open-studio');
  },
  toggleAlwaysOnTop: (val) => {
    ipcRenderer.send('set-always-on-top', val);
  },
  closeApp: () => {
    ipcRenderer.send('close-app');
  },
  onStudioOpened: (callback) => {
    ipcRenderer.on('show-studio', () => callback());
  }
});
