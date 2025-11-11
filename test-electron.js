const { app, BrowserWindow } = require('electron');

console.log('Electron loaded:', app);
console.log('App version:', app.getVersion());

app.whenReady().then(() => {
    console.log('App is ready!');
    const win = new BrowserWindow({
        width: 800,
        height: 600
    });
    win.loadURL('data:text/html,<h1>Hello Electron!</h1>');
});

app.on('window-all-closed', () => {
    app.quit();
});
