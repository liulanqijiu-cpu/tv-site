@echo off
set GIT="C:\Program Files\Git\bin\git.exe"
cd /d "%~dp0"

echo.
echo ========================================
echo   Publish to GitHub Pages
echo ========================================
echo.

echo [1/3] Adding files...
%GIT% add data.js

echo [2/3] Committing...
%GIT% commit -m "update %date%"

echo [3/3] Pushing...
%GIT% push

echo.
echo ========================================
echo   Done! Site will update in 1-2 minutes
echo   https://liulanqijiu-cpu.github.io/tv-site/
echo ========================================
echo.

pause
