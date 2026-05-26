@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo  ┌──────────────────────────────────────┐
echo  │  链接转存 + 格式化工具               │
echo  │  1. 先把链接填到 links.txt           │
echo  │  2. 跟着提示操作                      │
echo  │  3. 结果在 output.txt                │
echo  └──────────────────────────────────────┘
echo.
node save-links.js
pause
