#!/bin/bash
# Round 3, pass 3 (after LOOKING at pass 2: p3 has the best tower and deck yet, but the tower's top is still 130 px
# above the claw's place in the sketch): the v3 words (the top level with the horizon) at lower strengths.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-sin/round3
g() { $PY -s gen.py "$@" 2>&1 | tail -c 300; }
g whole zimg $C/sketches/sketch-plate.png $C/plate/p5 930101 0.50 1.75 0.30 plate3
g whole zimg $C/sketches/sketch-plate.png $C/plate/p6 930131 0.46 1.75 0.30 plate3
echo DONE
