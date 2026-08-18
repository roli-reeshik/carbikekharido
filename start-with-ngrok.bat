@echo off
cd /d "%~dp0"
title CarBikeKharido - App + ngrok Live Launcher
color 0A

echo ==============================================================================
echo             CARBIKEKHARIDO.COM - APP + NGROK LIVE LAUNCHER
echo ==============================================================================
echo.
echo 1. Launching App in a new window...
start "CarBikeKharido App" cmd /c "cd /d "%~dp0" && call start-app.bat"

echo 2. Waiting 5 seconds for Next.js server to initialize...
timeout /t 5 /nobreak >nul

echo 3. Starting ngrok tunnel on port 3000...
echo.
.\ngrok.exe http 3000

echo.
pause
