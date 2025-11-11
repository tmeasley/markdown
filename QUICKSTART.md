# Quick Start Guide

## Get Your Standalone App Running in 3 Steps

### Step 1: Install Dependencies

**Option A - Easy (Double-click):**
- Double-click `setup.bat`

**Option B - Manual:**
```bash
npm install
```

This installs Electron and other dependencies (~200MB, takes 2-5 minutes).

---

### Step 2: Test the App

Run the development version to make sure everything works:

```bash
npm start
```

The app should open in a new window! Try:
- Opening a folder with markdown files
- Creating a new document
- Switching between edit and reading modes
- Changing themes

Press `Ctrl+C` in the terminal to stop the app.

---

### Step 3: Build the Standalone Installer

Build installers for both x64 and ARM64 Windows:

```bash
npm run build
```

**This takes 5-10 minutes and creates:**
- `dist/Markdown-Reader-1.0.0-x64.exe` - For regular Windows PCs
- `dist/Markdown-Reader-1.0.0-arm64.exe` - For your ARM Windows PC
- Portable versions (no installation needed)

---

## Install and Run

After building:

1. Go to the `dist` folder
2. Run the appropriate installer:
   - **Your ARM PC**: Double-click `Markdown-Reader-1.0.0-arm64.exe`
   - **Regular PC**: Use the `x64.exe` version
3. Follow the installation wizard
4. Launch from Start Menu or Desktop shortcut

---

## Common Issues

### "npm is not recognized"
- Install Node.js from: https://nodejs.org/
- Restart your terminal/command prompt
- Try again

### Build takes forever
- First build is always slow (downloading dependencies)
- Subsequent builds are much faster
- You can cancel with `Ctrl+C` and restart if it hangs

### App won't start
- Make sure you ran `npm install` first
- Check that you're in the correct folder
- Try: `npm install electron --force`

---

## Next Steps

### Customize Your App

1. **Change the name/version**: Edit [package.json](package.json)
2. **Add custom icon**: Place `icon.png` and `icon.ico` in the `assets` folder (see `assets/ICON-README.txt`)
3. **Modify themes**: Edit [styles.css](styles.css)
4. **Change default content**: Edit the welcome message in [script.js](script.js:289)

### Share Your App

The installers in `dist` can be:
- Copied to other computers
- Shared via cloud storage
- Distributed to friends/colleagues

No additional setup needed on other computers!

---

## File Size Reference

- **Source code**: ~500 KB
- **node_modules**: ~200 MB (development only, not in final app)
- **Each installer**: ~150-200 MB (includes Chromium engine)
- **Installed app**: ~150-200 MB

The large size is because Electron bundles a full Chromium browser engine, making your app truly standalone without requiring anything else installed.

---

## Support

Need help? Check:
- Full documentation: [README.md](README.md)
- Icon setup: [assets/ICON-README.txt](assets/ICON-README.txt)
- Electron docs: https://www.electronjs.org/docs

Enjoy your beautiful markdown reader! 📖✨
