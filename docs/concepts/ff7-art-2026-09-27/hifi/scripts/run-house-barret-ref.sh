#!/bin/bash
# Hi-fi round: house Barret third/fourth tries (after LOOKING: p1 drew no gun-arm at all, p2 cradles a loose gun
# in both arms). animagine img2img from OUR OWN film render film/barret/p1.full.png, which has the grafted
# gun-arm on the near (right) arm, the far hand a fist, and the hi-top fade.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-hifi
g() { $PY -s gen.py "$@" 2>&1 | tail -c 400; }
g sdxl $C/film/barret/p1.full.png $C/house/barret/p3 711011 0.55 1.75 0.38 house-barret
g sdxl $C/film/barret/p1.full.png $C/house/barret/p4 711012 0.62 1.75 0.38 house-barret
echo DONE
