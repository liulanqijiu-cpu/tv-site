@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo ========================================
echo   发布网站到 GitHub Pages
echo ========================================
echo.

echo [1/3] 添加文件...
git add data.js
if %errorlevel% neq 0 (
  echo 错误：git add 失败！
  pause
  exit /b 1
)

echo [2/3] 提交...
git commit -m "更新剧集 %date%"
if %errorlevel% neq 0 (
  echo 提交失败或没有变更，尝试继续推送...
)

echo [3/3] 推送到 GitHub...
git push
if %errorlevel% neq 0 (
  echo.
  echo ========================================
  echo   推送失败！请检查网络后重试
  echo ========================================
  echo.
  pause
  exit /b 1
)

echo.
echo ========================================
echo   完成！1-2分钟后刷新网站即可看到更新
echo   https://liulanqijiu-cpu.github.io/tv-site/
echo ========================================
echo.

pause
