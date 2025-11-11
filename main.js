const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs').promises;

let mainWindow;

// Ensure Electron uses a writable profile/cache directory (ARM64 sandbox safe)
const userHome = os.homedir();
const appDataRoot = process.env.APPDATA || path.join(userHome, 'AppData', 'Roaming');
const localAppDataRoot = process.env.LOCALAPPDATA || path.join(userHome, 'AppData', 'Local');
const userDataPath = path.join(appDataRoot, 'Markdown Reader');
const cachePath = path.join(localAppDataRoot, 'Markdown Reader', 'Cache');

app.setPath('userData', userDataPath);
app.setPath('cache', cachePath);
app.commandLine.appendSwitch('disk-cache-dir', cachePath);

async function ensureDataDirectories() {
    try {
        await fs.mkdir(userDataPath, { recursive: true });
        await fs.mkdir(cachePath, { recursive: true });
    } catch (error) {
        console.error('Failed to prepare user/cache directories:', error);
    }
}

function logAppPaths() {
    if (app.isPackaged) return;
    console.log('[Prose] userData path:', app.getPath('userData'));
    console.log('[Prose] cache path:', app.getPath('cache'));
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 800,
        minHeight: 600,
        icon: path.join(__dirname, 'assets/icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false
        },
        backgroundColor: '#faf9f6',
        show: false
    });

    mainWindow.loadFile('index.html');

    // Show window when ready to prevent visual flash
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Create application menu
    createMenu();

    // Open DevTools in development
    if (process.argv.includes('--enable-logging')) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function createMenu() {
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'New Document',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => {
                        mainWindow.webContents.send('menu-new-file');
                    }
                },
                {
                    label: 'Open Folder...',
                    accelerator: 'CmdOrCtrl+O',
                    click: () => {
                        mainWindow.webContents.send('menu-open-folder');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Save',
                    accelerator: 'CmdOrCtrl+S',
                    click: () => {
                        mainWindow.webContents.send('menu-save-file');
                    }
                },
                {
                    label: 'Save As...',
                    accelerator: 'CmdOrCtrl+Shift+S',
                    click: () => {
                        mainWindow.webContents.send('menu-save-as-file');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Close Tab',
                    accelerator: 'CmdOrCtrl+W',
                    click: () => {
                        mainWindow.webContents.send('menu-close-file');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Exit',
                    accelerator: 'Alt+F4',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'selectAll' }
            ]
        },
        {
            label: 'View',
            submenu: [
                {
                    label: 'Toggle Edit Mode',
                    accelerator: 'CmdOrCtrl+E',
                    click: () => {
                        mainWindow.webContents.send('menu-toggle-edit');
                    }
                },
                { type: 'separator' },
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'About',
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'About Markdown Reader',
                            message: 'Markdown Reader',
                            detail: 'Version 1.0.0\n\nA beautiful, distraction-free markdown reader and editor.\n\nBuilt with Electron!'
                        });
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

function setupIpcHandlers() {
    ipcMain.handle('dialog:openFolder', async () => {
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory']
        });

        if (result.canceled) {
            return null;
        }

        return result.filePaths[0];
    });

    ipcMain.handle('dialog:saveFile', async (event, suggestedName) => {
        const result = await dialog.showSaveDialog(mainWindow, {
            defaultPath: suggestedName || 'untitled.md',
            filters: [
                { name: 'Markdown Files', extensions: ['md', 'markdown'] },
                { name: 'Text Files', extensions: ['txt'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });

        if (result.canceled) {
            return null;
        }

        return result.filePath;
    });

    ipcMain.handle('fs:readDirectory', async (event, dirPath) => {
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            const results = [];

            for (const entry of entries) {
                // Skip hidden and system files
                if (entry.name.startsWith('.') || entry.name.startsWith('$') ||
                    entry.name === 'node_modules' || entry.name === '__pycache__') {
                    continue;
                }

                const fullPath = path.join(dirPath, entry.name);
                results.push({
                    name: entry.name,
                    path: fullPath,
                    isDirectory: entry.isDirectory()
                });
            }

            return results;
        } catch (error) {
            console.error('Error reading directory:', error);
            throw error;
        }
    });

    ipcMain.handle('fs:readFile', async (event, filePath) => {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const stats = await fs.stat(filePath);

            return {
                content,
                name: path.basename(filePath),
                path: filePath,
                size: stats.size
            };
        } catch (error) {
            console.error('Error reading file:', error);
            throw error;
        }
    });

    ipcMain.handle('fs:writeFile', async (event, filePath, content) => {
        try {
            await fs.writeFile(filePath, content, 'utf-8');
            return { success: true };
        } catch (error) {
            console.error('Error writing file:', error);
            throw error;
        }
    });

    ipcMain.handle('fs:checkAccess', async (event, filePath) => {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    });

    ipcMain.handle('fs:openFileReference', async (event, rootDir, reference) => {
        if (!rootDir || !reference) {
            throw new Error('Missing root directory or reference');
        }

        const normalizedRoot = path.normalize(rootDir);
        const candidatePath = path.normalize(path.join(normalizedRoot, reference));

        if (!candidatePath.startsWith(normalizedRoot)) {
            throw new Error('Reference outside selected directory');
        }

        try {
            const stats = await fs.stat(candidatePath);
            if (!stats.isFile()) {
                throw new Error('Reference is not a file');
            }

            const content = await fs.readFile(candidatePath, 'utf-8');
            return {
                content,
                name: path.basename(candidatePath),
                path: candidatePath,
                size: stats.size
            };
        } catch (error) {
            console.error('Error opening referenced file:', error);
            throw error;
        }
    });
}

// App lifecycle
app.whenReady().then(async () => {
    await ensureDataDirectories();
    logAppPaths();
    createWindow();
    setupIpcHandlers();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
