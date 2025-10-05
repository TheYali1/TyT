const { app, BrowserWindow, ipcMain, dialog, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const https = require('https');

const settingsPath = path.join(app.getPath('userData'), 'settings.json');
const ytdlpPath = path.join(process.resourcesPath, 'yt-dlp.exe');
let currentSettings = {
    downloadPath: path.join(process.env.USERPROFILE, 'Downloads'),
    darkMode: true,
    showLogs: true
};

const YTDLP_DOWNLOAD_URL = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe';
const TYT_REPO_API = 'api.github.com/repos/TheYali1/TyT/releases/latest'; 

function loadSettings() {
    try {
        if (fs.existsSync(settingsPath)) {
            const data = fs.readFileSync(settingsPath, 'utf8');
            const loadedSettings = JSON.parse(data);
            currentSettings = { ...currentSettings, ...loadedSettings };
            currentSettings.showLogs = true; 
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

function sendInternalNotification(body) {
    BrowserWindow.getAllWindows().forEach(win => {
        win.webContents.send('internal-notification', { body: body });
    });
}

function compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const p1 = parts1[i] || 0;
        const p2 = parts2[i] || 0;
        
        if (p1 > p2) return true; 
        if (p1 < p2) return false; 
    }
    return false; 
}

function getYtdlpVersion(ytdlpPath) {
    return new Promise((resolve) => {
        if (!fs.existsSync(ytdlpPath)) {
            return resolve('0.0.0'); 
        }
        const ytdlp = spawn(ytdlpPath, ['--version']);
        let version = '';
        ytdlp.stdout.on('data', (data) => {
            version += data.toString().trim();
        });
        ytdlp.on('close', () => {
            const match = version.match(/(\d{4}\.\d{2}\.\d{2})/); 
            resolve(match ? match[0] : '0.0.0');
        });
        ytdlp.on('error', () => resolve('0.0.0')); 
    });
}

function getLatestYtdlpVersion() {
    return new Promise((resolve) => {
        const options = {
            hostname: 'api.github.com',
            path: '/repos/yt-dlp/yt-dlp/releases/latest',
            headers: { 'User-Agent': 'TyT-Downloader-Updater' }
        };

        https.get(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode !== 200) return resolve('0.0.0'); 
                try {
                    const release = JSON.parse(data);
                    const latestVersion = release.tag_name ? release.tag_name.replace('v', '') : '0.0.0'; 
                    resolve(latestVersion);
                } catch (e) {
                    resolve('0.0.0');
                }
            });
        }).on('error', () => resolve('0.0.0'));
    });
}

function updateYtdlp() {
    return new Promise(async (resolve, reject) => {
        const ytdlpPath = app.isPackaged
          ? path.join(process.resourcesPath, 'yt-dlp.exe')
          : path.join(__dirname, 'yt-dlp.exe');
        sendInternalNotification('Checking for yt-dlp update... 🛠️');
        
        const [localVersion, latestVersionTag] = await Promise.all([
            getYtdlpVersion(ytdlpPath),
            getLatestYtdlpVersion()
        ]);
        
        const isUpdateNeeded = localVersion === '0.0.0' || compareVersions(latestVersionTag, localVersion);

        if (isUpdateNeeded) {
            sendInternalNotification(`Updating yt-dlp from ${localVersion === '0.0.0' ? 'N/A' : localVersion} to ${latestVersionTag}...`);
        } else {
            sendInternalNotification(`yt-dlp is already the latest version (${localVersion}). 👍`);
            return resolve('yt-dlp up to date.');
        }

        const download = (url) => {
             return new Promise((res, rej) => {
                 const tempPath = path.join(app.getAppPath(), 'yt-dlp.exe.tmp');
                 const file = fs.createWriteStream(tempPath); 
                 https.get(url, { headers: { 'User-Agent': 'TyT-Updater' } }, (response) => {
                     if (response.statusCode === 302 || response.statusCode === 301) { 
                         file.close(() => fs.unlink(tempPath, () => {}));
                         return download(response.headers.location).then(res).catch(rej);
                     } 
                     
                     if (response.statusCode !== 200) {
                         file.close(() => fs.unlink(tempPath, () => {})); 
                         const error = `Failed to download yt-dlp. Status: ${response.statusCode}`;
                         sendInternalNotification(`yt-dlp update failed: ${error} ❌`);
                         return rej(error);
                     }
                     
                     response.pipe(file);
                     
                     file.on('finish', () => {
                         file.close(() => {
                             fs.rename(tempPath, ytdlpPath, (err) => {
                                 if (err) {
                                     sendInternalNotification(`Failed to replace yt-dlp.exe: ${err.message} ❌`);
                                     return rej(err);
                                 }
                                 sendInternalNotification('yt-dlp updated successfully! ✅');
                                 res('yt-dlp updated.');
                             });
                         });
                     });
                 }).on('error', (err) => {
                     file.close(() => fs.unlink(tempPath, () => {})); 
                     sendInternalNotification(`yt-dlp download error: ${err.message} ❌`);
                     rej(err.message);
                 });
             });
        };
        
        try {
            await download(YTDLP_DOWNLOAD_URL);
            resolve('yt-dlp updated.');
        } catch (e) {
            reject(e);
        }
    });
}

