@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo ========================================
echo   发布网站到 GitHub Pages
echo ========================================
echo.

git add data.js
git commit -m "更新剧集 %date%"

echo.
echo 正在推送到 GitHub...
git push

echo.
echo ========================================
echo   完成！网站将在1-2分钟内更新
echo ========================================
echo.

pause
