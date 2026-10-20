@echo off
REM Makes the booth's offline copy of the site from the live site's own files (checked against the deploy's manifest, no build).
REM   fetch-site.cmd [--dir <folder>] [--max-tier 2] [--dry-run] [--verify-only] [--manifest live]
REM docs/DEMO-KIT.md
where node >nul 2>nul
if errorlevel 1 (echo Node.js was not found on this PC. Install it from nodejs.org, then run this again. & pause & exit /b 1)
node "%~dp0fetch-site.mjs" %*
if errorlevel 1 (echo. & echo That did not finish cleanly: read the message above. & pause)
