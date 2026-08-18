@echo off
setlocal enabledelayedexpansion
title Push to GitHub - CarBikeKharido
color 0B

cd /d "%~dp0"

echo ==============================================================================
echo                      PUSH CARBIKEKHARIDO TO GITHUB
echo ==============================================================================
echo.

echo [1/6] Setting Git identity...
git config --global user.name "roli-reeshik"
git config --global user.email "roli-reeshik@users.noreply.github.com"
git config user.name "roli-reeshik"
git config user.email "roli-reeshik@users.noreply.github.com"

echo [2/6] Configuring Git safe directory...
git config --global --add safe.directory "%~dp0"
git config --global --add safe.directory "E:/carbikedekho1"
git config --global --add safe.directory "*"

echo [3/6] Staging files...
git add .

echo [4/6] Committing changes...
git commit -m "Update CarBikeKharido full platform"

echo [5/6] Setting branch to main...
git branch -M main

echo [6/6] Configuring remote repository...
git remote remove origin 2>nul
git remote add origin https://github.com/roli-reeshik/carbikekharido.git

echo.
echo Pushing to GitHub (https://github.com/roli-reeshik/carbikekharido.git)...
echo.
git push -u origin main --force

if %errorlevel% neq 0 (
    color 0C
    echo.
    echo [ERROR] Push failed. If prompted, please complete authentication in your browser window.
) else (
    echo.
    echo ==============================================================================
    echo  [SUCCESS] All files uploaded to https://github.com/roli-reeshik/carbikekharido
    echo ==============================================================================
)

echo.
echo Press any key to close...
pause >nul
