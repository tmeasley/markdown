# Prose – Clean Markdown Reader & Editor

Prose is a distraction-free markdown workspace built with Electron for Windows (x64 and ARM64). Browse entire folders, keep multiple drafts open in tabs, and move between editing and reading modes without context switches.

## Highlights

- Elegant preview pane with responsive typography and seven curated themes
- Rich editing with toolbar shortcuts, auto-save, and familiar keyboard commands
- Native file-tree navigation powered by an Electron IPC bridge (no browser APIs)
- Offline-ready: Marked, Font Awesome, and fonts are bundled locally

## Requirements

- Windows 10/11
- Node.js 18+ (includes npm) for development or building installers

## Quick Start

```bash
npm install
npm start             # launches via scripts/run-electron.js

npm run dev           # same as start, but opens DevTools/logging
npm run smoke         # verifies required assets/metadata
```

## Building Installers

```bash
npm run build:x64     # Windows x64 installer + portable build
npm run build:arm64   # Native ARM64 installer + portable build
```

Artifacts appear in `dist/` with names such as `Prose-1.0.0-arm64.exe` (NSIS) and `.portable.exe`. Install the version that matches your hardware or ship the portable binary for no-install deployments.

## Project Structure

```
.
├─ index.html                 # Shell UI
├─ script.js                  # Renderer logic / IPC client
├─ styles.css                 # Themes and layout
├─ main.js                    # Electron main process + IPC handlers
├─ preload.js                 # Secure bridge exposing window.electronAPI
├─ vendor/                    # Bundled Marked + Font Awesome assets
├─ assets/icon.(png|ico)      # Desktop + installer icons
└─ scripts/
   ├─ run-electron.js         # Launcher that strips ELECTRON_RUN_AS_NODE
   └─ smoke-test.js           # Asset/metadata verification script
```

## Key Shortcuts

| Action        | Shortcut        |
|---------------|-----------------|
| New document  | `Ctrl+N`        |
| Open folder   | `Ctrl+O`        |
| Save          | `Ctrl+S`        |
| Save As       | `Ctrl+Shift+S`  |
| Close tab     | `Ctrl+W`        |
| Toggle edit   | `Ctrl+E`        |

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `npm` not recognized | Install Node.js from https://nodejs.org, restart the terminal, then rerun `npm install`. |
| Electron security warning | Prose ships with a strict CSP; ensure you launched via `npm start`/the installer rather than double-clicking `index.html`. |
| Installer build fails | Delete `node_modules`, run `npm install`, then retry `npm run build:x64`. |
| Folder access unavailable | Folder browsing is only supported in the packaged desktop app. Use `npm start` or the installer instead of a browser. |

## License

MIT
