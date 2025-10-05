const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    getSettings: () => ipcRenderer.invoke('get-settings'),
    selectDownloadFolder: () => ipcRenderer.invoke('select-download-folder'),
    saveSettings: (settings) => ipcRenderer.send('save-settings', settings),
    downloadThumbnail: (url, title) => ipcRenderer.send('download-thumbnail', url, title),
    getMetadata: (url) => ipcRenderer.send('get-metadata', url),
    startDownload: (url, format, quality) => ipcRenderer.send('start-download', url, format, quality),
    
    onMetadataReceived: (callback) => ipcRenderer.on('metadata-received', (event, data) => callback(data)),
    onDownloadUpdate: (callback) => ipcRenderer.on('download-update', (event, data) => callback(data)),
    onDownloadComplete: (callback) => ipcRenderer.on('download-complete', (event, message) => callback(message)),
    onDownloadError: (callback) => ipcRenderer.on('download-error', (event, error) => callback(error)),
    onInternalNotification: (callback) => ipcRenderer.on('internal-notification', (event, data) => callback(data)),
    onSettingsUpdated: (callback) => ipcRenderer.on('settings-updated', (event, settings) => callback(settings)),
});