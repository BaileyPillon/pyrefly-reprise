#!/bin/bash
# Head C, pass 4 (FFX only): the stage-0 SHUT-LIP patch. A masked repaint of the seam band only (repair.py lip-prep:
# from just above the painted upper lip to just below it, snout to hinge), on a 700x400 crop of the stage-0 composite,
# upscaled to 1344x768. A static layer shown only while the mouth is shut. Two strengths.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-29-sin/head-c/rig
$PY -s gen.py patch $C/lip-crop.png $C/lip-mask.png $C/lip-1 292201 0.55 lips 2>&1 | tail -c 300
$PY -s gen.py patch $C/lip-crop.png $C/lip-mask.png $C/lip-2 292211 0.66 lips 2>&1 | tail -c 300
echo DONE
