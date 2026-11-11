const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  selectFile: () => ipcRenderer.invoke('select-file'),
  closeApp: () => ipcRenderer.invoke('close-app'),
  openPath: (p) => ipcRenderer.invoke('open-path', p),
});
