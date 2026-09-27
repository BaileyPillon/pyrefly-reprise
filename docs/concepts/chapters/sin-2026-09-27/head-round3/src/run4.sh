#!/bin/bash
# Round 3, pass 4: the CREATURE painted into plate p6 (masked repaint inside its silhouette only), mouth fully open,
# from our sketch (prep.py pastes the sketch into the plate). Two strengths, two seeds.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-sin/round3
m() { $PY -s gen.py mouth $C/sin/comp-sin.png $C/sin/mask-sin.png $C/plate/p6.full.png $C/sin/mask-sin-full.png "$@" 2>&1 | tail -c 300; }
m $C/sin/a1 930401 0.66 0.30 sin
m $C/sin/a2 930411 0.74 0.30 sin
echo DONE
