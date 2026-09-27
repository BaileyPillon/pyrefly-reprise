#!/bin/bash
# Hi-fi round: house backdrop, third/fourth tries (after LOOKING and composing: house core p1/p2 and core.1 all have a
# low camera with the floor only in the bottom sixth, so the fighters float above it once FF7's HUD band covers the
# bottom 29 %). animagine img2img from OUR OWN film render film/core/p2.full.png, which has the raised camera.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-hifi
g() { $PY -s gen.py "$@" 2>&1 | tail -c 400; }
g sdxl $C/film/core/p2.full.png $C/house/core/p3 713011 0.55 1.5 0.35 house-core
g sdxl $C/film/core/p2.full.png $C/house/core/p4 713012 0.65 1.5 0.35 house-core
echo DONE
