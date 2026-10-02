@echo off
rem Pyrefly Reprise - CAMERA LAB (a test build, branch camera-lab; D-318).
rem Serves dist-lab on http://127.0.0.1:5270/ and opens your browser at the lab.
rem Closing this window stops the server.
title Pyrefly Reprise - Camera Lab (test build)
cd /d "%~dp0"
if not exist "dist-lab\index.html" (
  echo dist-lab is missing: building it once...
  node tools\lab\build-lab.mjs
  if errorlevel 1 (
    echo The build failed.
    pause
    exit /b 1
  )
)
echo Camera lab: http://127.0.0.1:5270/  - close this window to stop it.
node tools\lab\serve-lab.mjs --port 5270 --open
