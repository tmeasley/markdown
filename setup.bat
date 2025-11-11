@echo off
echo ======================================
echo Markdown Reader - Setup Script
echo ======================================
echo.

echo Installing dependencies...
echo This may take a few minutes on first run.
echo.

npm install

echo.
echo ======================================
echo Setup complete!
echo ======================================
echo.
echo Next steps:
echo   npm start       - Run the app in development mode
echo   npm run build   - Build installers for Windows x64 + ARM64
echo.
echo The installers will be in the 'dist' folder.
echo.
pause
