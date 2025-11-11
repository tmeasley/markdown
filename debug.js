// Debug script to check electron module
try {
    console.log('Attempting to load electron...');
    const electron = require('electron');
    console.log('Electron module:', electron);
    console.log('Electron keys:', Object.keys(electron));
    console.log('app exists?', electron.app !== undefined);
    console.log('BrowserWindow exists?', electron.BrowserWindow !== undefined);
} catch (error) {
    console.error('Error loading electron:', error);
}
