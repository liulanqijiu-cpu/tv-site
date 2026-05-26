@echo off
set "PY=C:\Users\Administrator\AppData\Local\Programs\Python\Python311\python.exe"
set "SCRIPT=C:\Users\Administrator\Desktop\tv-site\tools\baidu_transfer.py"

echo.
echo ========================================
echo   Baidu Save -^> /transfer
echo ========================================
echo.

set /p LINK="Paste link: "
set /p PWD="Password (enter if none): "

echo.
echo Saving...

if "%PWD%"=="" (
    %PY% "%SCRIPT%" "%LINK%"
) else (
    %PY% "%SCRIPT%" "%LINK%" "%PWD%"
)

echo.
echo ========================================
pause
