#!/bin/bash
# Head C, pass 3 (FFX only): after LOOKING at pass 2 (0.42 even teeth, but our seam line ran on into the sky and the
# chin front was square): the sketch gains a rounded chin cap and keeps the line inside the creature. Two strengths.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-29-sin/head-c
$PY -s gen.py patch $C/tusk-sketched.png $C/tusk-mask.png $C/tusk-5 292141 0.42 tusk 2>&1 | tail -c 300
$PY -s gen.py patch $C/tusk-sketched.png $C/tusk-mask.png $C/tusk-6 292151 0.48 tusk 2>&1 | tail -c 300
echo DONE
