# Prose Quick Start

## 1. Install Dependencies

```bash
npm install
```

> Tip: `npm run smoke` verifies that the bundled assets (icons, fonts, Marked) exist before you continue.

## 2. Run the Desktop App in Dev Mode

```bash
npm start
```

Try these flows while the window is open:

- `Ctrl+O` to pick a markdown folder (OneDrive paths work)
- `Ctrl+E` to toggle between edit and preview
- Switch themes/fonts from the toolbar
- Watch auto-save status while editing

Stop the app with `Ctrl+C` in the terminal.

## 3. Build Installers

```bash
npm run build:x64     # Windows x64 installer + portable build
npm run build:arm64   # Native ARM64 installer + portable build
```

Outputs land in `dist/`:

- `Prose-<version>-x64.exe` / `.portable.exe`
- `Prose-<version>-arm64.exe` / `.portable.exe`

Install the NSIS `.exe` or use the portable build if you prefer no installer.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `npm` not recognized | Install Node.js 18+ from https://nodejs.org and reopen the terminal. |
| Build stuck on “installing app dependencies” | First run downloads Electron (~200 MB). Wait a few minutes, or rerun `npm run build:x64`. |
| App won’t open folders | Folder browsing is desktop-only. Make sure you launched via `npm start` or an installer rather than double-clicking `index.html`. |
| Icon missing in build | Confirm `assets/icon.png` and `assets/icon.ico` exist (generated automatically by the repo). |

## Customize

- **App name/version**: edit `package.json`
- **Icons**: replace `assets/icon.(png|ico)`
- **Themes**: tweak `styles.css`
- **Default content**: update the welcome section in `script.js`

Happy writing!
