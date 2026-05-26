@echo off
set "TOOL=C:\Users\Administrator\Desktop\tv-site\tools\baidupcs-go\BaiduPCS-Go-v4.0.1-windows-x64\BaiduPCS-Go.exe"

echo.
echo ========================================
echo   Baidu Share
echo ========================================
echo.

set /p NAME="File/folder name in /自动转存/: "

echo.
echo Creating share link for /自动转存/%NAME%...
%TOOL% share set "/自动转存/%NAME%"

echo.
echo ========================================
echo   Copy the link above!
echo ========================================
pause
