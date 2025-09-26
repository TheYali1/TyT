const { app, BrowserWindow, ipcMain, dialog, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const https = require('https');

const settingsPath = path.join(app.getPath('userData'), 'settings.json');
let currentSettings = {
    downloadPath: path.join(process.env.USERPROFILE, 'Downloads'),
    darkMode: true,
    showLogs: false
};

function loadSettings() {
    try {
        if (fs.existsSync(settingsPath)) {
            const data = fs.readFileSync(settingsPath, 'utf8');
            const loadedSettings = JSON.parse(data);
            currentSettings = { ...currentSettings, ...loadedSettings };
            if (currentSettings.showLogs === undefined) {
                 currentSettings.showLogs = false; 
            }
        } else {
            fs.writeFileSync(settingsPath, JSON.stringify(currentSettings), 'utf8');
        }
    } catch (e) {
    }
}

function saveSettings(settings) {
    currentSettings = { ...currentSettings, ...settings };
    try {
        fs.writeFileSync(settingsPath, JSON.stringify(currentSettings), 'utf8');
        
        BrowserWindow.getAllWindows().forEach(win => {
            win.webContents.send('settings-updated', currentSettings); 
        });
        
    } catch (e) {
    }
}

function showNotification(body, title) {
    new Notification({ 
        title: title || 'TyT Downloader', 
        body: body,
        icon: path.join(app.getAppPath(), 'TyT2.png')
    }).show();
}

loadSettings();

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 950,
        height: 700,
        resizable: true,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            devTools: false,
            zoomFactor: 1.0,
            minimumZoomFactor: 1.0,
            maximumZoomFactor: 1.0
        }
    });

    mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('get-settings', () => {
    return currentSettings;
});

ipcMain.handle('select-download-folder', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openDirectory']
    });
    if (canceled) {
        return null;
    } else {
        return filePaths[0];
    }
});

ipcMain.on('save-settings', (event, settings) => {
    saveSettings(settings);
});

ipcMain.on('download-thumbnail', (event, url, title) => {
    const filename = `${title.replace(/[\\/:*?"<>|]/g, '_')}.jpg`;
    const thumbnailDir = path.join(currentSettings.downloadPath,);
    const fullPath = path.join(thumbnailDir, filename);

    if (!fs.existsSync(thumbnailDir)) {
        fs.mkdirSync(thumbnailDir, { recursive: true });
    }

    const file = fs.createWriteStream(fullPath);
    https.get(url, (response) => {
        if (response.statusCode === 200) {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                event.sender.send('internal-notification', { body: `Thumbnail for "${title}" saved successfully! 🖼️` });
            });
        } else {
            event.sender.send('internal-notification', { body: `Failed to download thumbnail. Status: ${response.statusCode} 😥` });
        }
    }).on('error', (err) => {
        fs.unlink(fullPath, () => {}); 
        event.sender.send('internal-notification', { body: `Download error: ${err.message} 🚫` });
    });
});


ipcMain.on('get-metadata', (event, url) => {
    const ytdlpPath = path.join(app.getAppPath(), 'yt-dlp.exe');
    
    const args = [
        url,
        '--dump-json',
        '--no-playlist',
        '--skip-download'
    ];

    const ytdlp = spawn(ytdlpPath, args);
    let jsonOutput = '';

    ytdlp.stdout.on('data', (data) => {
        jsonOutput += data.toString();
    });

    ytdlp.on('close', (code) => {
        if (code === 0) {
            try {
                const metadata = JSON.parse(jsonOutput);
                const result = {
                    title: metadata.title,
                    thumbnail: metadata.thumbnail,
                    formats: metadata.formats ? metadata.formats.filter(f => f.vcodec !== 'none' || f.acodec !== 'none').map(f => ({
                        id: f.format_id,
                        ext: f.ext,
                        resolution: f.height ? `${f.height}p` : 'Audio',
                        note: f.format_note,
                        vcodec: f.vcodec,
                        acodec: f.acodec
                    })) : [],
                    duration: metadata.duration
                };
                event.sender.send('metadata-received', { success: true, data: result });
            } catch (e) {
                event.sender.send('metadata-received', { success: false, error: 'Failed to parse metadata.' });
            }
        } else {
            event.sender.send('metadata-received', { success: false, error: 'Failed to fetch metadata. Check URL.' });
        }
    });
});

ipcMain.on('start-download', (event, url, format, quality) => {
    const ytdlpPath = path.join(app.getAppPath(), 'yt-dlp.exe');
    
    let formatArg;
    let args = [url];
    
    if (format === 'video') {
        formatArg = quality === 'best' ? 'bestvideo+bestaudio/best' : quality;
    } else if (format === 'audio') {
        formatArg = 'bestaudio'; 
        args.push('-x', '--audio-format', 'mp3', '--audio-quality', quality);
    }
    
    const downloadPath = path.join(currentSettings.downloadPath, '%(title)s.%(ext)s');
    
    args.push('-f', formatArg, '-o', downloadPath);

    const ytdlp = spawn(ytdlpPath, args);

    ytdlp.stdout.on('data', (data) => {
        event.sender.send('download-update', data.toString());
    });

    ytdlp.stderr.on('data', (data) => {
        event.sender.send('download-error', data.toString());
    });

    ytdlp.on('close', (code) => {
        if (code === 0) {
            event.sender.send('download-complete', 'Download complete! Getting file name...');
            
            const metadataCommand = spawn(ytdlpPath, [url, '--get-title', '--no-warnings']);
            let title = '';
            metadataCommand.stdout.on('data', (data) => {
                title += data.toString().trim();
            });
            metadataCommand.on('close', () => {
                const downloadTitle = title.length > 0 ? title : 'File';
                
                event.sender.send('internal-notification', { 
                    body: `"${downloadTitle}" downloaded successfully! 🎉` 
                });
            });
        } else {
            event.sender.send('download-complete', `Download failed with exit code: ${code} 😥`);
            event.sender.send('internal-notification', { 
                body: 'A download failed. Check for errors in the logs. 🚫' 
            });
        }
    });
});