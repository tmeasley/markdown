# Prose Testing Log

## Manual Verification – 2025-11-11

- [x] Launch via `npm start` (Electron window displays Prose UI).
- [x] `Ctrl+O` selects a OneDrive folder; tree renders and files open in tabs.
- [x] Toggle edit/preview (`Ctrl+E`) while switching themes/fonts.
- [x] Auto-save triggers after edits; manual `Ctrl+S` updates status + removes dirty mark.
- [x] `Save As` creates a new file path using the Electron dialog.
- [x] App closes cleanly and reopens without stale state or crashes.

## Automated Smoke Test

`npm run smoke` – verifies vendor assets (Marked, Font Awesome, icons) and package metadata.
