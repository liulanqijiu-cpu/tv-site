@echo off
chcp 65001 >nul
set GIT="C:\Program Files\Git\bin\git.exe"
cd /d "%~dp0"

echo.
echo ========================================
echo   Publish to GitHub Pages
echo ========================================
echo.

echo [1/3] Checking for changes...
%GIT% diff --quiet data.js index.html
if %errorlevel%==0 (
    echo   No changes detected in data.js or index.html
    echo   Nothing to publish.
    goto end
)
echo   Changes detected, proceeding...

echo.
echo [2/4] Adding files...
%GIT% add data.js index.html
if %errorlevel% neq 0 (
    echo   ERROR: git add failed!
    goto end
)

echo [3/4] Committing...
%GIT% commit -m "update %date%"
if %errorlevel% neq 0 (
    echo   ERROR: git commit failed! Check git config (user.name / user.email)
    goto end
)

echo [4/4] Pushing...
%GIT% push
if %errorlevel% neq 0 (
    echo   ERROR: git push failed! Check network or remote repo.
    goto end
)

echo.
echo ========================================
echo   Done! Site will update in 1-2 minutes
echo   https://liulanqijiu-cpu.github.io/tv-site/
echo ========================================

:end
echo.
pause
