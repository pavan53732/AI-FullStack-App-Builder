const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  saveFile: (defaultName, content) => ipcRenderer.invoke('save-file', { defaultName, content }),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  
  // Platform info
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  
  // Menu events
  onMenuNewProject: (callback) => ipcRenderer.on('menu-new-project', callback),
  onMenuOpenProject: (callback) => ipcRenderer.on('menu-open-project', callback),
  onMenuExportZip: (callback) => ipcRenderer.on('menu-export-zip', callback),
  onMenuBuildApk: (callback) => ipcRenderer.on('menu-build-apk', callback),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
})

// Log when preload script is loaded
console.log('Electron preload script loaded successfully')
