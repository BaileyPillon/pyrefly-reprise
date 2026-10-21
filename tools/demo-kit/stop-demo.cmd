@echo off
REM Stops the booth demo: closes the browser it opened and stops the server (by PID).
REM   stop-demo.cmd [--wipe]   (--wipe also deletes the browser profile, i.e. the save)
REM docs/DEMO-KIT.md
where node >nul 2>nul
if errorlevel 1 (echo Node.js was not found on this PC. Install it from nodejs.org, then run this again. & pause & exit /b 1)
node "%~dp0demo-kit.mjs" stop %*
if errorlevel 1 (echo. & echo That did not work: read the message above. & pause & exit /b 1)
timeout /t 5 >nul 2>nul
