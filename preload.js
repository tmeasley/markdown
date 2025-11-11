const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Dialog operations
    openFolderDialog: () => ipcRenderer.invoke('dialog:openFolder'),
    saveFileDialog: (suggestedName) => ipcRenderer.invoke('dialog:saveFile', suggestedName),

    // File system operations
    readDirectory: (dirPath) => ipcRenderer.invoke('fs:readDirectory', dirPath),
    readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
    writeFile: (filePath, content) => ipcRenderer.invoke('fs:writeFile', filePath, content),
    checkAccess: (filePath) => ipcRenderer.invoke('fs:checkAccess', filePath),
    openFileReference: (rootDir, reference) => ipcRenderer.invoke('fs:openFileReference', rootDir, reference),

    // Menu event listeners
    onMenuNewFile: (callback) => ipcRenderer.on('menu-new-file', callback),
    onMenuOpenFolder: (callback) => ipcRenderer.on('menu-open-folder', callback),
    onMenuSaveFile: (callback) => ipcRenderer.on('menu-save-file', callback),
    onMenuSaveAsFile: (callback) => ipcRenderer.on('menu-save-as-file', callback),
    onMenuCloseFile: (callback) => ipcRenderer.on('menu-close-file', callback),
    onMenuToggleEdit: (callback) => ipcRenderer.on('menu-toggle-edit', callback),

    // Platform info
    platform: process.platform,
    isElectron: true
});
