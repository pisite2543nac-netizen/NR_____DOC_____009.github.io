@echo off
setlocal EnableExtensions
cd /d "%~dp0"
call "00_ONE_CLICK_UPDATE_GITHUB.bat"
exit /b %errorlevel%
