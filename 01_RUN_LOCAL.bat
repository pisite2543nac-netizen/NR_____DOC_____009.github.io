@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0site"
where python >nul 2>&1
if errorlevel 1 (
  where py >nul 2>&1
  if errorlevel 1 (
    echo [ERROR] Python not found.
    pause
    exit /b 1
  )
  start "" "http://127.0.0.1:8787/"
  py -m http.server 8787 --bind 127.0.0.1
  exit /b %errorlevel%
)
start "" "http://127.0.0.1:8787/"
python -m http.server 8787 --bind 127.0.0.1
