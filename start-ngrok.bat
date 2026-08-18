@echo off
title CarBikeKharido - ngrok Live Tunnel
color 0A

echo ==============================================================================
echo                      CARBIKEKHARIDO - NGROK LIVE TUNNEL
echo ==============================================================================
echo.
echo Starting ngrok tunnel on port 3000...
echo Make sure your Next.js app is already running (via npm run dev or start-app.bat)!
echo.
echo If you have not added your authtoken yet, run:
echo   ngrok config add-authtoken ^<YOUR_AUTH_TOKEN^>
echo.
echo ==============================================================================
echo.

.\ngrok.exe http 3000
pause
