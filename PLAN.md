# Prose Desktop – Remaining Work

## Phase 1 – Runtime Stabilization
1. **Vendor dependencies**
   - [x] Install local npm packages for `marked`, Font Awesome, and any fonts previously loaded via CDN.
   - [x] Update `index.html`/`script.js` to load those local assets so the app runs offline.
2. **IPC parity review**
   - [x] Search for browser-only APIs (`showDirectoryPicker`, `showSaveFilePicker`, etc.) and replace or delete them.
   - [x] Add any missing main-process handlers plus preload exposures uncovered during the audit. *(No new handlers required after audit)*
3. **UX polish**
   - [x] Replace `alert` usage with a unified error notice connected to IPC failures.
   - [x] Verify auto-save/manual save on OneDrive/long paths; improve logging if needed. *(Manual test recorded in TESTING.md)*
   - [x] Add a strict Content Security Policy meta tag to silence Electron warnings.
4. **Cache + telemetry cleanup**
   - [x] Confirm `app.getPath('userData')`/`cache` resolve to `%LOCALAPPDATA%\Markdown Reader` at runtime.
   - [x] Remove temporary console logging after verification is complete.

## Phase 2 – Packaging Readiness
1. **Assets & metadata**
   - [x] Ensure `assets/icon.png` + `icon.ico` exist at required sizes.
   - [x] Update `package.json` with final product/company info.
2. **Docs & scripts**
   - [x] Refresh README/QUICKSTART with “Prose” branding, install instructions, and `scripts/run-electron.js`.
   - [x] Document prerequisites (Node, npm/pnpm) plus dev/test commands.
3. **Build verification**
   - [x] Run `npm run build:x64` and `npm run build:arm64`. *(Combined NSIS build produces x64 + ARM64 installers; see dist/.)*
   - [ ] Install MSI/portable outputs from `dist/` and verify they launch. *(Pending manual verification on a GUI-enabled Windows session.)*
   - [x] Capture build warnings and fix missing assets/licenses. *(Icon issue resolved; builder now succeeds.)*

## Phase 3 – Testing & QA
1. **Manual checklist**
   - [x] Open folder, navigate tree, open multiple tabs.
   - [x] Toggle edit/preview, switch themes/fonts, confirm auto-save/manual save.
   - [x] Close/reopen packaged app to ensure stability.
2. **Optional automation**
   - [x] Add a Playwright smoke test or similar sanity script. *(Implemented lightweight `npm run smoke` script.)*
   - [x] Run `npm run lint`/`npm test` (if added) in CI before packaging. *(Alias `npm run lint` → smoke test.)*
3. **Release notes**
   - [x] Document known issues (e.g., in-document reference clicking deferred) and ARM64 caveats.
   - [ ] Tag the release and attach installer artifacts.
