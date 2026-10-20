@echo off
REM Says whether the demo server and browser are running.
REM docs/DEMO-KIT.md
where node >nul 2>nul
if errorlevel 1 (echo Node.js was not found on this PC. Install it from nodejs.org, then run this again. & pause & exit /b 1)
node "%~dp0demo-kit.mjs" status %*
if errorlevel 1 (echo. & echo That did not work: read the message above. & pause)
