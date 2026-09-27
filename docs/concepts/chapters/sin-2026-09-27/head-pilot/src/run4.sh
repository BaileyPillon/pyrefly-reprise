#!/bin/bash
# Sin head pilot, pass 4: the heal pass for option C's mouth stages (stages.py edit -> this -> stages.py blend).
# Whole-picture img2img at 0.42 from the jaw-turned painting, seed of the pick; only the jaw area is kept.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-sin
g() { $PY -s gen.py "$@" 2>&1 | tail -c 300; }
g sdxl $C/C/stages/C-m0.edit.png $C/C/stages/C-m0 927131 0.42 1.75 0.30 sin-C-shut
g sdxl $C/C/stages/C-m1.edit.png $C/C/stages/C-m1 927131 0.42 1.75 0.30 sin-C
g sdxl $C/C/stages/C-m3.edit.png $C/C/stages/C-m3 927131 0.42 1.75 0.30 sin-C-open
g sdxl $C/C/stages/C-m4.edit.png $C/C/stages/C-m4 927131 0.42 1.75 0.30 sin-C-open
python stages.py blend $C/C/p2.full.png $C/C/stages C
echo DONE
