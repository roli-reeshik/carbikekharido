@echo off
setlocal enabledelayedexpansion
title CarBikeKharido - Netlify Deploy
color 0A

cd /d "%~dp0"

echo ==============================================================================
echo                      CARBIKEKHARIDO - NETLIFY DEPLOY
echo ==============================================================================
echo.
echo  Step 1: Logging in to Netlify (A browser window will open to authenticate)
echo.
call npx -y netlify-cli login

echo.
echo  Step 2: Deploying project to Netlify Production...
echo.
call npx -y netlify-cli deploy --prod --build

if %errorlevel% neq 0 (
    color 0C
    echo.
    echo [ERROR] Netlify deployment failed.
) else (
    echo.
    echo ==============================================================================
    echo  [SUCCESS] Deployment complete! Your live URL is displayed above.
    echo ==============================================================================
)

echo.
echo Press any key to close...
pause >nul
