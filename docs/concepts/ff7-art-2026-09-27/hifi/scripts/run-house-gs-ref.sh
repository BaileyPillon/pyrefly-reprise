#!/bin/bash
# Hi-fi round: house Guard Scorpion third/fourth tries (after LOOKING: p1 has no twin rifles and drew a stray beam
# across the frame, p2 grew blades and lost its legs). animagine img2img from OUR OWN film render
# film/gs/p1.full.png (six legs, twin rifles under the head, sensor eye, disc on the back, raised tail + lens).
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-hifi
g() { $PY -s gen.py "$@" 2>&1 | tail -c 400; }
g sdxl $C/film/gs/p1.full.png $C/house/gs/p3 712011 0.50 1.75 0.38 house-gs
g sdxl $C/film/gs/p1.full.png $C/house/gs/p4 712012 0.58 1.75 0.38 house-gs
echo DONE
