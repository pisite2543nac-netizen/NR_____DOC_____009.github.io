@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"
where python >nul 2>&1 || (echo [ERROR] Python not found. & pause & exit /b 1)
where node >nul 2>&1 || (echo [ERROR] Node.js not found. & pause & exit /b 1)
python tests\v23_desktop_console_contract.py
if errorlevel 1 (pause & exit /b 1)
node --check site\app.js
if errorlevel 1 (pause & exit /b 1)
echo.
echo [PASS] V23 Desktop/Tablet production validation passed.
pause
