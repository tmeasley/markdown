# Prose 1.0.0 – Release Notes

## Highlights
- Native Electron desktop app (x64 + ARM64) with offline-ready assets.
- Tabbed editing, auto-save, and theme/font controls tuned for long-form writing.
- IPC-backed file tree with OneDrive-friendly paths.
- Launcher script strips `ELECTRON_RUN_AS_NODE` to ensure the runtime boots correctly on ARM64 surfaces.

## Known Issues
- In-document “File:” references are plain text. Deep-linking to related files is deferred to a future release.
- Browser mode is no longer supported for file access; use the desktop build exclusively.

## Verification
- Builds produced via `npm run build:x64` / `npm run build:arm64`.
- Manual checklist recorded in `TESTING.md`.
- `npm run smoke` verifies required assets and metadata before shipping.
