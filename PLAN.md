# Prose Desktop – Remaining Work

## Phase 1 – Runtime Stabilization
1. **Vendor dependencies**
   - [x] Install local npm packages for `marked`, Font Awesome, and any fonts previously loaded via CDN.
   - [x] Update `index.html`/`script.js` to load those local assets so the app runs offline.
2. **IPC parity review**
   - [ ] Search for browser-only APIs (`showDirectoryPicker`, `showSaveFilePicker`, etc.) and replace or delete them.
   - [ ] Add any missing main-process handlers plus preload exposures uncovered during the audit.
3. **UX polish**
   - [ ] Replace `alert` usage with a unified error notice connected to IPC failures.
   - [ ] Verify auto-save/manual save on OneDrive/long paths; improve logging if needed.
   - [x] Add a strict Content Security Policy meta tag to silence Electron warnings.
4. **Cache + telemetry cleanup**
   - [ ] Confirm `app.getPath('userData')`/`cache` resolve to `%LOCALAPPDATA%\Markdown Reader` at runtime.
   - [ ] Remove temporary console logging after verification is complete.

## Phase 2 – Packaging Readiness
1. **Assets & metadata**
   - [ ] Ensure `assets/icon.png` + `icon.ico` exist at required sizes.
   - [ ] Update `package.json` with final product/company info.
2. **Docs & scripts**
   - [ ] Refresh README/QUICKSTART with “Prose” branding, install instructions, and `scripts/run-electron.js`.
   - [ ] Document prerequisites (Node, npm/pnpm) plus dev/test commands.
3. **Build verification**
   - [ ] Run `npm run build:x64` and `npm run build:arm64`.
   - [ ] Install MSI/portable outputs from `dist/` and verify they launch.
   - [ ] Capture build warnings and fix missing assets/licenses.

## Phase 3 – Testing & QA
1. **Manual checklist**
   - [ ] Open folder, navigate tree, open multiple tabs.
   - [ ] Toggle edit/preview, switch themes/fonts, confirm auto-save/manual save.
   - [ ] Close/reopen packaged app to ensure stability.
2. **Optional automation**
   - [ ] Add a Playwright smoke test or similar sanity script.
   - [ ] Run `npm run lint`/`npm test` (if added) in CI before packaging.
3. **Release notes**
   - [ ] Document known issues (e.g., in-document reference clicking deferred) and ARM64 caveats.
   - [ ] Tag the release and attach installer artifacts.
