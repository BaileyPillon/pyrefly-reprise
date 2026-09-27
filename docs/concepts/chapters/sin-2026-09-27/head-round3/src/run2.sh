#!/bin/bash
# Round 3, pass 2 (after LOOKING at pass 1: good deck and a tall white tower, but the tower grew far above the claw's
# place in the sketch): the plate with the v2 words (the tower's top halfway up the picture) and lower strengths.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-sin/round3
g() { $PY -s gen.py "$@" 2>&1 | tail -c 300; }
g whole zimg $C/sketches/sketch-plate.png $C/plate/p3 930101 0.55 1.75 0.30 plate2
g whole zimg $C/sketches/sketch-plate.png $C/plate/p4 930121 0.60 1.75 0.30 plate2
echo DONE
