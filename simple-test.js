const { app, BrowserWindow } = require('electron');

console.log('========== ELECTRON MAIN TEST ==========');
console.log('process.versions:', JSON.stringify(process.versions, null, 2));
console.log('process.type before app ready:', process.type);
console.log('----------------------------------------');

app.whenReady().then(() => {
    console.log('app.isPackaged:', app.isPackaged);
    console.log('app.getVersion():', app.getVersion());
    console.log('process.type after app ready:', process.type);

    // Create a hidden window to prove BrowserWindow is available.
    const win = new BrowserWindow({ show: false, width: 400, height: 300 });
    console.log('BrowserWindow created:', !!win);

    // Cleanly exit once we know the runtime works.
    app.quit();
});

app.on('window-all-closed', () => {
    console.log('window-all-closed -> quitting');
    app.quit();
});
