#!/usr/bin/env node
/**
 * Launch Electron after stripping ELECTRON_RUN_AS_NODE so ARM64 builds
 * don't fall back to pure Node mode. Usage mirrors `npx electron`.
 */
const { spawn } = require('child_process');
const electronPath = require('electron');

const args = process.argv.slice(2);
const env = { ...process.env };

if ('ELECTRON_RUN_AS_NODE' in env) {
    console.warn('[launcher] Removing ELECTRON_RUN_AS_NODE to force real Electron runtime');
    delete env.ELECTRON_RUN_AS_NODE;
}

const child = spawn(electronPath, args.length ? args : ['.'], {
    env,
    stdio: 'inherit',
    windowsHide: false
});

child.on('exit', (code, signal) => {
    if (signal) {
        console.error(`[launcher] Electron exited due to signal ${signal}`);
        process.exit(1);
    }
    process.exit(code ?? 0);
});

child.on('error', (error) => {
    console.error('[launcher] Failed to start Electron:', error);
    process.exit(1);
});
