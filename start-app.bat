@echo off
setlocal enabledelayedexpansion
title CarBikeKharido.com - App Launcher
color 0B

:: Ensure script is running from the project directory
cd /d "%~dp0"

echo ==============================================================================
echo                      CARBIKEKHARIDO.COM - PLATFORM
echo ==============================================================================
echo.
echo   [DEFAULT CREDENTIALS FOR STARTUP LOGIN]
echo   -------------------------------------------------
echo   * User ID  : Admin
echo   * Password : CardRk9876@
echo.
echo ==============================================================================
echo.

:: 1. Check Node.js installation
echo [1/3] Checking Node.js environment...
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js is not found in your PATH!
    echo Please download and install Node.js (v18 or v20+) from: https://nodejs.org/
    echo.
    goto :ERROR_EXIT
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo   -- Node.js detected: !NODE_VER!
echo.

:: 2. Check dependencies (only install if node_modules is missing)
if not exist "node_modules\" (
    echo [2/3] Installing dependencies via npm install...
    call npm install
    if %errorlevel% neq 0 (
        color 0C
        echo [ERROR] npm install encountered an error.
        goto :ERROR_EXIT
    )
) else (
    echo [2/3] Dependencies verified.
)
echo.

:: 3. Start Next.js Development Server
echo [3/3] Starting Next.js server on http://localhost:3000...
echo.
echo ==============================================================================
echo   Server URL : http://localhost:3000
echo   To Stop    : Press Ctrl + C in this window
echo ==============================================================================
echo.

:: Open browser after 2 seconds in background
start "" /b cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"

:: Run development server
call npm run dev

if %errorlevel% neq 0 (
    color 0C
    echo.
    echo [ERROR] Next.js server stopped with error code %errorlevel%.
)

:ERROR_EXIT
echo.
echo Press any key to close this window...
pause >nul
