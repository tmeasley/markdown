# Prose – A Clean Markdown Reader and Editor

Prose is a distraction-free markdown workspace packaged with Electron for Windows (including native ARM64). Browse entire folders, keep multiple drafts open in tabs, and switch seamlessly between reading and editing.

## Highlights

- Elegant reader pane with responsive typography and themes
- Rich editing with toolbar shortcuts, auto-save, and keyboard commands
- File-tree navigation plus clickable in-document references
- ARM64-ready builds plus a browser fallback

## Getting Started

```bash
npm install
npm start
```

- `npm run dev` enables Electron logging.
- `npm run build` produces x64 + ARM64 packages in `dist/`.

### Key Shortcuts

`Ctrl+N` (new), `Ctrl+O` (open folder), `Ctrl+S` (save), `Ctrl+Shift+S` (save as), `Ctrl+W` (close tab), `Ctrl+E` (toggle edit mode).

## Project Structure

```
.
├─ index.html        # UI shell (sidebar, tabs, preview)
├─ styles.css        # Themes + layout
├─ script.js         # Renderer logic shared by browser/Electron
├─ main.js           # Electron main process + IPC handlers
├─ preload.js        # Secure bridge exposing electronAPI
├─ assets/           # Icons
└─ scripts/run-electron.js  # Launcher that strips bad env vars
```

## Building Installers

```bash
npm run build:x64     # Windows x64 only
npm run build:arm64   # Windows ARM64 only
```

Artifacts (NSIS + portable) land in `dist/` with architecture suffixes.

## Browser Mode

You can still run Prose in Chrome/Edge by opening `index.html`. Folder access relies on the File System Access API, so use a Chromium-based browser for full functionality.

## License

MIT
