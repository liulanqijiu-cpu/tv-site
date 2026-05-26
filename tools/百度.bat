@echo off
cd /d "%~dp0"
set "BAIDUPCS_GO_VERBOSE=1"
"%~dp0baidupcs-go\BaiduPCS-Go-v4.0.1-windows-x64\BaiduPCS-Go.exe"
pause
