#!/bin/bash
# Round 3, pass 6 (after LOOKING at pass 5: b1 at 0.62 is the best creature yet, organic head, both wings, claw on the
# tower; but a pipe in the near wing, a hose-like loop and a cog on the cheek, and string-like streaks in the throat;
# b2 blocky, b3 cobblestones): two more seeds at 0.62 before choosing between them and repairing b1.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-sin/round3
m() { $PY -s gen.py mouth $C/sin/comp-sin.png $C/sin/mask-sin.png $C/plate/p6.full.png $C/sin/mask-sin-full.png "$@" 2>&1 | tail -c 300; }
m $C/sin/b4 930521 0.62 0.30 sin2
m $C/sin/b5 930531 0.60 0.30 sin2
echo DONE