function checkTyTVersion() {
    return new Promise((resolve) => {
        sendInternalNotification('Checking for TyT app updates... 🚀');
        const currentVersion = app.getVersion();
        
        const options = {
            hostname: 'api.github.com',
            path: '/repos/TheYali1/TyT/releases/latest',
            headers: { 'User-Agent': 'TyT-Updater' }
        };

        https.get(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode !== 200) {
                    sendInternalNotification('Could not check TyT version (GitHub API error). 🤔');
                    return resolve(false);
                } 
                try {
                    const release = JSON.parse(data);
                    const latestVersion = release.tag_name ? release.tag_name.replace('v', '') : '0.0.0';
                    
                    const isNewer = compareVersions(latestVersion, currentVersion);

                    if (isNewer) {
                        sendInternalNotification(`New TyT version available: ${latestVersion}! Update now! ✨`);
                    } else {
                        sendInternalNotification(`TyT is up to date (${currentVersion}).`);
                    }
                    resolve(isNewer);
                } catch (e) {
                    sendInternalNotification('Could not parse TyT version info. 💀');
                    resolve(false);
                }
            });
        }).on('error', () => {
            sendInternalNotification('Network error while checking TyT version. 🌐');
            resolve(false);
        });
    });
}

loadSettings();

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 950,
        height: 770,
        resizable: true,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            devTools: true,
            zoomFactor: 1.0,
            minimumZoomFactor: 1.0,
            maximumZoomFactor: 1.0
        }
    });

    mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
    createWindow();

    BrowserWindow.getAllWindows()[0].webContents.once('did-finish-load', () => {
        updateYtdlp();
        checkTyTVersion(); 
    });

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
    const thumbnailDir = currentSettings.downloadPath;
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
    const ytdlpPath = app.isPackaged
        ? path.join(process.resourcesPath, 'yt-dlp.exe')
        : path.join(__dirname, 'yt-dlp.exe');
    
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
                        note: f.format_note
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
    const ytdlpPath = app.isPackaged
        ? path.join(process.resourcesPath, 'yt-dlp.exe')
        : path.join(__dirname, 'yt-dlp.exe');
    
    let formatArg;
    let args = [
      url,
      '--no-warnings',
      '--newline',
      '--progress-template',
      'download:%(progress._percent_str)s of %(progress._total_bytes_str)s at %(progress._speed_str)s ETA %(progress._eta_str)s'
    ];

    if (format === 'video') {
        let height = 0;

        if (quality === 'Best') {
            formatArg = 'bestvideo+bestaudio/best';
        } else if (quality === '8K') {
            height = 4320; 
            formatArg = `bestvideo[height<=${height}]+bestaudio/best[height<=${height}]`;
        } else if (quality === '4K') {
            height = 2160;
            formatArg = `bestvideo[height<=${height}]+bestaudio/best[height<=${height}]`;
        } else {
            height = parseInt(quality.replace('p', ''), 10);
            formatArg = `bestvideo[height<=${height}]+bestaudio/best[height<=${height}]`;
        }
        
        args.push('-f', formatArg, '--recode-video', 'mp4');
    } else if (format === 'audio') {
        formatArg = 'bestaudio'; 
        let audioQualityArg;
        
        if (quality === 'Best') {
            audioQualityArg = '0'; 
        } else {
            audioQualityArg = quality; 
        }
        
        args.push('-f', formatArg, '-x', '--audio-format', 'mp3', '--audio-quality', audioQualityArg);
    }
    
    const downloadPath = path.join(currentSettings.downloadPath, '%(title)s.%(ext)s');
    
    args.push('-o', downloadPath);

    const ytdlp = spawn(ytdlpPath, args);

    ytdlp.stdout.setEncoding('utf8');
    ytdlp.stderr.setEncoding('utf8');
    
    ytdlp.stdout.on('data', (data) => {
        event.sender.send('download-update', data);
    });
    ytdlp.stderr.on('data', (data) => {
        event.sender.send('download-update', data);
    });
    
    ytdlp.on('error', (err) => {
        event.sender.send('download-error', err.message);
    });


    ytdlp.on('close', (code) => {
        if (code === 0) {
            event.sender.send('download-complete', 'Download complete! Getting file name...');
            
            const metadataCommand = spawn(ytdlpPath, [url, '--get-title', '--no-warnings']);
            let title = '';
            
            metadataCommand.stdout.setEncoding('utf8');

            metadataCommand.stdout.on('data', (data) => {
                title += data.trim();
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