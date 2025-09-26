const { contextBridge, ipcRenderer, webFrame } = require('electron');

webFrame.setZoomFactor(1);
webFrame.setZoomLevel(0);
webFrame.setVisualZoomLevelLimits(1, 1);

window.addEventListener('wheel', (e) => {
    if (e.ctrlKey) {
        e.preventDefault();
    }
}, { passive: false });

window.addEventListener('keydown', (e) => {
    if (e.ctrlKey) {
        if (e.key === '=' || e.key === '+' || e.key === '-') {
            e.preventDefault();
        }
        if (e.key === '0') {
             e.preventDefault();
        }
    }
});

contextBridge.exposeInMainWorld('tytAPI', {
    startDownload: (url, format, quality) => ipcRenderer.send('start-download', url, format, quality),
    
    getMetadata: (url) => ipcRenderer.send('get-metadata', url),
    onMetadataReceived: (callback) => ipcRenderer.on('metadata-received', (event, data) => callback(data)),

    downloadThumbnail: (url, title) => ipcRenderer.send('download-thumbnail', url, title),
    
    selectDownloadFolder: () => ipcRenderer.invoke('select-download-folder'),

    getSettings: () => ipcRenderer.invoke('get-settings'),
    saveSettings: (settings) => ipcRenderer.send('save-settings', settings),
    
    onSettingsUpdated: (callback) => ipcRenderer.on('settings-updated', (event, settings) => callback(settings)), 
    
    onUpdate: (callback) => ipcRenderer.on('download-update', (event, data) => callback(data)),
    onError: (callback) => ipcRenderer.on('download-error', (event, data) => callback(data)),
    onComplete: (callback) => ipcRenderer.on('download-complete', (event, data) => callback(data)),

    onNotification: (callback) => ipcRenderer.on('notification', (event, data) => callback(data)),
    
    onInternalNotification: (callback) => ipcRenderer.on('internal-notification', (event, data) => callback(data)) 
});