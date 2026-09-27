#!/bin/bash
# Round 3, pass 5 (after LOOKING at pass 4: a1 at 0.66 is the better base; a2 at 0.74 turned mechanical): the v2 words,
# 0.62 and 0.66, new seeds.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-sin/round3
m() { $PY -s gen.py mouth $C/sin/comp-sin.png $C/sin/mask-sin.png $C/plate/p6.full.png $C/sin/mask-sin-full.png "$@" 2>&1 | tail -c 300; }
m $C/sin/b1 930501 0.62 0.30 sin2
m $C/sin/b2 930511 0.66 0.30 sin2
m $C/sin/b3 930401 0.66 0.30 sin2
echo DONE
