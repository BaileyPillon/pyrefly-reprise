#!/bin/bash
# Sin head pilot, pass 3 (after LOOKING at passes 1 and 2): B is the weakest option (pass 2 turned its mouth
# band into a glitch pattern), so two more B renders at pass 1's strength with the pass 2 prompt; one more D
# (pass 2's D p2 drew people on the deck, D p3 a vertical beam through the head). Same GPU rules as run1.sh.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-sin
g() { $PY -s gen.py "$@" 2>&1 | tail -c 300; }
g sdxl $C/sketches/sketch-B-m2.png $C/B/p4 927221 0.80 1.75 0.35 sin-B
g sdxl $C/sketches/sketch-B-m2.png $C/B/p5 927226 0.82 1.75 0.35 sin-B
g sdxl $C/sketches/sketch-D-m2.png $C/D/p4 927241 0.76 1.75 0.35 sin-D
echo DONE
