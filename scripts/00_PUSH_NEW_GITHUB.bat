@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0.."
echo ====================================================
echo DOC-FULL-NR V21.4 R2 - PUSH TO NEW GITHUB REPOSITORY
echo ====================================================
where git >nul 2>&1 || (echo [ERROR] Git not found. Install Git for Windows first. & pause & exit /b 1)
if not exist .git git init
set /p REPO_URL=Paste NEW GitHub repository URL: 
if "%REPO_URL%"=="" (echo [ERROR] Repository URL is required. & pause & exit /b 1)
git add .
git commit -m "DOC-FULL-NR V21.4 R2 complete full source" 2>nul || echo [INFO] Nothing new to commit or commit already exists.
git branch -M main
git remote remove origin >nul 2>&1
git remote add origin "%REPO_URL%"
git push -u origin main
if errorlevel 1 (echo [ERROR] Push failed. Check GitHub login, permissions, and repository URL. & pause & exit /b 1)
echo.
echo [SUCCESS] Full source pushed to NEW GitHub repository.
echo Next: Repository Settings ^> Pages ^> Source = GitHub Actions
echo Then open Actions and confirm "Deploy DOC-FULL-NR FINAL" is green.
pause
