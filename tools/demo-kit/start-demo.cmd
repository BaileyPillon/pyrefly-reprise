@echo off
REM Starts the booth demo: serves the offline copy of the site and opens it full screen (kiosk) with ?demo=1.
REM   start-demo.cmd [--dir <folder>] [--port 5173] [--browser chrome^|edge] [--no-kiosk] [--keep-profile]
REM docs/DEMO-KIT.md
where node >nul 2>nul
if errorlevel 1 (echo Node.js was not found on this PC. Install it from nodejs.org, then run this again. & pause & exit /b 1)
node "%~dp0demo-kit.mjs" start %*
if errorlevel 1 (echo. & echo That did not work: read the message above. & pause)
