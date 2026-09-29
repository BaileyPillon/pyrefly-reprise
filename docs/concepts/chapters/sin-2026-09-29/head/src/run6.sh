#!/bin/bash
# Head A, pass 2 (FFX only): after LOOKING at a1-a3 (a chubby plush-toy face, a cartoon grin, small not colossal): the
# sketch gains rock-scale rows, crags, a scowling V brow, small slanted deep-set eyes, whale pleats and many short teeth;
# the words (head-a2) ask for mountain scale, age and a cliff-like hide. Two strengths.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-29-sin/head-a/v2
P6=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-sin/round3/plate/p6.full.png
m() { $PY -s gen.py mouth $C/comp-a.png $C/mask-a.png $P6 $C/mask-a-full.png "$@" 2>&1 | tail -c 300; }
m $C/a4 292331 0.62 0.30 head-a2
m $C/a5 292341 0.70 0.30 head-a2
echo DONE
