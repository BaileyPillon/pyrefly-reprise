@echo off
REM Fresh visitor: closes the kiosk browser, wipes its profile (the save and the demo counters), opens it again.
REM docs/DEMO-KIT.md
where node >nul 2>nul
if errorlevel 1 (echo Node.js was not found on this PC. Install it from nodejs.org, then run this again. & pause & exit /b 1)
node "%~dp0demo-kit.mjs" reset %*
if errorlevel 1 (echo. & echo That did not work: read the message above. & pause & exit /b 1)
timeout /t 5 >nul 2>nul
