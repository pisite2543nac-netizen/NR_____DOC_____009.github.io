@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"

set "REPO_URL=https://github.com/pisite2543nac-netizen/NR_____DOC_____009.github.io.git"
set "REPO_WEB=https://github.com/pisite2543nac-netizen/NR_____DOC_____009.github.io"
set "PAGES_URL=https://pisite2543nac-netizen.github.io/NR_____DOC_____009.github.io/"

echo ====================================================
echo DOC-FULL-NR V23 - ONE CLICK DESKTOP/TABLET DEPLOY
echo ====================================================
echo Repository is fixed. No URL input is required.
echo Mobile runtime is removed from the deployed site.
echo.

where git >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Git for Windows was not found.
  echo Install Git for Windows once, then run this file again.
  pause
  exit /b 1
)

git config user.name >nul 2>&1
if errorlevel 1 git config user.name "DOC-FULL-NR Release"
git config user.email >nul 2>&1
if errorlevel 1 git config user.email "doc-full-nr@users.noreply.github.com"

echo [1/6] Checking fixed GitHub repository...
git ls-remote "%REPO_URL%" refs/heads/main > "%TEMP%\docnr_v23_remote.txt" 2>nul
if errorlevel 1 (
  echo [ERROR] GitHub repository cannot be reached.
  echo Sign in to GitHub/Git Credential Manager if Windows asks, then run again.
  echo Repository: %REPO_URL%
  del "%TEMP%\docnr_v23_remote.txt" >nul 2>&1
  pause
  exit /b 1
)

set "REMOTE_SHA="
for /f "tokens=1" %%S in (%TEMP%\docnr_v23_remote.txt) do set "REMOTE_SHA=%%S"
del "%TEMP%\docnr_v23_remote.txt" >nul 2>&1

if not exist .git (
  echo [2/6] Initializing local Git workspace...
  git init >nul
) else (
  echo [2/6] Local Git workspace found.
)

git branch -M main >nul 2>&1
git remote remove origin >nul 2>&1
git remote add origin "%REPO_URL%"

echo [3/6] Staging V23 full source and new production UI...
git add -A

git diff --cached --quiet
if errorlevel 1 (
  echo [4/6] Creating V23 Desktop/Tablet production commit...
  git commit -m "DOC-FULL-NR V23 desktop tablet production console"
  if errorlevel 1 (
    echo [ERROR] Git commit failed.
    pause
    exit /b 1
  )
) else (
  echo [4/6] No new local changes to commit. Using current V23 commit.
)

echo [5/6] Publishing V23 to GitHub main...
if "%REMOTE_SHA%"=="" (
  git push -u origin main
) else (
  git push -u --force-with-lease=refs/heads/main:%REMOTE_SHA% origin main:main
)
if errorlevel 1 (
  echo [ERROR] GitHub update failed.
  echo Check GitHub login/permission, then run this file again.
  pause
  exit /b 1
)

echo [6/6] Push complete. GitHub Actions deployment has been triggered.
echo.
echo ====================================================
echo [SUCCESS] DOC-FULL-NR V23 WAS PUBLISHED
echo Repository: %REPO_WEB%
echo Pages URL : %PAGES_URL%
echo ====================================================
echo.
echo The Actions page will open first. Wait for the V23 workflow to turn green.
start "" "%REPO_WEB%/actions"
timeout /t 4 /nobreak >nul
start "" "%PAGES_URL%"
echo.
echo IMPORTANT: Use the Pages URL shown above, not the old root github.io site.
pause
